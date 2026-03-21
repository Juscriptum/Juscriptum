import { Injectable, Logger, OnModuleDestroy, Optional } from "@nestjs/common";
import * as crypto from "crypto";
import Database = require("better-sqlite3");
import { createReadStream } from "fs";
import { mkdir, readdir, rm, stat } from "fs/promises";
import * as iconv from "iconv-lite";
import * as path from "path";
import * as readline from "readline";
import { Transform } from "stream";
import {
  cleanupPreparedSourceImportPlan,
  finalizePreparedSourceImportPlan,
  prepareSourceImportPlan,
  shouldDeleteImportedSourceFiles,
} from "./registry-source-import-preparation";
import {
  ASVP_SOURCE_LABEL,
  COURT_REGISTRY_SOURCE_LABEL,
} from "../../clients/services/court-registry.service";
import type {
  CourtDateSearchResult,
  CourtRegistrySearchOptions,
  CourtRegistrySearchResult,
} from "../../clients/services/court-registry.service";

type ImportSourceCode = "court_stan" | "asvp" | "court_dates";

export interface ImportStateRecord {
  source_code: string;
  dataset_url?: string | null;
  resource_name?: string | null;
  resource_url?: string | null;
  remote_updated_at?: string | null;
  remote_fingerprint?: string | null;
  local_file_hash?: string | null;
  extracted_hash?: string | null;
  last_downloaded_at?: string | null;
  last_indexed_at?: string | null;
  last_success_at?: string | null;
  last_status?: string | null;
  last_error?: string | null;
  rows_imported?: number | null;
}

interface SqliteDatabase {
  pragma(value: string): unknown;
  exec(sql: string): unknown;
  prepare(sql: string): {
    run: (...params: any[]) => any;
    get: (...params: any[]) => any;
    all: (...params: any[]) => any[];
  };
  transaction<T extends (...args: any[]) => any>(fn: T): T;
  close(): void;
}

interface CourtRegistryRow {
  court_name: string;
  case_number: string;
  case_proc: string;
  registration_date: string;
  judge: string;
  judges: string;
  participants: string;
  stage_date: string;
  stage_name: string;
  cause_result: string;
  cause_dep: string;
  type: string;
  description: string;
}

interface AsvpRegistryRow {
  DEBTOR_NAME: string;
  DEBTOR_BIRTHDATE: string;
  DEBTOR_CODE: string;
  CREDITOR_NAME: string;
  CREDITOR_CODE: string;
  VP_ORDERNUM: string;
  VP_BEGINDATE: string;
  VP_STATE: string;
  ORG_NAME: string;
  DVS_CODE: string;
  PHONE_NUM: string;
  EMAIL_ADDR: string;
  BANK_ACCOUNT: string;
}

interface CourtDateRow {
  date: string;
  judges: string;
  case: string;
  court_name: string;
  court_room: string;
  case_involved: string;
  case_description: string;
}

@Injectable()
export class RegistryIndexService implements OnModuleDestroy {
  private readonly logger = new Logger(RegistryIndexService.name);
  private readonly dbPath: string;
  private readonly courtStanDirectory: string;
  private readonly asvpDirectory: string;
  private readonly courtDatesDirectory: string;
  private readonly batchSize: number;
  private readonly deleteImportedSourceFiles: Record<ImportSourceCode, boolean>;
  private readonly sourceRebuilds = new Map<ImportSourceCode, Promise<void>>();
  private db: SqliteDatabase | null = null;

  constructor(@Optional() dbPath?: string) {
    this.dbPath =
      dbPath || path.resolve(process.cwd(), "storage", "registry-index.db");
    this.courtStanDirectory = path.resolve(process.cwd(), "court_stan");
    this.asvpDirectory = path.resolve(process.cwd(), "asvp");
    this.courtDatesDirectory = path.resolve(process.cwd(), "court_dates");
    this.batchSize = Number(process.env.REGISTRY_INDEX_BATCH_SIZE || "1000");
    this.deleteImportedSourceFiles = {
      court_stan: shouldDeleteImportedSourceFiles("court_stan"),
      asvp: shouldDeleteImportedSourceFiles("asvp"),
      court_dates: shouldDeleteImportedSourceFiles("court_dates"),
    };
  }

  onModuleDestroy(): void {
    this.db?.close();
    this.db = null;
  }

  async ensureInitialized(): Promise<void> {
    if (this.db) {
      return;
    }

    await mkdir(path.dirname(this.dbPath), { recursive: true });
    const database = new Database(this.dbPath) as unknown as SqliteDatabase;
    database.pragma("journal_mode = WAL");
    database.pragma("synchronous = NORMAL");
    database.pragma("temp_store = MEMORY");
    database.pragma("busy_timeout = 5000");
    database.exec(`
      CREATE TABLE IF NOT EXISTS court_registry_participants (
        id INTEGER PRIMARY KEY,
        case_number TEXT,
        case_number_normalized TEXT,
        participant_raw TEXT,
        participant_normalized TEXT,
        participant_role TEXT NULL,
        court_name TEXT,
        case_proc TEXT,
        registration_date TEXT,
        judge TEXT,
        judges TEXT,
        stage_date TEXT,
        stage_name TEXT,
        record_type TEXT,
        case_description TEXT,
        participants TEXT,
        source_file TEXT,
        source_row_num INTEGER NULL,
        import_batch_id TEXT,
        created_at TEXT,
        updated_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_court_registry_case_number
        ON court_registry_participants(case_number_normalized);
      CREATE INDEX IF NOT EXISTS idx_court_registry_participant_normalized
        ON court_registry_participants(participant_normalized);
      CREATE VIRTUAL TABLE IF NOT EXISTS court_registry_participants_fts
        USING fts5(
          participant_raw,
          participant_normalized,
          content='court_registry_participants',
          content_rowid='id',
          tokenize='unicode61'
        );

      CREATE TABLE IF NOT EXISTS asvp_records (
        id INTEGER PRIMARY KEY,
        vp_ordernum TEXT,
        debtor_name TEXT,
        debtor_name_normalized TEXT,
        creditor_name TEXT,
        creditor_name_normalized TEXT,
        org_name TEXT,
        org_name_normalized TEXT,
        vp_begindate TEXT,
        vp_state TEXT,
        dvs_code TEXT,
        phone_num TEXT,
        email_addr TEXT,
        bank_account TEXT,
        source_file TEXT,
        source_row_num INTEGER NULL,
        import_batch_id TEXT,
        created_at TEXT,
        updated_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_asvp_vp_ordernum
        ON asvp_records(vp_ordernum);
      CREATE INDEX IF NOT EXISTS idx_asvp_debtor_name_normalized
        ON asvp_records(debtor_name_normalized);
      CREATE INDEX IF NOT EXISTS idx_asvp_creditor_name_normalized
        ON asvp_records(creditor_name_normalized);
      CREATE INDEX IF NOT EXISTS idx_asvp_org_name_normalized
        ON asvp_records(org_name_normalized);
      CREATE VIRTUAL TABLE IF NOT EXISTS asvp_records_fts
        USING fts5(
          debtor_name,
          debtor_name_normalized,
          creditor_name,
          creditor_name_normalized,
          org_name,
          org_name_normalized,
          content='asvp_records',
          content_rowid='id',
          tokenize='unicode61'
        );

      CREATE TABLE IF NOT EXISTS court_dates (
        id INTEGER PRIMARY KEY,
        case_number TEXT,
        case_number_normalized TEXT,
        date TEXT,
        judges TEXT,
        court_name TEXT,
        court_room TEXT,
        case_involved TEXT,
        case_description TEXT,
        source_file TEXT,
        source_row_num INTEGER NULL,
        import_batch_id TEXT,
        created_at TEXT,
        updated_at TEXT
      );
      DROP INDEX IF EXISTS idx_court_dates_case_number;
      CREATE INDEX IF NOT EXISTS idx_court_dates_case_number
        ON court_dates(case_number_normalized);

      CREATE TABLE IF NOT EXISTS import_state (
        source_code TEXT PRIMARY KEY,
        dataset_url TEXT,
        resource_name TEXT,
        resource_url TEXT,
        remote_updated_at TEXT NULL,
        remote_fingerprint TEXT NULL,
        local_file_hash TEXT NULL,
        extracted_hash TEXT NULL,
        last_downloaded_at TEXT NULL,
        last_indexed_at TEXT NULL,
        last_success_at TEXT NULL,
        last_status TEXT,
        last_error TEXT NULL,
        rows_imported INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS import_batches (
        id TEXT PRIMARY KEY,
        source_code TEXT,
        started_at TEXT,
        finished_at TEXT NULL,
        status TEXT,
        downloaded INTEGER,
        extracted INTEGER,
        indexed INTEGER,
        rows_processed INTEGER DEFAULT 0,
        error_message TEXT NULL
      );
    `);
    const importStateColumns = (
      database.prepare(`PRAGMA table_info(import_state)`).all() as Array<{
        name?: string;
      }>
    )
      .map((row) => row.name)
      .filter((value): value is string => Boolean(value));

    if (!importStateColumns.includes("remote_fingerprint")) {
      database.exec(
        `ALTER TABLE import_state ADD COLUMN remote_fingerprint TEXT NULL`,
      );
    }

    await this.migrateLegacyRegistrySchema(database);
    this.db = database;
  }

  async getImportState(sourceCode: string): Promise<ImportStateRecord | null> {
    await this.ensureInitialized();

    const row = this.getDb()
      .prepare(`SELECT * FROM import_state WHERE source_code = ? LIMIT 1`)
      .get(sourceCode) as ImportStateRecord | undefined;

    return row ?? null;
  }

  async upsertImportState(
    sourceCode: string,
    patch: Partial<ImportStateRecord>,
  ): Promise<void> {
    await this.ensureInitialized();

    const current = (await this.getImportState(sourceCode)) ?? {
      source_code: sourceCode,
    };

    const next: ImportStateRecord = {
      ...current,
      ...patch,
      source_code: sourceCode,
    };

    this.getDb()
      .prepare(
        `
        INSERT INTO import_state (
          source_code,
          dataset_url,
          resource_name,
          resource_url,
          remote_updated_at,
          remote_fingerprint,
          local_file_hash,
          extracted_hash,
          last_downloaded_at,
          last_indexed_at,
          last_success_at,
          last_status,
          last_error,
          rows_imported
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(source_code) DO UPDATE SET
          dataset_url = excluded.dataset_url,
          resource_name = excluded.resource_name,
          resource_url = excluded.resource_url,
          remote_updated_at = excluded.remote_updated_at,
          remote_fingerprint = excluded.remote_fingerprint,
          local_file_hash = excluded.local_file_hash,
          extracted_hash = excluded.extracted_hash,
          last_downloaded_at = excluded.last_downloaded_at,
          last_indexed_at = excluded.last_indexed_at,
          last_success_at = excluded.last_success_at,
          last_status = excluded.last_status,
          last_error = excluded.last_error,
          rows_imported = excluded.rows_imported
        `,
      )
      .run(
        next.source_code,
        next.dataset_url ?? null,
        next.resource_name ?? null,
        next.resource_url ?? null,
        next.remote_updated_at ?? null,
        next.remote_fingerprint ?? null,
        next.local_file_hash ?? null,
        next.extracted_hash ?? null,
        next.last_downloaded_at ?? null,
        next.last_indexed_at ?? null,
        next.last_success_at ?? null,
        next.last_status ?? null,
        next.last_error ?? null,
        next.rows_imported ?? 0,
      );
  }

  async isIndexAvailableFor(source: ImportSourceCode): Promise<boolean> {
    await this.ensureInitialized();
    const row = this.getDb()
      .prepare(
        `SELECT last_status, rows_imported FROM import_state WHERE source_code = ?`,
      )
      .get(source) as
      | { last_status?: string; rows_imported?: number }
      | undefined;

    return Boolean(row && row.last_status === "success" && row.rows_imported);
  }

  async rebuildIndexes(options?: {
    source?: ImportSourceCode;
    force?: boolean;
  }): Promise<void> {
    await this.ensureInitialized();

    const sources: ImportSourceCode[] = options?.source
      ? [options.source]
      : ["court_stan", "asvp", "court_dates"];

    for (const source of sources) {
      await this.runSourceRebuildSerialized(source, () =>
        this.rebuildSource(source, options?.force || false),
      );
    }

    this.compactWriteAheadLogIfPossible();
  }

  async searchCourtRegistry(
    options: CourtRegistrySearchOptions,
  ): Promise<CourtRegistrySearchResult[]> {
    await this.ensureInitialized();

    if (!(await this.isIndexAvailableFor("court_stan"))) {
      return [];
    }

    const normalizedQuery = this.normalizeSearchValue(options.query || "");
    const rows = this.queryCourtRegistryRows(options, normalizedQuery);

    return rows
      .filter((row) =>
        this.matchesCourtRowFilters(row, options, normalizedQuery),
      )
      .filter((row) =>
        this.matchesDateRange(row.registration_date || "", options),
      )
      .map((row) => ({
        source: "court_registry" as const,
        sourceLabel: COURT_REGISTRY_SOURCE_LABEL,
        person: row.participant_raw || "",
        role: row.participant_role || "",
        caseDescription: row.case_description || "",
        caseNumber: row.case_number || "",
        courtName: row.court_name || "",
        caseProc: row.case_proc || "",
        registrationDate: row.registration_date || "",
        judge: row.judge || "",
        type: row.record_type || "",
        stageDate: row.stage_date || "",
        stageName: row.stage_name || "",
        participants: row.participants || "",
      }))
      .slice(0, 200)
      .sort((left, right) =>
        this.compareSearchResults(left.person, right.person, normalizedQuery),
      );
  }

  async searchAsvpRegistry(
    options: CourtRegistrySearchOptions,
  ): Promise<CourtRegistrySearchResult[]> {
    await this.ensureInitialized();

    if (!(await this.isIndexAvailableFor("asvp"))) {
      return [];
    }

    const normalizedQuery = this.normalizeSearchValue(options.query || "");
    const rows = this.queryAsvpRows(options, normalizedQuery);

    const results: CourtRegistrySearchResult[] = [];

    rows
      .filter((row) =>
        this.matchesDateRange(row.vp_begindate || "", options, true),
      )
      .forEach((row) => {
        const debtorMatches =
          this.matchesSearchQuery(
            this.normalizeSearchValue(row.debtor_name || ""),
            normalizedQuery,
          ) && this.matchesAsvpRowFilters(row, options, "Боржник");
        const creditorMatches =
          this.matchesSearchQuery(
            this.normalizeSearchValue(row.creditor_name || ""),
            normalizedQuery,
          ) && this.matchesAsvpRowFilters(row, options, "Стягувач");

        if (debtorMatches) {
          results.push({
            source: "asvp",
            sourceLabel: ASVP_SOURCE_LABEL,
            person: row.debtor_name || "",
            role: "Боржник",
            caseDescription: row.vp_state || "",
            caseNumber: row.vp_ordernum || "",
            courtName: row.org_name || "",
            caseProc: row.dvs_code || "",
            registrationDate: row.vp_begindate || "",
            judge: "",
            type: "Виконавче провадження",
            stageDate: row.vp_begindate || "",
            stageName: "Виконавче провадження",
            participants: this.buildAsvpParticipants(
              row.creditor_name || "",
              row.debtor_name || "",
            ),
            counterpartyName: row.creditor_name || "",
            counterpartyRole: "Кредитор",
            enforcementState: row.vp_state || "",
          });
        }

        if (creditorMatches) {
          results.push({
            source: "asvp",
            sourceLabel: ASVP_SOURCE_LABEL,
            person: row.creditor_name || "",
            role: "Стягувач",
            caseDescription: row.vp_state || "",
            caseNumber: row.vp_ordernum || "",
            courtName: row.org_name || "",
            caseProc: row.dvs_code || "",
            registrationDate: row.vp_begindate || "",
            judge: "",
            type: "Виконавче провадження",
            stageDate: row.vp_begindate || "",
            stageName: "Виконавче провадження",
            participants: this.buildAsvpParticipants(
              row.creditor_name || "",
              row.debtor_name || "",
            ),
            counterpartyName: row.debtor_name || "",
            counterpartyRole: "Боржник",
            enforcementState: row.vp_state || "",
          });
        }
      });

    return results
      .slice(0, 200)
      .sort((left, right) =>
        this.compareSearchResults(left.person, right.person, normalizedQuery),
      );
  }

  async findCourtDateByCaseNumber(
    caseNumber: string,
  ): Promise<CourtDateSearchResult | null> {
    await this.ensureInitialized();

    if (!(await this.isIndexAvailableFor("court_dates"))) {
      return null;
    }

    const row = this.getDb()
      .prepare(
        `
        SELECT
          case_number,
          date,
          judges,
          court_name,
          court_room,
          case_involved,
          case_description
        FROM court_dates
        WHERE case_number_normalized = ?
        LIMIT 1
        `,
      )
      .get(this.normalizeCaseNumber(caseNumber)) as
      | Record<string, string>
      | undefined;

    if (!row) {
      return null;
    }

    return {
      date: row.date || "",
      judges: row.judges || "",
      caseNumber: row.case_number || "",
      courtName: row.court_name || "",
      courtRoom: row.court_room || "",
      caseInvolved: row.case_involved || "",
      caseDescription: row.case_description || "",
    };
  }

  private async rebuildSource(
    source: ImportSourceCode,
    force: boolean,
  ): Promise<void> {
    const files = await this.listSourceFiles(source);
    const currentState = this.getDb()
      .prepare(
        `
        SELECT extracted_hash, last_status, rows_imported
        FROM import_state
        WHERE source_code = ?
        LIMIT 1
        `,
      )
      .get(source) as
      | {
          extracted_hash?: string;
          last_status?: string;
          rows_imported?: number;
        }
      | undefined;

    if (files.length === 0) {
      if (
        currentState?.last_status === "success" &&
        (currentState.rows_imported || 0) > 0
      ) {
        this.logger.log(
          `Skipping ${source} index rebuild: no source files found, keeping existing shared index`,
        );
        return;
      }

      this.logger.log(`Skipping ${source} index rebuild: no CSV files found`);
      return;
    }

    const signature = await this.computeDirectorySignature(files);

    if (!force && currentState?.extracted_hash === signature) {
      await this.cleanupUnchangedSourceFiles(source, files, currentState);
      this.logger.log(
        `Skipping ${source} index rebuild: source files unchanged`,
      );
      return;
    }

    const batchId = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    this.getDb()
      .prepare(
        `
        INSERT INTO import_batches (
          id, source_code, started_at, status, downloaded, extracted, indexed, rows_processed
        ) VALUES (?, ?, ?, ?, 0, 0, 0, 0)
        `,
      )
      .run(batchId, source, startedAt, "running");

    try {
      let rowsImported = 0;

      if (source === "court_stan") {
        rowsImported = await this.rebuildCourtStan(files, batchId);
      } else if (source === "asvp") {
        rowsImported = await this.rebuildAsvp(files, batchId);
      } else {
        rowsImported = await this.rebuildCourtDates(files, batchId);
      }

      const finishedAt = new Date().toISOString();
      this.getDb()
        .prepare(
          `
          INSERT INTO import_state (
            source_code,
            extracted_hash,
            last_indexed_at,
            last_success_at,
            last_status,
            rows_imported
          ) VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(source_code) DO UPDATE SET
            extracted_hash = excluded.extracted_hash,
            last_indexed_at = excluded.last_indexed_at,
            last_success_at = excluded.last_success_at,
            last_status = excluded.last_status,
            last_error = NULL,
            rows_imported = excluded.rows_imported
          `,
        )
        .run(
          source,
          signature,
          finishedAt,
          finishedAt,
          "success",
          rowsImported,
        );
      this.getDb()
        .prepare(
          `
          UPDATE import_batches
          SET finished_at = ?, status = ?, indexed = 1, rows_processed = ?
          WHERE id = ?
          `,
        )
        .run(finishedAt, "success", rowsImported, batchId);
      this.logger.log(`Rebuilt ${source} index with ${rowsImported} rows`);
    } catch (error) {
      const finishedAt = new Date().toISOString();
      const message = error instanceof Error ? error.message : String(error);
      this.getDb()
        .prepare(
          `
          INSERT INTO import_state (
            source_code,
            extracted_hash,
            last_indexed_at,
            last_status,
            last_error
          ) VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(source_code) DO UPDATE SET
            extracted_hash = excluded.extracted_hash,
            last_indexed_at = excluded.last_indexed_at,
            last_status = excluded.last_status,
            last_error = excluded.last_error
          `,
        )
        .run(source, signature, finishedAt, "failed", message);
      this.getDb()
        .prepare(
          `
          UPDATE import_batches
          SET finished_at = ?, status = ?, error_message = ?
          WHERE id = ?
          `,
        )
        .run(finishedAt, "failed", message, batchId);
      throw error;
    }
  }

  private async rebuildCourtStan(
    files: string[],
    batchId: string,
  ): Promise<number> {
    const importPlan = await prepareSourceImportPlan("court_stan", files);
    const db = this.getDb();
    let rowsImported = 0;

    try {
      db.exec("BEGIN IMMEDIATE");
      db.prepare(`DELETE FROM court_registry_participants_fts`).run();
      db.prepare(`DELETE FROM court_registry_participants`).run();
      const insertRow = db.prepare(
        `
        INSERT INTO court_registry_participants (
          case_number,
          case_number_normalized,
          participant_raw,
          participant_normalized,
          participant_role,
          court_name,
          case_proc,
          registration_date,
          judge,
          judges,
          stage_date,
          stage_name,
          record_type,
          case_description,
          participants,
          source_file,
          source_row_num,
          import_batch_id,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      );
      const insertFts = db.prepare(
        `
        INSERT INTO court_registry_participants_fts (
          rowid, participant_raw, participant_normalized
        ) VALUES (?, ?, ?)
        `,
      );

      let rowId = 0;
      const now = new Date().toISOString();

      for (const preparedFile of importPlan.files) {
        let sourceRowNum = 0;

        for await (const row of this.readDelimitedRows<CourtRegistryRow>(
          preparedFile.filePath,
          {
            delimiter: "\t",
            encoding: preparedFile.encoding,
          },
        )) {
          sourceRowNum += 1;
          const participants = this.splitParticipants(row.participants || "");

          for (const participant of participants) {
            const parsed = this.parseParticipant(participant);
            rowId += 1;
            insertRow.run(
              row.case_number || "",
              this.normalizeCaseNumber(row.case_number || ""),
              parsed.person,
              this.normalizeSearchValue(parsed.person),
              parsed.role || null,
              row.court_name || "",
              row.case_proc || "",
              row.registration_date || "",
              row.judge || "",
              row.judges || "",
              row.stage_date || "",
              row.stage_name || "",
              row.type || "",
              row.description || "",
              row.participants || "",
              preparedFile.sourceFileName,
              sourceRowNum,
              batchId,
              now,
              now,
            );
            insertFts.run(
              rowId,
              parsed.person,
              this.normalizeSearchValue(parsed.person),
            );
            rowsImported += 1;
          }
        }
      }

      db.exec("COMMIT");
    } catch (error) {
      this.rollbackTransaction(db, "court_stan rebuild");
      await cleanupPreparedSourceImportPlan(importPlan).catch(() => undefined);
      throw error;
    }

    await this.finalizeConsumedSourceImport("court_stan", importPlan);
    return rowsImported;
  }

  private async rebuildAsvp(files: string[], batchId: string): Promise<number> {
    const importPlan = await prepareSourceImportPlan("asvp", files);
    const db = this.getDb();
    let rowsImported = 0;
    const now = new Date().toISOString();

    const insertRow = db.prepare(
      `
      INSERT INTO asvp_records (
        vp_ordernum,
        debtor_name,
        debtor_name_normalized,
        creditor_name,
        creditor_name_normalized,
        org_name,
        org_name_normalized,
        vp_begindate,
        vp_state,
        dvs_code,
        phone_num,
        email_addr,
        bank_account,
        source_file,
        source_row_num,
        import_batch_id,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    );
    const insertFts = db.prepare(
      `
      INSERT INTO asvp_records_fts (
        rowid,
        debtor_name,
        debtor_name_normalized,
        creditor_name,
        creditor_name_normalized,
        org_name,
        org_name_normalized
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    );

    try {
      db.exec("BEGIN IMMEDIATE");
      db.prepare(`DELETE FROM asvp_records_fts`).run();
      db.prepare(`DELETE FROM asvp_records`).run();
      db.exec("COMMIT");

      let rowId = 0;

      for (const preparedFile of importPlan.files) {
        let sourceRowNum = 0;
        let fileRowsImported = 0;

        db.exec("BEGIN IMMEDIATE");

        try {
          for await (const row of this.readDelimitedRows<AsvpRegistryRow>(
            preparedFile.filePath,
            {
              delimiter: ",",
              encoding: preparedFile.encoding,
            },
          )) {
            sourceRowNum += 1;
            rowId += 1;
            const debtorName = (row.DEBTOR_NAME || "").trim();
            const creditorName = (row.CREDITOR_NAME || "").trim();
            const orgName = (row.ORG_NAME || "").trim();

            insertRow.run(
              row.VP_ORDERNUM || "",
              debtorName,
              this.normalizeSearchValue(debtorName),
              creditorName,
              this.normalizeSearchValue(creditorName),
              orgName,
              this.normalizeSearchValue(orgName),
              row.VP_BEGINDATE || "",
              row.VP_STATE || "",
              row.DVS_CODE || "",
              row.PHONE_NUM || "",
              row.EMAIL_ADDR || "",
              row.BANK_ACCOUNT || "",
              preparedFile.sourceFileName,
              sourceRowNum,
              batchId,
              now,
              now,
            );
            insertFts.run(
              rowId,
              debtorName,
              this.normalizeSearchValue(debtorName),
              creditorName,
              this.normalizeSearchValue(creditorName),
              orgName,
              this.normalizeSearchValue(orgName),
            );
            fileRowsImported += 1;
          }

          db.exec("COMMIT");
        } catch (error) {
          this.rollbackTransaction(db, "asvp chunk rebuild");
          throw error;
        }

        rowsImported += fileRowsImported;
        this.getDb()
          .prepare(
            `
            UPDATE import_batches
            SET rows_processed = ?
            WHERE id = ?
            `,
          )
          .run(rowsImported, batchId);

        this.logger.log(
          `Imported ${fileRowsImported} ASVP rows from ${path.basename(preparedFile.filePath)} (${rowsImported} total)`,
        );
      }
    } catch (error) {
      this.rollbackTransaction(db, "asvp rebuild");
      await cleanupPreparedSourceImportPlan(importPlan).catch(() => undefined);
      throw error;
    }

    await this.finalizeConsumedSourceImport("asvp", importPlan);
    return rowsImported;
  }

  private async rebuildCourtDates(
    files: string[],
    batchId: string,
  ): Promise<number> {
    const importPlan = await prepareSourceImportPlan("court_dates", files);
    const db = this.getDb();
    let rowsImported = 0;

    try {
      db.exec("BEGIN IMMEDIATE");
      db.prepare(`DELETE FROM court_dates`).run();
      const insertRow = db.prepare(
        `
        INSERT INTO court_dates (
          case_number,
          case_number_normalized,
          date,
          judges,
          court_name,
          court_room,
          case_involved,
          case_description,
          source_file,
          source_row_num,
          import_batch_id,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      );

      const now = new Date().toISOString();

      for (const preparedFile of importPlan.files) {
        let sourceRowNum = 0;

        for await (const row of this.readDelimitedRows<CourtDateRow>(
          preparedFile.filePath,
          {
            delimiter: "\t",
            encoding: preparedFile.encoding,
          },
        )) {
          sourceRowNum += 1;
          insertRow.run(
            row.case || "",
            this.normalizeCaseNumber(row.case || ""),
            row.date || "",
            row.judges || "",
            row.court_name || "",
            row.court_room || "",
            row.case_involved || "",
            row.case_description || "",
            preparedFile.sourceFileName,
            sourceRowNum,
            batchId,
            now,
            now,
          );
          rowsImported += 1;
        }
      }

      db.exec("COMMIT");
    } catch (error) {
      this.rollbackTransaction(db, "court_dates rebuild");
      await cleanupPreparedSourceImportPlan(importPlan).catch(() => undefined);
      throw error;
    }

    await this.finalizeConsumedSourceImport("court_dates", importPlan);
    return rowsImported;
  }

  private async listSourceFiles(source: ImportSourceCode): Promise<string[]> {
    const directory =
      source === "court_stan"
        ? this.courtStanDirectory
        : source === "asvp"
          ? this.asvpDirectory
          : this.courtDatesDirectory;

    const fileNames = await readdir(directory);
    return fileNames
      .filter((fileName) => fileName.toLowerCase().endsWith(".csv"))
      .sort()
      .map((fileName) => path.join(directory, fileName));
  }

  private async computeDirectorySignature(files: string[]): Promise<string> {
    const hash = crypto.createHash("sha256");

    for (const filePath of files) {
      const fileStat = await stat(filePath);
      hash.update(path.basename(filePath));
      hash.update(String(fileStat.size));
      hash.update(String(fileStat.mtimeMs));
    }

    return hash.digest("hex");
  }

  private async *readDelimitedRows<T>(
    filePath: string,
    options: {
      delimiter: string;
      encoding: "utf-8" | "cp1251" | "asvp-repaired";
    },
  ): AsyncGenerator<T> {
    const rawInput = this.createDecodedInputStream(filePath, options.encoding);
    const reader = readline.createInterface({
      input: rawInput as NodeJS.ReadableStream,
      crlfDelay: Infinity,
    });

    let headers: string[] | null = null;
    let bufferedLine = "";

    try {
      for await (const line of reader) {
        if (!line.trim() && !bufferedLine) {
          continue;
        }

        bufferedLine = bufferedLine ? `${bufferedLine}\n${line}` : line;

        if (!this.isCompleteDelimitedRecord(bufferedLine)) {
          continue;
        }

        const record = bufferedLine;
        bufferedLine = "";

        if (!headers) {
          headers = this.parseDelimitedLine(record, options.delimiter);
          continue;
        }

        const values = this.parseDelimitedLine(record, options.delimiter);

        if (values.length !== headers.length) {
          throw new Error(
            `Invalid delimited row in ${path.basename(filePath)}`,
          );
        }

        yield headers.reduce(
          (accumulator, header, index) => {
            accumulator[header] = values[index] ?? "";
            return accumulator;
          },
          {} as Record<string, string>,
        ) as T;
      }
    } finally {
      reader.close();
      if ("close" in rawInput && typeof rawInput.close === "function") {
        rawInput.close();
      }
    }
  }

  private createDecodedInputStream(
    filePath: string,
    encoding: "utf-8" | "cp1251" | "asvp-repaired",
  ): NodeJS.ReadableStream {
    if (encoding === "utf-8") {
      return createReadStream(filePath, { encoding: "utf-8" });
    }

    if (encoding === "cp1251") {
      return createReadStream(filePath).pipe(iconv.decodeStream("cp1251"));
    }

    return createReadStream(filePath).pipe(this.createAsvpRepairStream());
  }

  private createAsvpRepairStream(): Transform {
    return new Transform({
      transform: (chunk, _encoding, callback) => {
        const buffer = Buffer.isBuffer(chunk)
          ? chunk
          : Buffer.from(chunk as string, "latin1");
        const repairedText = iconv.decode(
          Buffer.from(buffer.toString("latin1"), "latin1"),
          "cp1251",
        );
        callback(null, repairedText);
      },
    });
  }

  private buildFtsQuery(normalizedQuery: string): string {
    return normalizedQuery
      .split(" ")
      .filter(Boolean)
      .map((token) => `"${token.replace(/"/g, '""')}"*`)
      .join(" AND ");
  }

  private queryCourtRegistryRows(
    options: CourtRegistrySearchOptions,
    normalizedQuery: string,
  ): Array<Record<string, string>> {
    const conditions: string[] = [];
    const params: string[] = [];
    const normalizedCaseNumber = this.normalizeCaseNumber(
      options.caseNumber || "",
    );

    if (normalizedCaseNumber) {
      conditions.push(`p.case_number_normalized LIKE ?`);
      params.push(`%${normalizedCaseNumber}%`);
    }

    if (options.institutionName) {
      conditions.push(`LOWER(COALESCE(p.court_name, '')) LIKE LOWER(?)`);
      params.push(`%${options.institutionName}%`);
    }

    if (options.role) {
      conditions.push(`LOWER(COALESCE(p.participant_role, '')) LIKE LOWER(?)`);
      params.push(`%${options.role}%`);
    }

    if (options.status) {
      conditions.push(`LOWER(COALESCE(p.stage_name, '')) LIKE LOWER(?)`);
      params.push(`%${options.status}%`);
    }

    if (options.judge) {
      conditions.push(`LOWER(COALESCE(p.judge, '')) LIKE LOWER(?)`);
      params.push(`%${options.judge}%`);
    }

    if (options.proceedingNumber) {
      conditions.push(`LOWER(COALESCE(p.case_proc, '')) LIKE LOWER(?)`);
      params.push(`%${options.proceedingNumber}%`);
    }

    if (options.proceedingType) {
      conditions.push(`LOWER(COALESCE(p.record_type, '')) LIKE LOWER(?)`);
      params.push(`%${options.proceedingType}%`);
    }

    if (normalizedQuery) {
      const matchQuery = this.buildFtsQuery(normalizedQuery);
      return this.getDb()
        .prepare(
          `
          SELECT
            p.case_number,
            p.participant_raw,
            p.participant_role,
            p.court_name,
            p.case_proc,
            p.registration_date,
            p.judge,
            p.stage_date,
            p.stage_name,
            p.record_type,
            p.case_description,
            p.participants
          FROM court_registry_participants_fts f
          JOIN court_registry_participants p ON p.id = f.rowid
          WHERE court_registry_participants_fts MATCH ?
            ${conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : ""}
          LIMIT 400
          `,
        )
        .all(matchQuery, ...params) as Array<Record<string, string>>;
    }

    return this.getDb()
      .prepare(
        `
        SELECT
          case_number,
          participant_raw,
          participant_role,
          court_name,
          case_proc,
          registration_date,
          judge,
          stage_date,
          stage_name,
          record_type,
          case_description,
          participants
        FROM court_registry_participants p
        ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
        LIMIT 400
        `,
      )
      .all(...params) as Array<Record<string, string>>;
  }

  private queryAsvpRows(
    options: CourtRegistrySearchOptions,
    normalizedQuery: string,
  ): Array<Record<string, string>> {
    const conditions: string[] = [];
    const params: string[] = [];
    const normalizedCaseNumber = this.normalizeCaseNumber(
      options.caseNumber || "",
    );

    if (normalizedCaseNumber) {
      conditions.push(`LOWER(COALESCE(a.vp_ordernum, '')) LIKE LOWER(?)`);
      params.push(`%${normalizedCaseNumber}%`);
    }

    if (options.institutionName) {
      conditions.push(`LOWER(COALESCE(a.org_name, '')) LIKE LOWER(?)`);
      params.push(`%${options.institutionName}%`);
    }

    if (options.status) {
      conditions.push(`LOWER(COALESCE(a.vp_state, '')) LIKE LOWER(?)`);
      params.push(`%${options.status}%`);
    }

    if (options.proceedingNumber) {
      conditions.push(`LOWER(COALESCE(a.dvs_code, '')) LIKE LOWER(?)`);
      params.push(`%${options.proceedingNumber}%`);
    }

    if (normalizedQuery) {
      const matchQuery = this.buildFtsQuery(normalizedQuery);
      return this.getDb()
        .prepare(
          `
          SELECT
            a.*
          FROM asvp_records_fts f
          JOIN asvp_records a ON a.id = f.rowid
          WHERE asvp_records_fts MATCH ?
            ${conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : ""}
          LIMIT 400
          `,
        )
        .all(matchQuery, ...params) as Array<Record<string, string>>;
    }

    return this.getDb()
      .prepare(
        `
        SELECT
          *
        FROM asvp_records a
        ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
        LIMIT 400
        `,
      )
      .all(...params) as Array<Record<string, string>>;
  }

  private splitParticipants(value: string): string[] {
    return (value || "")
      .split(",")
      .map((participant) => participant.trim())
      .filter(Boolean);
  }

  private parseParticipant(participant: string): {
    role: string;
    person: string;
  } {
    const separatorIndex = participant.indexOf(":");

    if (separatorIndex === -1) {
      return {
        role: "",
        person: participant.trim(),
      };
    }

    return {
      role: participant.slice(0, separatorIndex).trim(),
      person: participant.slice(separatorIndex + 1).trim(),
    };
  }

  private buildAsvpParticipants(
    creditorName: string,
    debtorName: string,
  ): string {
    return [
      creditorName ? `Стягувач: ${creditorName}` : "",
      debtorName ? `Боржник: ${debtorName}` : "",
    ]
      .filter(Boolean)
      .join(", ");
  }

  private matchesCourtRowFilters(
    row: Record<string, string>,
    options: CourtRegistrySearchOptions,
    normalizedQuery: string,
  ): boolean {
    return (
      this.matchesSearchQuery(
        this.normalizeSearchValue(row.participant_raw || ""),
        normalizedQuery,
      ) &&
      this.matchesContainsFilter(
        this.normalizeCaseNumber(row.case_number || ""),
        this.normalizeCaseNumber(options.caseNumber || ""),
      ) &&
      this.matchesContainsFilter(
        this.normalizeSearchValue(row.court_name || ""),
        this.normalizeSearchValue(options.institutionName || ""),
      ) &&
      this.matchesContainsFilter(
        this.normalizeSearchValue(row.participant_role || ""),
        this.normalizeSearchValue(options.role || ""),
      ) &&
      this.matchesContainsFilter(
        this.normalizeSearchValue(row.stage_name || ""),
        this.normalizeSearchValue(options.status || ""),
      ) &&
      this.matchesContainsFilter(
        this.normalizeSearchValue(row.judge || ""),
        this.normalizeSearchValue(options.judge || ""),
      ) &&
      this.matchesContainsFilter(
        this.normalizeSearchValue(row.case_proc || ""),
        this.normalizeSearchValue(options.proceedingNumber || ""),
      ) &&
      this.matchesContainsFilter(
        this.normalizeSearchValue(row.record_type || ""),
        this.normalizeSearchValue(options.proceedingType || ""),
      )
    );
  }

  private matchesAsvpRowFilters(
    row: Record<string, string>,
    options: CourtRegistrySearchOptions,
    role: "Боржник" | "Стягувач",
  ): boolean {
    return (
      this.matchesContainsFilter(
        this.normalizeCaseNumber(row.vp_ordernum || ""),
        this.normalizeCaseNumber(options.caseNumber || ""),
      ) &&
      this.matchesContainsFilter(
        this.normalizeSearchValue(row.org_name || ""),
        this.normalizeSearchValue(options.institutionName || ""),
      ) &&
      this.matchesContainsFilter(
        this.normalizeSearchValue(role),
        this.normalizeSearchValue(options.role || ""),
      ) &&
      this.matchesContainsFilter(
        this.normalizeSearchValue(row.vp_state || ""),
        this.normalizeSearchValue(options.status || ""),
      ) &&
      this.matchesContainsFilter(
        this.normalizeSearchValue(row.dvs_code || ""),
        this.normalizeSearchValue(options.proceedingNumber || ""),
      ) &&
      this.matchesContainsFilter(
        this.normalizeSearchValue("Виконавче провадження"),
        this.normalizeSearchValue(options.proceedingType || ""),
      )
    );
  }

  private matchesDateRange(
    rawDate: string,
    options: CourtRegistrySearchOptions,
    withTime: boolean = false,
  ): boolean {
    if (!options.dateFrom && !options.dateTo) {
      return true;
    }

    const timestamp = this.parseRegistryDate(rawDate, withTime);

    if (timestamp === undefined) {
      return false;
    }

    if (options.dateFrom) {
      const from = this.parseIsoDate(options.dateFrom);
      if (from !== undefined && timestamp < from) {
        return false;
      }
    }

    if (options.dateTo) {
      const to = this.parseIsoDate(options.dateTo);
      if (to !== undefined && timestamp > to + 24 * 60 * 60 * 1000 - 1) {
        return false;
      }
    }

    return true;
  }

  private parseIsoDate(value?: string): number | undefined {
    if (!value) {
      return undefined;
    }

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return undefined;
    }

    return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  private parseRegistryDate(
    value: string,
    withTime: boolean = false,
  ): number | undefined {
    const match = withTime
      ? value.match(
          /^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/,
        )
      : value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

    if (!match) {
      return undefined;
    }

    return Date.UTC(
      Number(match[3]),
      Number(match[2]) - 1,
      Number(match[1]),
      Number(match[4] || "0"),
      Number(match[5] || "0"),
      Number(match[6] || "0"),
    );
  }

  private parseDelimitedLine(line: string, delimiter: string): string[] {
    const values: string[] = [];
    let currentValue = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const nextChar = line[index + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentValue += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === delimiter && !inQuotes) {
        values.push(this.cleanValue(currentValue));
        currentValue = "";
        continue;
      }

      currentValue += char;
    }

    values.push(this.cleanValue(currentValue));
    return values;
  }

  private isCompleteDelimitedRecord(line: string): boolean {
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const nextChar = line[index + 1];

      if (char !== '"') {
        continue;
      }

      if (inQuotes && nextChar === '"') {
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
    }

    return !inQuotes;
  }

  private cleanValue(value: string): string {
    return value.replace(/\r/g, "").trim();
  }

  private normalizeSearchValue(value: string): string {
    return value
      .normalize("NFKC")
      .trim()
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/[“”«»„]/g, '"')
      .replace(/[’`']/g, "'")
      .replace(/[‐‑‒–—―]/g, "-")
      .replace(/\s+/g, " ")
      .toLocaleLowerCase("uk-UA");
  }

  private matchesSearchQuery(
    normalizedCandidate: string,
    normalizedQuery: string,
  ): boolean {
    if (!normalizedQuery) {
      return true;
    }

    if (!normalizedCandidate) {
      return false;
    }

    if (normalizedCandidate.includes(normalizedQuery)) {
      return true;
    }

    const candidateTokens = this.tokenizeSearchValue(normalizedCandidate);
    const queryTokens = this.tokenizeSearchValue(normalizedQuery);

    if (queryTokens.length === 0) {
      return false;
    }

    return queryTokens.every((queryToken) =>
      candidateTokens.some(
        (candidateToken) =>
          candidateToken === queryToken ||
          candidateToken.startsWith(queryToken) ||
          queryToken.startsWith(candidateToken),
      ),
    );
  }

  private matchesContainsFilter(
    normalizedCandidate: string,
    normalizedFilter: string,
  ): boolean {
    if (!normalizedFilter) {
      return true;
    }

    if (!normalizedCandidate) {
      return false;
    }

    return normalizedCandidate.includes(normalizedFilter);
  }

  private compareSearchResults(
    leftValue: string,
    rightValue: string,
    normalizedQuery: string,
  ): number {
    const leftScore = this.getSearchScore(leftValue, normalizedQuery);
    const rightScore = this.getSearchScore(rightValue, normalizedQuery);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return leftValue.localeCompare(rightValue, "uk-UA");
  }

  private getSearchScore(value: string, normalizedQuery: string): number {
    const normalizedValue = this.normalizeSearchValue(value);

    if (!normalizedValue || !normalizedQuery) {
      return 0;
    }

    const valueTokens = this.tokenizeSearchValue(normalizedValue);
    const queryTokens = this.tokenizeSearchValue(normalizedQuery);
    let score = 0;

    if (normalizedValue === normalizedQuery) {
      score += 1000;
    } else if (normalizedValue.startsWith(normalizedQuery)) {
      score += 700;
    } else if (normalizedValue.includes(normalizedQuery)) {
      score += 500;
    }

    queryTokens.forEach((queryToken, index) => {
      const tokenIndex = valueTokens.findIndex(
        (valueToken) =>
          valueToken === queryToken ||
          valueToken.startsWith(queryToken) ||
          queryToken.startsWith(valueToken),
      );

      if (tokenIndex === -1) {
        return;
      }

      score += valueTokens[tokenIndex] === queryToken ? 120 : 80;

      if (tokenIndex === index) {
        score += 30;
      }
    });

    score -= Math.abs(normalizedValue.length - normalizedQuery.length);
    return score;
  }

  private tokenizeSearchValue(value: string): string[] {
    return value
      .split(/[-\s"'.,;:()[\]{}\\+/]+/)
      .map((token) => token.trim())
      .filter(Boolean);
  }

  private normalizeCaseNumber(value: string): string {
    return value
      .normalize("NFKC")
      .trim()
      .replace(/[‐‑‒–—―]/g, "-")
      .replace(/\s+/g, "")
      .toLocaleLowerCase("uk-UA");
  }

  private getDb(): SqliteDatabase {
    if (!this.db) {
      throw new Error("Registry index DB is not initialized");
    }

    return this.db;
  }

  private async migrateLegacyRegistrySchema(
    database: SqliteDatabase,
  ): Promise<void> {
    let migrated = false;

    if (this.tableHasColumn(database, "asvp_records", "raw_row_json")) {
      database.exec("BEGIN IMMEDIATE");

      try {
        database.exec(`
          DROP TABLE IF EXISTS asvp_records_migrated;
          CREATE TABLE asvp_records_migrated (
            id INTEGER PRIMARY KEY,
            vp_ordernum TEXT,
            debtor_name TEXT,
            debtor_name_normalized TEXT,
            creditor_name TEXT,
            creditor_name_normalized TEXT,
            org_name TEXT,
            org_name_normalized TEXT,
            vp_begindate TEXT,
            vp_state TEXT,
            dvs_code TEXT,
            phone_num TEXT,
            email_addr TEXT,
            bank_account TEXT,
            source_file TEXT,
            source_row_num INTEGER NULL,
            import_batch_id TEXT,
            created_at TEXT,
            updated_at TEXT
          );
          INSERT INTO asvp_records_migrated (
            id,
            vp_ordernum,
            debtor_name,
            debtor_name_normalized,
            creditor_name,
            creditor_name_normalized,
            org_name,
            org_name_normalized,
            vp_begindate,
            vp_state,
            dvs_code,
            phone_num,
            email_addr,
            bank_account,
            source_file,
            source_row_num,
            import_batch_id,
            created_at,
            updated_at
          )
          SELECT
            id,
            vp_ordernum,
            debtor_name,
            debtor_name_normalized,
            creditor_name,
            creditor_name_normalized,
            org_name,
            org_name_normalized,
            vp_begindate,
            vp_state,
            dvs_code,
            phone_num,
            email_addr,
            bank_account,
            source_file,
            source_row_num,
            import_batch_id,
            created_at,
            updated_at
          FROM asvp_records;
          DROP TABLE asvp_records;
          ALTER TABLE asvp_records_migrated RENAME TO asvp_records;
          CREATE INDEX IF NOT EXISTS idx_asvp_vp_ordernum
            ON asvp_records(vp_ordernum);
          CREATE INDEX IF NOT EXISTS idx_asvp_debtor_name_normalized
            ON asvp_records(debtor_name_normalized);
          CREATE INDEX IF NOT EXISTS idx_asvp_creditor_name_normalized
            ON asvp_records(creditor_name_normalized);
          CREATE INDEX IF NOT EXISTS idx_asvp_org_name_normalized
            ON asvp_records(org_name_normalized);
          DROP TABLE IF EXISTS asvp_records_fts;
          CREATE VIRTUAL TABLE asvp_records_fts
            USING fts5(
              debtor_name,
              debtor_name_normalized,
              creditor_name,
              creditor_name_normalized,
              org_name,
              org_name_normalized,
              content='asvp_records',
              content_rowid='id',
              tokenize='unicode61'
            );
          INSERT INTO asvp_records_fts(asvp_records_fts) VALUES('rebuild');
        `);
        database.exec("COMMIT");
        migrated = true;
      } catch (error) {
        this.rollbackTransaction(database, "legacy asvp schema migration");
        throw error;
      }
    }

    if (this.tableHasColumn(database, "court_dates", "raw_row_json")) {
      database.exec("BEGIN IMMEDIATE");

      try {
        database.exec(`
          DROP TABLE IF EXISTS court_dates_migrated;
          CREATE TABLE court_dates_migrated (
            id INTEGER PRIMARY KEY,
            case_number TEXT,
            case_number_normalized TEXT,
            date TEXT,
            judges TEXT,
            court_name TEXT,
            court_room TEXT,
            case_involved TEXT,
            case_description TEXT,
            source_file TEXT,
            source_row_num INTEGER NULL,
            import_batch_id TEXT,
            created_at TEXT,
            updated_at TEXT
          );
          INSERT INTO court_dates_migrated (
            id,
            case_number,
            case_number_normalized,
            date,
            judges,
            court_name,
            court_room,
            case_involved,
            case_description,
            source_file,
            source_row_num,
            import_batch_id,
            created_at,
            updated_at
          )
          SELECT
            id,
            case_number,
            case_number_normalized,
            date,
            judges,
            court_name,
            court_room,
            case_involved,
            case_description,
            source_file,
            source_row_num,
            import_batch_id,
            created_at,
            updated_at
          FROM court_dates;
          DROP TABLE court_dates;
          ALTER TABLE court_dates_migrated RENAME TO court_dates;
          CREATE INDEX IF NOT EXISTS idx_court_dates_case_number
            ON court_dates(case_number_normalized);
        `);
        database.exec("COMMIT");
        migrated = true;
      } catch (error) {
        this.rollbackTransaction(
          database,
          "legacy court_dates schema migration",
        );
        throw error;
      }
    }

    if (migrated) {
      database.pragma("wal_checkpoint(TRUNCATE)");
      database.exec("VACUUM");
    }
  }

  private tableHasColumn(
    database: SqliteDatabase,
    tableName: string,
    columnName: string,
  ): boolean {
    const columns = database
      .prepare(`PRAGMA table_info(${tableName})`)
      .all() as Array<{ name?: string }>;

    return columns.some((column) => column.name === columnName);
  }

  private rollbackTransaction(db: SqliteDatabase, context: string): void {
    try {
      db.exec("ROLLBACK");
    } catch (error) {
      this.logger.warn(
        `Rollback warning during ${context}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private compactWriteAheadLogIfPossible(): void {
    try {
      const db = this.getDb();
      db.pragma("wal_checkpoint(TRUNCATE)");
    } catch (error) {
      this.logger.warn(
        `SQLite WAL checkpoint warning: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async finalizeConsumedSourceImport(
    source: ImportSourceCode,
    importPlan: {
      files: Array<{
        filePath: string;
        encoding: "utf-8" | "asvp-repaired";
        sourceFileName: string;
      }>;
      sourceFilesToDelete: string[];
      tempRoot: string | null;
    },
  ): Promise<void> {
    try {
      await finalizePreparedSourceImportPlan(source, importPlan, {
        deleteSourceFiles: this.deleteImportedSourceFiles[source],
      });
    } catch (error) {
      this.logger.warn(
        `${source} source cleanup warning: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async cleanupUnchangedSourceFiles(
    source: ImportSourceCode,
    files: string[],
    currentState:
      | {
          extracted_hash?: string;
          last_status?: string;
          rows_imported?: number;
        }
      | undefined,
  ): Promise<void> {
    if (
      !this.deleteImportedSourceFiles[source] ||
      currentState?.last_status !== "success" ||
      (currentState.rows_imported || 0) <= 0
    ) {
      return;
    }

    try {
      await Promise.all(files.map((filePath) => rm(filePath, { force: true })));
      this.logger.log(
        `Deleted ${files.length} unchanged ${source} source file(s) after shared-index verification`,
      );
    } catch (error) {
      this.logger.warn(
        `${source} unchanged source cleanup warning: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async runSourceRebuildSerialized(
    source: ImportSourceCode,
    task: () => Promise<void>,
  ): Promise<void> {
    const previous = this.sourceRebuilds.get(source) || Promise.resolve();
    const next = previous.catch(() => undefined).then(task);
    this.sourceRebuilds.set(source, next);

    try {
      await next;
    } finally {
      if (this.sourceRebuilds.get(source) === next) {
        this.sourceRebuilds.delete(source);
      }
    }
  }
}
