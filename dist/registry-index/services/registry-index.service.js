"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RegistryIndexService", {
    enumerable: true,
    get: function() {
        return RegistryIndexService;
    }
});
const _common = require("@nestjs/common");
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
const _fs = require("fs");
const _promises = require("node:fs/promises");
const _iconvlite = /*#__PURE__*/ _interop_require_wildcard(require("iconv-lite"));
const _path = /*#__PURE__*/ _interop_require_wildcard(require("path"));
const _readline = /*#__PURE__*/ _interop_require_wildcard(require("readline"));
const _stream = require("stream");
const _registrysourceimportpreparation = require("./registry-source-import-preparation");
const _courtregistryservice = require("../../clients/services/court-registry.service");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
const Database = require("better-sqlite3");
let RegistryIndexService = class RegistryIndexService {
    onModuleDestroy() {
        this.sharedDb?.close();
        this.asvpDb?.close();
        this.closeAsvpShardDbs();
        this.sharedDb = null;
        this.asvpDb = null;
    }
    async ensureInitialized() {
        if (this.sharedDb && this.asvpDb) {
            return;
        }
        if (!this.sharedDb) {
            this.sharedDb = await this.initializeDatabase(this.sharedDbPath, "shared");
        }
        if (!this.asvpDb) {
            this.asvpDb = await this.initializeDatabase(this.asvpDbPath, "asvp");
        }
    }
    async initializeDatabase(dbPath, kind) {
        await (0, _promises.mkdir)(_path.dirname(dbPath), {
            recursive: true
        });
        const database = new Database(dbPath);
        database.pragma("journal_mode = WAL");
        database.pragma("synchronous = NORMAL");
        database.pragma("temp_store = MEMORY");
        database.pragma("busy_timeout = 5000");
        database.exec(this.buildSchemaSql(kind));
        const importStateColumns = database.prepare(`PRAGMA table_info(import_state)`).all().map((row)=>row.name).filter((value)=>Boolean(value));
        if (!importStateColumns.includes("remote_fingerprint")) {
            database.exec(`ALTER TABLE import_state ADD COLUMN remote_fingerprint TEXT NULL`);
        }
        await this.migrateLegacyRegistrySchema(database);
        return database;
    }
    async getImportState(sourceCode) {
        await this.ensureInitialized();
        const primaryRow = this.getDbForSourceCode(sourceCode).prepare(`SELECT * FROM import_state WHERE source_code = ? LIMIT 1`).get(sourceCode);
        if (primaryRow || sourceCode !== "asvp") {
            return primaryRow ?? null;
        }
        return this.getSharedDb().prepare(`SELECT * FROM import_state WHERE source_code = ? LIMIT 1`).get(sourceCode) ?? null;
    }
    async upsertImportState(sourceCode, patch) {
        await this.ensureInitialized();
        const current = this.getDbForSourceCode(sourceCode).prepare(`SELECT * FROM import_state WHERE source_code = ? LIMIT 1`).get(sourceCode) ?? {
            source_code: sourceCode
        };
        const next = {
            ...current,
            ...patch,
            source_code: sourceCode
        };
        this.getDbForSourceCode(sourceCode).prepare(`
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
        `).run(next.source_code, next.dataset_url ?? null, next.resource_name ?? null, next.resource_url ?? null, next.remote_updated_at ?? null, next.remote_fingerprint ?? null, next.local_file_hash ?? null, next.extracted_hash ?? null, next.last_downloaded_at ?? null, next.last_indexed_at ?? null, next.last_success_at ?? null, next.last_status ?? null, next.last_error ?? null, next.rows_imported ?? 0);
    }
    async getImportStateSummaries() {
        const sourceCodes = [
            "court_stan",
            "court_dates",
            "asvp"
        ];
        return Promise.all(sourceCodes.map(async (sourceCode)=>{
            const [state, available] = await Promise.all([
                this.getImportState(sourceCode),
                this.isIndexAvailableFor(sourceCode)
            ]);
            return {
                sourceCode,
                sourceLabel: this.getImportSourceLabel(sourceCode),
                available,
                datasetUrl: state?.dataset_url ?? null,
                resourceName: state?.resource_name ?? null,
                resourceUrl: state?.resource_url ?? null,
                remoteUpdatedAt: state?.remote_updated_at ?? null,
                lastDownloadedAt: state?.last_downloaded_at ?? null,
                lastIndexedAt: state?.last_indexed_at ?? null,
                lastSuccessAt: state?.last_success_at ?? null,
                lastStatus: state?.last_status ?? null,
                lastError: state?.last_error ?? null,
                rowsImported: state?.rows_imported ?? 0
            };
        }));
    }
    async isIndexAvailableFor(source) {
        await this.ensureInitialized();
        if (source !== "asvp" && this.isIndexAvailableInDb(this.getPrimaryDbForSource(source), source)) {
            return true;
        }
        if (source === "asvp") {
            if (await this.isPrimaryAsvpIndexAvailable()) {
                return true;
            }
            return this.isLegacyAsvpIndexAvailable();
        }
        return false;
    }
    getImportSourceLabel(source) {
        switch(source){
            case "court_stan":
                return _courtregistryservice.COURT_REGISTRY_SOURCE_LABEL;
            case "court_dates":
                return _courtregistryservice.COURT_DATES_SOURCE_LABEL;
            case "asvp":
                return _courtregistryservice.ASVP_SOURCE_LABEL;
        }
    }
    async rebuildIndexes(options) {
        await this.ensureInitialized();
        const sources = options?.source ? [
            options.source
        ] : [
            "court_stan",
            "asvp",
            "court_dates"
        ];
        for (const source of sources){
            await this.runSourceRebuildSerialized(source, ()=>this.rebuildSource(source, options?.force || false));
        }
        this.compactWriteAheadLogIfPossible(sources);
    }
    async searchCourtRegistry(options) {
        await this.ensureInitialized();
        const db = this.getSharedDb();
        if (!await this.isIndexAvailableFor("court_stan")) {
            return [];
        }
        const normalizedQuery = this.normalizeSearchValue(options.query || "");
        const rows = this.queryCourtRegistryRows(db, options, normalizedQuery);
        return rows.filter((row)=>this.matchesCourtRowFilters(row, options, normalizedQuery)).filter((row)=>this.matchesDateRange(row.registration_date || "", options)).map((row)=>({
                source: "court_registry",
                sourceLabel: _courtregistryservice.COURT_REGISTRY_SOURCE_LABEL,
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
                participants: row.participants || ""
            })).slice(0, 200).sort((left, right)=>this.compareSearchResults(left.person, right.person, normalizedQuery));
    }
    async searchAsvpRegistry(options) {
        await this.ensureInitialized();
        const shardEntries = await this.getAsvpShardDbEntries(options);
        const legacyDb = shardEntries.length === 0 ? this.getLegacyAsvpDb() : null;
        if (shardEntries.length === 0 && !legacyDb) {
            return [];
        }
        const normalizedQuery = this.normalizeSearchValue(options.query || "");
        const rows = shardEntries.length > 0 ? shardEntries.flatMap((entry)=>this.queryAsvpRows(entry.db, options, normalizedQuery)) : this.queryAsvpRows(legacyDb, options, normalizedQuery);
        const results = [];
        rows.filter((row)=>this.matchesDateRange(row.vp_begindate || "", options, true)).forEach((row)=>{
            const debtorMatches = this.matchesSearchQuery(this.normalizeSearchValue(row.debtor_name || ""), normalizedQuery) && this.matchesAsvpRowFilters(row, options, "Боржник");
            const creditorMatches = this.matchesSearchQuery(this.normalizeSearchValue(row.creditor_name || ""), normalizedQuery) && this.matchesAsvpRowFilters(row, options, "Стягувач");
            if (debtorMatches) {
                results.push({
                    source: "asvp",
                    sourceLabel: _courtregistryservice.ASVP_SOURCE_LABEL,
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
                    participants: this.buildAsvpParticipants(row.creditor_name || "", row.debtor_name || ""),
                    counterpartyName: row.creditor_name || "",
                    counterpartyRole: "Кредитор",
                    enforcementState: row.vp_state || ""
                });
            }
            if (creditorMatches) {
                results.push({
                    source: "asvp",
                    sourceLabel: _courtregistryservice.ASVP_SOURCE_LABEL,
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
                    participants: this.buildAsvpParticipants(row.creditor_name || "", row.debtor_name || ""),
                    counterpartyName: row.debtor_name || "",
                    counterpartyRole: "Боржник",
                    enforcementState: row.vp_state || ""
                });
            }
        });
        return results.slice(0, 200).sort((left, right)=>this.compareSearchResults(left.person, right.person, normalizedQuery));
    }
    async findCourtDateByCaseNumber(caseNumber) {
        await this.ensureInitialized();
        const db = this.getSharedDb();
        if (!await this.isIndexAvailableFor("court_dates")) {
            return null;
        }
        const row = db.prepare(`
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
        `).get(this.normalizeCaseNumber(caseNumber));
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
            caseDescription: row.case_description || ""
        };
    }
    async searchCourtDates(options) {
        await this.ensureInitialized();
        const db = this.getSharedDb();
        if (!await this.isIndexAvailableFor("court_dates")) {
            return [];
        }
        const rawQuery = (options.query || "").trim();
        const normalizedCaseNumber = this.normalizeCaseNumber(options.caseNumber || "");
        if (!rawQuery && !normalizedCaseNumber) {
            return [];
        }
        const queryVariants = this.buildSearchQueryVariants(rawQuery);
        const likeVariants = queryVariants.map((query)=>`%${query}%`);
        const queryClause = likeVariants.length > 0 ? likeVariants.map(()=>`
                case_involved LIKE ?
                OR case_description LIKE ?
                OR court_name LIKE ?
                OR judges LIKE ?
                OR case_number LIKE ?
              `).join(" OR ") : "1 = 1";
        const queryParameters = likeVariants.flatMap((query)=>[
                query,
                query,
                query,
                query,
                query
            ]);
        const rows = db.prepare(`
        SELECT
          case_number,
          date,
          judges,
          court_name,
          court_room,
          case_involved,
          case_description
        FROM court_dates
        WHERE
          (? = '' OR case_number_normalized = ?)
          AND (
            ? = ''
            OR ${queryClause}
          )
        LIMIT 200
        `).all(normalizedCaseNumber, normalizedCaseNumber, rawQuery, ...queryParameters);
        return rows.map((row)=>({
                date: row.date || "",
                judges: row.judges || "",
                caseNumber: row.case_number || "",
                courtName: row.court_name || "",
                courtRoom: row.court_room || "",
                caseInvolved: row.case_involved || "",
                caseDescription: row.case_description || ""
            }));
    }
    async rebuildSource(source, force) {
        const db = this.getPrimaryDbForSource(source);
        const files = await this.listSourceFiles(source);
        const currentState = db.prepare(`
        SELECT extracted_hash, last_status, rows_imported, last_success_at
        FROM import_state
        WHERE source_code = ?
        LIMIT 1
        `).get(source);
        const hasCurrentIndex = await this.hasPersistedIndexForSource(source, currentState);
        if (files.length === 0) {
            if (hasCurrentIndex) {
                this.logger.log(`Skipping ${source} index rebuild: no source files found, keeping existing index`);
                return;
            }
            this.logger.log(`Skipping ${source} index rebuild: no CSV files found`);
            return;
        }
        const signature = await this.computeDirectorySignature(files);
        if (!force && currentState?.extracted_hash === signature) {
            await this.cleanupUnchangedSourceFiles(source, files, currentState, hasCurrentIndex);
            this.logger.log(`Skipping ${source} index rebuild: source files unchanged`);
            return;
        }
        const batchId = _crypto.randomUUID();
        const startedAt = new Date().toISOString();
        db.prepare(`
        INSERT INTO import_batches (
          id, source_code, started_at, status, downloaded, extracted, indexed, rows_processed
        ) VALUES (?, ?, ?, ?, 0, 0, 0, 0)
        `).run(batchId, source, startedAt, "running");
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
            db.prepare(`
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
          `).run(source, signature, finishedAt, finishedAt, "success", rowsImported);
            db.prepare(`
          UPDATE import_batches
          SET finished_at = ?, status = ?, indexed = 1, rows_processed = ?
          WHERE id = ?
          `).run(finishedAt, "success", rowsImported, batchId);
            this.logger.log(`Rebuilt ${source} index with ${rowsImported} rows`);
        } catch (error) {
            const finishedAt = new Date().toISOString();
            const message = error instanceof Error ? error.message : String(error);
            db.prepare(`
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
          `).run(source, signature, finishedAt, "failed", message);
            db.prepare(`
          UPDATE import_batches
          SET finished_at = ?, status = ?, error_message = ?
          WHERE id = ?
          `).run(finishedAt, "failed", message, batchId);
            throw error;
        }
    }
    async rebuildCourtStan(files, batchId) {
        const importPlan = await (0, _registrysourceimportpreparation.prepareSourceImportPlan)("court_stan", files);
        const db = this.getSharedDb();
        let rowsImported = 0;
        try {
            db.exec("BEGIN IMMEDIATE");
            db.prepare(`DELETE FROM court_registry_participants_fts`).run();
            db.prepare(`DELETE FROM court_registry_participants`).run();
            const insertRow = db.prepare(`
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
        `);
            const insertFts = db.prepare(`
        INSERT INTO court_registry_participants_fts (
          rowid, participant_raw, participant_normalized
        ) VALUES (?, ?, ?)
        `);
            let rowId = 0;
            const now = new Date().toISOString();
            for (const preparedFile of importPlan.files){
                let sourceRowNum = 0;
                for await (const row of this.readDelimitedRows(preparedFile.filePath, {
                    delimiter: "\t",
                    encoding: preparedFile.encoding
                })){
                    sourceRowNum += 1;
                    const participants = this.splitParticipants(row.participants || "");
                    for (const participant of participants){
                        const parsed = this.parseParticipant(participant);
                        rowId += 1;
                        insertRow.run(row.case_number || "", this.normalizeCaseNumber(row.case_number || ""), parsed.person, this.normalizeSearchValue(parsed.person), parsed.role || null, row.court_name || "", row.case_proc || "", row.registration_date || "", row.judge || "", row.judges || "", row.stage_date || "", row.stage_name || "", row.type || "", row.description || "", row.participants || "", preparedFile.sourceFileName, sourceRowNum, batchId, now, now);
                        insertFts.run(rowId, parsed.person, this.normalizeSearchValue(parsed.person));
                        rowsImported += 1;
                    }
                }
            }
            db.exec("COMMIT");
        } catch (error) {
            this.rollbackTransaction(db, "court_stan rebuild");
            await (0, _registrysourceimportpreparation.cleanupPreparedSourceImportPlan)(importPlan).catch(()=>undefined);
            throw error;
        }
        await this.finalizeConsumedSourceImport("court_stan", importPlan);
        return rowsImported;
    }
    async rebuildAsvp(files, batchId) {
        const importPlan = await (0, _registrysourceimportpreparation.prepareSourceImportPlan)("asvp", files);
        const metadataDb = this.getAsvpDb();
        const buildRoot = this.asvpShardBuildDirectory;
        await (0, _promises.mkdir)(buildRoot, {
            recursive: true
        });
        const shardContexts = new Map();
        let rowsImported = 0;
        const now = new Date().toISOString();
        const transactionRowLimit = Math.max(Number(process.env.ASVP_INSERT_ROWS_PER_TRANSACTION || process.env.ASVP_SPLIT_ROWS_PER_FILE || "5000"), 1);
        try {
            for (const preparedFile of importPlan.files){
                let sourceRowNum = 0;
                let fileRowsImported = 0;
                const touchedBucketKeys = new Set();
                const resetBucketKey = this.parseAsvpBucketKeyFromSourceFileName(_path.basename(preparedFile.filePath));
                if (resetBucketKey) {
                    await this.resetAsvpShardBuildBucket(shardContexts, buildRoot, resetBucketKey);
                }
                try {
                    for await (const row of this.readDelimitedRows(preparedFile.filePath, {
                        delimiter: ",",
                        encoding: preparedFile.encoding
                    })){
                        sourceRowNum += 1;
                        const bucketKey = this.extractAsvpBucketKey(row.VP_BEGINDATE || "");
                        const shardContext = this.getOrCreateAsvpShardBuildContext(shardContexts, buildRoot, bucketKey);
                        touchedBucketKeys.add(bucketKey);
                        if (!shardContext.transactionOpen) {
                            shardContext.db.exec("BEGIN IMMEDIATE");
                            shardContext.transactionOpen = true;
                        }
                        shardContext.rowId += 1;
                        const debtorName = (row.DEBTOR_NAME || "").trim();
                        const creditorName = (row.CREDITOR_NAME || "").trim();
                        const orgName = (row.ORG_NAME || "").trim();
                        shardContext.insertRow.run(row.VP_ORDERNUM || "", debtorName, this.normalizeSearchValue(debtorName), creditorName, this.normalizeSearchValue(creditorName), orgName, this.normalizeSearchValue(orgName), row.VP_BEGINDATE || "", row.VP_STATE || "", row.DVS_CODE || "", row.PHONE_NUM || "", row.EMAIL_ADDR || "", row.BANK_ACCOUNT || "", preparedFile.sourceFileName, sourceRowNum, batchId, now, now);
                        shardContext.insertFts.run(shardContext.rowId, this.normalizeSearchValue(debtorName), this.normalizeSearchValue(creditorName), this.normalizeSearchValue(orgName));
                        fileRowsImported += 1;
                        shardContext.rowsImported += 1;
                        shardContext.pendingTransactionRows += 1;
                        if (shardContext.pendingTransactionRows >= transactionRowLimit) {
                            rowsImported += this.commitAsvpShardTransaction(shardContext);
                            this.updateImportBatchRowsProcessed(metadataDb, batchId, rowsImported);
                        }
                    }
                    rowsImported += this.commitOpenAsvpShardTransactions(shardContexts);
                    this.updateImportBatchRowsProcessed(metadataDb, batchId, rowsImported);
                } catch (error) {
                    this.rollbackOpenAsvpShardTransactions(shardContexts);
                    this.updateImportBatchRowsProcessed(metadataDb, batchId, rowsImported);
                    throw error;
                }
                this.logger.log(`Imported ${fileRowsImported} ASVP rows from ${_path.basename(preparedFile.filePath)} (${rowsImported} total)`);
                this.closeAsvpShardBuildContexts(shardContexts, touchedBucketKeys);
                await this.deleteImportedAsvpPreparedFileIfConfigured(importPlan, preparedFile.filePath);
            }
            rowsImported += this.commitOpenAsvpShardTransactions(shardContexts);
            this.updateImportBatchRowsProcessed(metadataDb, batchId, rowsImported);
            this.closeAsvpShardBuildContexts(shardContexts);
            await this.replaceAsvpShardDirectory(buildRoot);
        } catch (error) {
            this.rollbackOpenAsvpShardTransactions(shardContexts);
            this.closeAsvpShardBuildContexts(shardContexts);
            await (0, _registrysourceimportpreparation.cleanupPreparedSourceImportPlan)(importPlan).catch(()=>undefined);
            throw error;
        }
        await this.finalizeConsumedSourceImport("asvp", importPlan);
        return rowsImported;
    }
    async rebuildCourtDates(files, batchId) {
        const importPlan = await (0, _registrysourceimportpreparation.prepareSourceImportPlan)("court_dates", files);
        const db = this.getSharedDb();
        let rowsImported = 0;
        try {
            db.exec("BEGIN IMMEDIATE");
            db.prepare(`DELETE FROM court_dates`).run();
            const insertRow = db.prepare(`
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
        `);
            const now = new Date().toISOString();
            for (const preparedFile of importPlan.files){
                let sourceRowNum = 0;
                for await (const row of this.readDelimitedRows(preparedFile.filePath, {
                    delimiter: "\t",
                    encoding: preparedFile.encoding
                })){
                    sourceRowNum += 1;
                    insertRow.run(row.case || "", this.normalizeCaseNumber(row.case || ""), row.date || "", row.judges || "", row.court_name || "", row.court_room || "", row.case_involved || "", row.case_description || "", preparedFile.sourceFileName, sourceRowNum, batchId, now, now);
                    rowsImported += 1;
                }
            }
            db.exec("COMMIT");
        } catch (error) {
            this.rollbackTransaction(db, "court_dates rebuild");
            await (0, _registrysourceimportpreparation.cleanupPreparedSourceImportPlan)(importPlan).catch(()=>undefined);
            throw error;
        }
        await this.finalizeConsumedSourceImport("court_dates", importPlan);
        return rowsImported;
    }
    parseAsvpBucketKeyFromSourceFileName(fileName) {
        const match = fileName.match(/^asvp-(.+)\.csv$/i);
        return match?.[1] || null;
    }
    async resetAsvpShardBuildBucket(contexts, buildRoot, bucketKey) {
        const existingContext = contexts.get(bucketKey);
        if (existingContext) {
            this.closeAsvpShardBuildContexts(contexts, new Set([
                bucketKey
            ]));
        }
        const fileName = this.buildAsvpShardFileName(bucketKey);
        const baseFilePath = _path.join(buildRoot, fileName);
        await this.removePathIfExists(baseFilePath);
        await this.removePathIfExists(`${baseFilePath}-wal`);
        await this.removePathIfExists(`${baseFilePath}-shm`);
    }
    async deleteImportedAsvpPreparedFileIfConfigured(importPlan, filePath) {
        if (!this.deleteImportedSourceFiles.asvp) {
            return;
        }
        if (!importPlan.sourceFilesToDelete.includes(filePath)) {
            return;
        }
        await (0, _promises.unlink)(filePath).catch(()=>undefined);
        importPlan.sourceFilesToDelete = importPlan.sourceFilesToDelete.filter((candidate)=>candidate !== filePath);
    }
    async listSourceFiles(source) {
        const directory = source === "court_stan" ? this.courtStanDirectory : source === "asvp" ? this.asvpDirectory : this.courtDatesDirectory;
        const filePaths = await this.listCsvFilesRecursively(directory);
        if (source !== "asvp") {
            return filePaths;
        }
        const splitFiles = filePaths.filter((filePath)=>filePath.split(_path.sep).includes("split"));
        return splitFiles.length > 0 ? splitFiles : filePaths;
    }
    async listCsvFilesRecursively(directory) {
        try {
            const entries = await (0, _promises.readdir)(directory, {
                withFileTypes: true
            });
            const filePaths = [];
            for (const entry of entries){
                const entryPath = _path.join(directory, entry.name);
                if (entry.isDirectory()) {
                    filePaths.push(...await this.listCsvFilesRecursively(entryPath));
                    continue;
                }
                if (entry.name.toLowerCase().endsWith(".csv")) {
                    filePaths.push(entryPath);
                }
            }
            return filePaths.sort();
        } catch (error) {
            const errno = error;
            if (errno?.code === "ENOENT") {
                return [];
            }
            throw error;
        }
    }
    async computeDirectorySignature(files) {
        const hash = _crypto.createHash("sha256");
        for (const filePath of files){
            const fileStat = await (0, _promises.stat)(filePath);
            hash.update(_path.basename(filePath));
            hash.update(String(fileStat.size));
            hash.update(String(fileStat.mtimeMs));
        }
        return hash.digest("hex");
    }
    async *readDelimitedRows(filePath, options) {
        const rawInput = this.createDecodedInputStream(filePath, options.encoding);
        const reader = _readline.createInterface({
            input: rawInput,
            crlfDelay: Infinity
        });
        let headers = null;
        let bufferedLine = "";
        try {
            for await (const line of reader){
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
                    throw new Error(`Invalid delimited row in ${_path.basename(filePath)}`);
                }
                yield headers.reduce((accumulator, header, index)=>{
                    accumulator[header] = values[index] ?? "";
                    return accumulator;
                }, {});
            }
        } finally{
            reader.close();
            if ("close" in rawInput && typeof rawInput.close === "function") {
                rawInput.close();
            }
        }
    }
    createDecodedInputStream(filePath, encoding) {
        if (encoding === "utf-8") {
            return (0, _fs.createReadStream)(filePath, {
                encoding: "utf-8"
            });
        }
        if (encoding === "cp1251") {
            return (0, _fs.createReadStream)(filePath).pipe(_iconvlite.decodeStream("cp1251"));
        }
        return (0, _fs.createReadStream)(filePath).pipe(this.createAsvpRepairStream());
    }
    createAsvpRepairStream() {
        return new _stream.Transform({
            transform: (chunk, _encoding, callback)=>{
                const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, "latin1");
                const repairedText = _iconvlite.decode(Buffer.from(buffer.toString("latin1"), "latin1"), "cp1251");
                callback(null, repairedText);
            }
        });
    }
    buildFtsQuery(normalizedQuery) {
        return normalizedQuery.split(" ").filter(Boolean).map((token)=>`"${token.replace(/"/g, '""')}"*`).join(" AND ");
    }
    queryCourtRegistryRows(db, options, normalizedQuery) {
        const conditions = [];
        const params = [];
        const normalizedCaseNumber = this.normalizeCaseNumber(options.caseNumber || "");
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
            return db.prepare(`
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
          `).all(matchQuery, ...params);
        }
        return db.prepare(`
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
        `).all(...params);
    }
    queryAsvpRows(db, options, normalizedQuery) {
        const conditions = [];
        const params = [];
        const normalizedCaseNumber = this.normalizeCaseNumber(options.caseNumber || "");
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
            return db.prepare(`
          SELECT
            a.*
          FROM asvp_records_fts f
          JOIN asvp_records a ON a.id = f.rowid
          WHERE asvp_records_fts MATCH ?
            ${conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : ""}
          LIMIT 400
          `).all(matchQuery, ...params);
        }
        return db.prepare(`
        SELECT
          *
        FROM asvp_records a
        ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
        LIMIT 400
        `).all(...params);
    }
    splitParticipants(value) {
        return (value || "").split(",").map((participant)=>participant.trim()).filter(Boolean);
    }
    parseParticipant(participant) {
        const separatorIndex = participant.indexOf(":");
        if (separatorIndex === -1) {
            return {
                role: "",
                person: participant.trim()
            };
        }
        return {
            role: participant.slice(0, separatorIndex).trim(),
            person: participant.slice(separatorIndex + 1).trim()
        };
    }
    buildAsvpParticipants(creditorName, debtorName) {
        return [
            creditorName ? `Стягувач: ${creditorName}` : "",
            debtorName ? `Боржник: ${debtorName}` : ""
        ].filter(Boolean).join(", ");
    }
    matchesCourtRowFilters(row, options, normalizedQuery) {
        return this.matchesSearchQuery(this.normalizeSearchValue(row.participant_raw || ""), normalizedQuery) && this.matchesContainsFilter(this.normalizeCaseNumber(row.case_number || ""), this.normalizeCaseNumber(options.caseNumber || "")) && this.matchesContainsFilter(this.normalizeSearchValue(row.court_name || ""), this.normalizeSearchValue(options.institutionName || "")) && this.matchesContainsFilter(this.normalizeSearchValue(row.participant_role || ""), this.normalizeSearchValue(options.role || "")) && this.matchesContainsFilter(this.normalizeSearchValue(row.stage_name || ""), this.normalizeSearchValue(options.status || "")) && this.matchesContainsFilter(this.normalizeSearchValue(row.judge || ""), this.normalizeSearchValue(options.judge || "")) && this.matchesContainsFilter(this.normalizeSearchValue(row.case_proc || ""), this.normalizeSearchValue(options.proceedingNumber || "")) && this.matchesContainsFilter(this.normalizeSearchValue(row.record_type || ""), this.normalizeSearchValue(options.proceedingType || ""));
    }
    matchesAsvpRowFilters(row, options, role) {
        return this.matchesContainsFilter(this.normalizeCaseNumber(row.vp_ordernum || ""), this.normalizeCaseNumber(options.caseNumber || "")) && this.matchesContainsFilter(this.normalizeSearchValue(row.org_name || ""), this.normalizeSearchValue(options.institutionName || "")) && this.matchesContainsFilter(this.normalizeSearchValue(role), this.normalizeSearchValue(options.role || "")) && this.matchesContainsFilter(this.normalizeSearchValue(row.vp_state || ""), this.normalizeSearchValue(options.status || "")) && this.matchesContainsFilter(this.normalizeSearchValue(row.dvs_code || ""), this.normalizeSearchValue(options.proceedingNumber || "")) && this.matchesContainsFilter(this.normalizeSearchValue("Виконавче провадження"), this.normalizeSearchValue(options.proceedingType || ""));
    }
    matchesDateRange(rawDate, options, withTime = false) {
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
    parseIsoDate(value) {
        if (!value) {
            return undefined;
        }
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) {
            return undefined;
        }
        return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
    parseRegistryDate(value, withTime = false) {
        const match = withTime ? value.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/) : value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (!match) {
            return undefined;
        }
        return Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4] || "0"), Number(match[5] || "0"), Number(match[6] || "0"));
    }
    parseDelimitedLine(line, delimiter) {
        const values = [];
        let currentValue = "";
        let inQuotes = false;
        for(let index = 0; index < line.length; index += 1){
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
    isCompleteDelimitedRecord(line) {
        let inQuotes = false;
        for(let index = 0; index < line.length; index += 1){
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
    cleanValue(value) {
        return value.replace(/\r/g, "").trim();
    }
    normalizeSearchValue(value) {
        return value.normalize("NFKC").trim().replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/[“”«»„]/g, '"').replace(/[ʼ’`'ʹꞌ]/g, "'").replace(/[‐‑‒–—―]/g, "-").replace(/\s+/g, " ").toLocaleLowerCase("uk-UA");
    }
    buildSearchQueryVariants(value) {
        if (!value) {
            return [];
        }
        const apostropheVariants = [
            "'",
            "’",
            "ʼ"
        ];
        const normalizedValue = value.replace(/[ʼ’`'ʹꞌ]/g, "'");
        return Array.from(new Set([
            value,
            normalizedValue
        ].flatMap((candidate)=>apostropheVariants.map((apostrophe)=>candidate.replace(/[ʼ’`'ʹꞌ]/g, apostrophe)))));
    }
    matchesSearchQuery(normalizedCandidate, normalizedQuery) {
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
        return queryTokens.every((queryToken)=>candidateTokens.some((candidateToken)=>candidateToken === queryToken || candidateToken.startsWith(queryToken) || queryToken.startsWith(candidateToken)));
    }
    matchesContainsFilter(normalizedCandidate, normalizedFilter) {
        if (!normalizedFilter) {
            return true;
        }
        if (!normalizedCandidate) {
            return false;
        }
        return normalizedCandidate.includes(normalizedFilter);
    }
    compareSearchResults(leftValue, rightValue, normalizedQuery) {
        const leftScore = this.getSearchScore(leftValue, normalizedQuery);
        const rightScore = this.getSearchScore(rightValue, normalizedQuery);
        if (leftScore !== rightScore) {
            return rightScore - leftScore;
        }
        return leftValue.localeCompare(rightValue, "uk-UA");
    }
    getSearchScore(value, normalizedQuery) {
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
        queryTokens.forEach((queryToken, index)=>{
            const tokenIndex = valueTokens.findIndex((valueToken)=>valueToken === queryToken || valueToken.startsWith(queryToken) || queryToken.startsWith(valueToken));
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
    tokenizeSearchValue(value) {
        return value.split(/[-\s"'.,;:()[\]{}\\+/]+/).map((token)=>token.trim()).filter(Boolean);
    }
    normalizeCaseNumber(value) {
        return value.normalize("NFKC").trim().replace(/[‐‑‒–—―]/g, "-").replace(/\s+/g, "").toLocaleLowerCase("uk-UA");
    }
    buildSchemaSql(kind) {
        const sourceTables = kind === "shared" ? `
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
          ` : ``;
        return `
      ${sourceTables}
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
    `;
    }
    buildAsvpShardSchemaSql() {
        return `
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
      CREATE VIRTUAL TABLE IF NOT EXISTS asvp_records_fts
        USING fts5(
          debtor_name_normalized,
          creditor_name_normalized,
          org_name_normalized,
          content='asvp_records',
          content_rowid='id',
          tokenize='unicode61'
        );
    `;
    }
    getSharedDb() {
        if (!this.sharedDb) {
            throw new Error("Shared registry index DB is not initialized");
        }
        return this.sharedDb;
    }
    getAsvpDb() {
        if (!this.asvpDb) {
            throw new Error("ASVP registry index DB is not initialized");
        }
        return this.asvpDb;
    }
    getPrimaryDbForSource(source) {
        return source === "asvp" ? this.getAsvpDb() : this.getSharedDb();
    }
    getDbForSourceCode(sourceCode) {
        return sourceCode === "asvp" ? this.getAsvpDb() : this.getSharedDb();
    }
    isIndexAvailableInDb(database, source) {
        const row = database.prepare(`SELECT last_status, rows_imported FROM import_state WHERE source_code = ?`).get(source);
        return Boolean(row && row.last_status === "success" && row.rows_imported);
    }
    async isPrimaryAsvpIndexAvailable() {
        const row = this.getAsvpDb().prepare(`
        SELECT last_success_at, rows_imported
        FROM import_state
        WHERE source_code = 'asvp'
        LIMIT 1
        `).get();
        return Boolean(row?.last_success_at && (row.rows_imported || 0) > 0 && await this.hasAsvpShardFiles());
    }
    isLegacyAsvpIndexAvailable() {
        const legacyDb = this.getLegacyAsvpDb();
        if (!legacyDb) {
            return false;
        }
        return this.isIndexAvailableInDb(legacyDb, "asvp");
    }
    async hasPersistedIndexForSource(source, currentState) {
        if (source !== "asvp") {
            return Boolean(currentState?.last_status === "success" && (currentState.rows_imported || 0) > 0);
        }
        return Boolean(currentState?.last_success_at && (currentState.rows_imported || 0) > 0 && await this.hasAsvpShardFiles());
    }
    async hasAsvpShardFiles() {
        return (await this.listAsvpShardFileNames()).length > 0;
    }
    async getAsvpShardDbEntries(options) {
        const fileNames = await this.listAsvpShardFileNames();
        const activePaths = new Set(fileNames.map((fileName)=>_path.join(this.asvpShardDirectory, fileName)));
        this.closeRemovedAsvpShardDbs(activePaths);
        const yearRange = this.getAsvpShardYearRange(options);
        return fileNames.map((fileName)=>{
            const filePath = _path.join(this.asvpShardDirectory, fileName);
            return {
                bucketKey: this.parseAsvpShardBucketKey(fileName),
                fileName,
                filePath
            };
        }).filter((entry)=>this.shouldIncludeAsvpShard(entry.bucketKey, yearRange)).map((entry)=>({
                ...entry,
                db: this.getOrOpenAsvpShardDb(entry.filePath)
            }));
    }
    async listAsvpShardFileNames() {
        try {
            const fileNames = await (0, _promises.readdir)(this.asvpShardDirectory);
            return fileNames.filter((fileName)=>/^asvp-.+\.db$/i.test(fileName)).sort((left, right)=>this.compareAsvpShardBucketKeys(this.parseAsvpShardBucketKey(left), this.parseAsvpShardBucketKey(right)));
        } catch (error) {
            const errno = error;
            if (errno?.code === "ENOENT") {
                return [];
            }
            throw error;
        }
    }
    getOrOpenAsvpShardDb(filePath) {
        const existing = this.asvpShardDbs.get(filePath);
        if (existing) {
            return existing;
        }
        const database = new Database(filePath);
        database.pragma("query_only = 1");
        database.pragma("busy_timeout = 5000");
        database.pragma("temp_store = MEMORY");
        this.asvpShardDbs.set(filePath, database);
        return database;
    }
    closeAsvpShardDbs() {
        for (const database of this.asvpShardDbs.values()){
            database.close();
        }
        this.asvpShardDbs.clear();
    }
    closeRemovedAsvpShardDbs(activePaths) {
        for (const [filePath, database] of this.asvpShardDbs.entries()){
            if (activePaths.has(filePath)) {
                continue;
            }
            database.close();
            this.asvpShardDbs.delete(filePath);
        }
    }
    extractAsvpBucketKey(rawDate) {
        const match = rawDate.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
        return match?.[3] || "unknown";
    }
    buildAsvpShardFileName(bucketKey) {
        const normalizedBucketKey = bucketKey.match(/^\d{4}$/) ? bucketKey : "unknown";
        return `asvp-${normalizedBucketKey}.db`;
    }
    parseAsvpShardBucketKey(fileName) {
        const match = fileName.match(/^asvp-(.+)\.db$/i);
        return match?.[1] || "unknown";
    }
    compareAsvpShardBucketKeys(left, right) {
        const leftYear = Number(left);
        const rightYear = Number(right);
        const leftIsYear = Number.isInteger(leftYear) && left.match(/^\d{4}$/);
        const rightIsYear = Number.isInteger(rightYear) && right.match(/^\d{4}$/);
        if (leftIsYear && rightIsYear) {
            return rightYear - leftYear;
        }
        if (leftIsYear) {
            return -1;
        }
        if (rightIsYear) {
            return 1;
        }
        return left.localeCompare(right, "en");
    }
    getAsvpShardYearRange(options) {
        const from = this.parseIsoDate(options?.dateFrom);
        const to = this.parseIsoDate(options?.dateTo);
        return {
            fromYear: from === undefined ? undefined : new Date(from).getUTCFullYear(),
            toYear: to === undefined ? undefined : new Date(to).getUTCFullYear()
        };
    }
    shouldIncludeAsvpShard(bucketKey, range) {
        if (range.fromYear === undefined && range.toYear === undefined) {
            return true;
        }
        if (!bucketKey.match(/^\d{4}$/)) {
            return false;
        }
        const year = Number(bucketKey);
        if (range.fromYear !== undefined && year < range.fromYear) {
            return false;
        }
        if (range.toYear !== undefined && year > range.toYear) {
            return false;
        }
        return true;
    }
    getOrCreateAsvpShardBuildContext(contexts, buildRoot, bucketKey) {
        const existing = contexts.get(bucketKey);
        if (existing) {
            return existing;
        }
        const filePath = _path.join(buildRoot, this.buildAsvpShardFileName(bucketKey));
        const database = new Database(filePath);
        database.pragma("journal_mode = DELETE");
        database.pragma("synchronous = NORMAL");
        database.pragma("temp_store = MEMORY");
        database.pragma("busy_timeout = 5000");
        database.exec(this.buildAsvpShardSchemaSql());
        const existingRowId = Number(database.prepare(`SELECT COALESCE(MAX(id), 0) AS row_id FROM asvp_records`).get()?.row_id || 0);
        const context = {
            bucketKey,
            db: database,
            filePath,
            insertRow: database.prepare(`
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
        `),
            insertFts: database.prepare(`
        INSERT INTO asvp_records_fts (
          rowid,
          debtor_name_normalized,
          creditor_name_normalized,
          org_name_normalized
        ) VALUES (?, ?, ?, ?)
        `),
            rowId: existingRowId,
            rowsImported: 0,
            pendingTransactionRows: 0,
            transactionOpen: false
        };
        contexts.set(bucketKey, context);
        return context;
    }
    commitAsvpShardTransaction(context) {
        if (!context.transactionOpen || context.pendingTransactionRows <= 0) {
            return 0;
        }
        context.db.exec("COMMIT");
        const committedRows = context.pendingTransactionRows;
        context.transactionOpen = false;
        context.pendingTransactionRows = 0;
        return committedRows;
    }
    commitOpenAsvpShardTransactions(contexts) {
        let committedRows = 0;
        for (const context of contexts.values()){
            committedRows += this.commitAsvpShardTransaction(context);
        }
        return committedRows;
    }
    rollbackOpenAsvpShardTransactions(contexts) {
        for (const context of contexts.values()){
            if (!context.transactionOpen) {
                continue;
            }
            this.rollbackTransaction(context.db, `asvp shard rebuild ${context.bucketKey}`);
            context.transactionOpen = false;
            context.pendingTransactionRows = 0;
        }
    }
    closeAsvpShardBuildContexts(contexts, bucketKeys) {
        for (const [bucketKey, context] of contexts.entries()){
            if (bucketKeys && !bucketKeys.has(bucketKey)) {
                continue;
            }
            try {
                context.db.pragma("wal_checkpoint(TRUNCATE)");
            } catch  {
            // no-op: closing the DB is still the important cleanup step here
            }
            context.db.close();
            contexts.delete(bucketKey);
        }
    }
    updateImportBatchRowsProcessed(database, batchId, rowsProcessed) {
        database.prepare(`
        UPDATE import_batches
        SET rows_processed = ?
        WHERE id = ?
        `).run(rowsProcessed, batchId);
    }
    async replaceAsvpShardDirectory(buildRoot) {
        await (0, _promises.mkdir)(_path.dirname(this.asvpShardDirectory), {
            recursive: true
        });
        this.closeAsvpShardDbs();
        const backupDirectory = `${this.asvpShardDirectory}.previous-${Date.now()}`;
        let movedExistingDirectory = false;
        try {
            if (await this.pathExists(this.asvpShardDirectory)) {
                await (0, _promises.rm)(backupDirectory, {
                    recursive: true,
                    force: true
                });
                await (0, _promises.rename)(this.asvpShardDirectory, backupDirectory);
                movedExistingDirectory = true;
            }
            await (0, _promises.rename)(buildRoot, this.asvpShardDirectory);
            if (movedExistingDirectory) {
                await (0, _promises.rm)(backupDirectory, {
                    recursive: true,
                    force: true
                });
            }
        } catch (error) {
            if (movedExistingDirectory && !await this.pathExists(this.asvpShardDirectory) && await this.pathExists(backupDirectory)) {
                await (0, _promises.rename)(backupDirectory, this.asvpShardDirectory).catch(()=>undefined);
            }
            if (await this.pathExists(buildRoot)) {
                await (0, _promises.rm)(buildRoot, {
                    recursive: true,
                    force: true
                }).catch(()=>undefined);
            }
            throw error;
        }
    }
    async removePathIfExists(targetPath) {
        await (0, _promises.rm)(targetPath, {
            recursive: true,
            force: true
        }).catch(()=>undefined);
    }
    async pathExists(targetPath) {
        try {
            await (0, _promises.stat)(targetPath);
            return true;
        } catch (error) {
            const errno = error;
            if (errno?.code === "ENOENT") {
                return false;
            }
            throw error;
        }
    }
    getLegacyAsvpDb() {
        const sharedDb = this.getSharedDb();
        if (!this.tableExists(sharedDb, "asvp_records") || !this.tableExists(sharedDb, "asvp_records_fts")) {
            return null;
        }
        if (!this.isIndexAvailableInDb(sharedDb, "asvp")) {
            return null;
        }
        return sharedDb;
    }
    async migrateLegacyRegistrySchema(database) {
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
          DROP TABLE IF EXISTS asvp_records_fts;
          CREATE VIRTUAL TABLE asvp_records_fts
            USING fts5(
              debtor_name_normalized,
              creditor_name_normalized,
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
                this.rollbackTransaction(database, "legacy court_dates schema migration");
                throw error;
            }
        }
        if (migrated) {
            database.pragma("wal_checkpoint(TRUNCATE)");
            database.exec("VACUUM");
        }
    }
    tableHasColumn(database, tableName, columnName) {
        const columns = database.prepare(`PRAGMA table_info(${tableName})`).all();
        return columns.some((column)=>column.name === columnName);
    }
    tableExists(database, tableName) {
        const row = database.prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type IN ('table', 'view')
          AND name = ?
        LIMIT 1
        `).get(tableName);
        return Boolean(row?.name);
    }
    rollbackTransaction(db, context) {
        if (db.inTransaction === false) {
            return;
        }
        try {
            db.exec("ROLLBACK");
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (message.includes("no transaction is active")) {
                return;
            }
            this.logger.warn(`Rollback warning during ${context}: ${message}`);
        }
    }
    compactWriteAheadLogIfPossible(sources) {
        const kinds = new Set(sources.map((source)=>source === "asvp" ? "asvp" : "shared"));
        for (const kind of kinds){
            try {
                const db = kind === "asvp" ? this.getAsvpDb() : this.getSharedDb();
                db.pragma("wal_checkpoint(TRUNCATE)");
            } catch (error) {
                this.logger.warn(`SQLite WAL checkpoint warning for ${kind}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    async finalizeConsumedSourceImport(source, importPlan) {
        try {
            await (0, _registrysourceimportpreparation.finalizePreparedSourceImportPlan)(source, importPlan, {
                deleteSourceFiles: this.deleteImportedSourceFiles[source]
            });
        } catch (error) {
            this.logger.warn(`${source} source cleanup warning: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async cleanupUnchangedSourceFiles(source, files, currentState, hasCurrentIndex) {
        if (!this.deleteImportedSourceFiles[source] || !hasCurrentIndex || currentState?.last_status !== "success" || (currentState.rows_imported || 0) <= 0) {
            return;
        }
        try {
            await Promise.all(files.map((filePath)=>(0, _promises.rm)(filePath, {
                    force: true
                })));
            this.logger.log(`Deleted ${files.length} unchanged ${source} source file(s) after index verification`);
        } catch (error) {
            this.logger.warn(`${source} unchanged source cleanup warning: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async runSourceRebuildSerialized(source, task) {
        const previous = this.sourceRebuilds.get(source) || Promise.resolve();
        const next = previous.catch(()=>undefined).then(task);
        this.sourceRebuilds.set(source, next);
        try {
            await next;
        } finally{
            if (this.sourceRebuilds.get(source) === next) {
                this.sourceRebuilds.delete(source);
            }
        }
    }
    constructor(dbPathOrOptions){
        this.logger = new _common.Logger(RegistryIndexService.name);
        this.sourceRebuilds = new Map();
        this.sharedDb = null;
        this.asvpDb = null;
        this.asvpShardDbs = new Map();
        if (typeof dbPathOrOptions === "string") {
            this.sharedDbPath = dbPathOrOptions;
            this.asvpDbPath = _path.join(_path.dirname(dbPathOrOptions), "asvp-index.db");
            this.asvpShardDirectory = _path.join(_path.dirname(dbPathOrOptions), "asvp-index-shards");
            this.asvpShardBuildDirectory = _path.join(_path.dirname(dbPathOrOptions), "asvp-index-shards.build");
        } else {
            this.sharedDbPath = dbPathOrOptions?.sharedDbPath || _path.resolve(process.cwd(), "storage", "registry-index.db");
            this.asvpDbPath = dbPathOrOptions?.asvpDbPath || _path.resolve(process.cwd(), "storage", "asvp-index.db");
            this.asvpShardDirectory = dbPathOrOptions?.asvpShardDirectory || _path.resolve(process.cwd(), "storage", "asvp-index-shards");
            this.asvpShardBuildDirectory = _path.join(_path.dirname(this.asvpShardDirectory), "asvp-index-shards.build");
        }
        this.courtStanDirectory = _path.resolve(process.cwd(), "court_stan");
        this.asvpDirectory = _path.resolve(process.cwd(), "asvp");
        this.courtDatesDirectory = _path.resolve(process.cwd(), "court_dates");
        this.batchSize = Number(process.env.REGISTRY_INDEX_BATCH_SIZE || "1000");
        this.deleteImportedSourceFiles = {
            court_stan: (0, _registrysourceimportpreparation.shouldDeleteImportedSourceFiles)("court_stan"),
            asvp: (0, _registrysourceimportpreparation.shouldDeleteImportedSourceFiles)("asvp"),
            court_dates: (0, _registrysourceimportpreparation.shouldDeleteImportedSourceFiles)("court_dates")
        };
    }
};
RegistryIndexService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Optional)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ])
], RegistryIndexService);

//# sourceMappingURL=registry-index.service.js.map