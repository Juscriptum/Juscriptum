import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { spawn } from "child_process";
import { createReadStream } from "fs";
import { access, readdir, stat } from "fs/promises";
import * as iconv from "iconv-lite";
import * as path from "path";
import * as readline from "readline";
import { Transform } from "stream";
import { RegistryIndexService } from "../../registry-index/services/registry-index.service";

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

export type RegistrySource = "court_registry" | "asvp";
export const COURT_REGISTRY_SOURCE_LABEL = "Судовий реєстр";
export const ASVP_SOURCE_LABEL = "Реєстр виконавчих проваджень";

export interface CourtRegistrySearchResult {
  source: RegistrySource;
  sourceLabel: string;
  person: string;
  role: string;
  caseDescription: string;
  caseNumber: string;
  courtName: string;
  caseProc: string;
  registrationDate: string;
  judge: string;
  type: string;
  stageDate: string;
  stageName: string;
  participants: string;
  counterpartyName?: string;
  counterpartyRole?: string;
  enforcementState?: string;
}

export interface CourtRegistrySearchOptions {
  query: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CourtDateSearchResult {
  date: string;
  judges: string;
  caseNumber: string;
  courtName: string;
  courtRoom: string;
  caseInvolved: string;
  caseDescription: string;
}

interface DelimitedReaderOptions {
  delimiter: string;
  encoding: "utf-8" | "cp1251" | "asvp-repaired";
}

export const COURT_REGISTRY_DIRECTORIES = "COURT_REGISTRY_DIRECTORIES";
export const ASVP_REGISTRY_DIRECTORIES = "ASVP_REGISTRY_DIRECTORIES";
export const COURT_DATES_DIRECTORIES = "COURT_DATES_DIRECTORIES";

@Injectable()
export class CourtRegistryService {
  private readonly logger = new Logger(CourtRegistryService.name);
  private readonly asvpStreamFallbackLimitBytes = Number(
    process.env.ASVP_STREAM_FALLBACK_LIMIT_BYTES || `${50 * 1024 * 1024}`,
  );
  private readonly asvpNativeSearchTimeoutMs = Number(
    process.env.ASVP_NATIVE_SEARCH_TIMEOUT_MS || "10000",
  );
  private readonly combinedAsvpTimeoutMs = Number(
    process.env.COMBINED_ASVP_TIMEOUT_MS || "1500",
  );
  private readonly registryDirectories: string[];
  private readonly asvpDirectories: string[];
  private readonly courtDatesDirectories: string[];

  constructor(
    @Optional()
    @Inject(COURT_REGISTRY_DIRECTORIES)
    registryDirectories?: string[],
    @Optional()
    @Inject(ASVP_REGISTRY_DIRECTORIES)
    asvpDirectories?: string[],
    @Optional()
    @Inject(COURT_DATES_DIRECTORIES)
    courtDatesDirectories?: string[],
    @Optional()
    private readonly registryIndexService?: RegistryIndexService,
  ) {
    this.registryDirectories = registryDirectories ?? [
      path.resolve(process.cwd(), "court_stan"),
      path.resolve(process.cwd(), "court_base"),
    ];
    this.asvpDirectories = asvpDirectories ?? [
      path.resolve(process.cwd(), "asvp"),
    ];
    this.courtDatesDirectories = courtDatesDirectories ?? [
      path.resolve(process.cwd(), "court_dates"),
    ];
  }

  async searchInCourtRegistry(
    options: CourtRegistrySearchOptions,
  ): Promise<CourtRegistrySearchResult[]> {
    if (this.registryIndexService) {
      try {
        const hasIndex =
          await this.registryIndexService.isIndexAvailableFor("court_stan");
        if (hasIndex) {
          return this.registryIndexService.searchCourtRegistry(options);
        }
      } catch (error) {
        this.logger.warn(
          `Court registry index lookup failed, falling back to CSV scan: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    const normalizedQuery = this.normalizeSearchValue(options.query);
    const dateRange = this.buildDateRange(options.dateFrom, options.dateTo);

    if (!normalizedQuery) {
      throw new BadRequestException("Пошуковий запит не може бути порожнім");
    }

    const registryDirectory = await this.resolveDirectory(
      this.registryDirectories,
      "Каталог реєстру судових справ не знайдено. Очікувався `court_stan` або `court_base` у корені проєкту.",
    );
    const fileNames = await this.listCsvFiles(registryDirectory);
    const results: CourtRegistrySearchResult[] = [];

    for (const fileName of fileNames) {
      const filePath = path.join(registryDirectory, fileName);

      try {
        const fileResults = await this.searchCourtRegistryFile(
          filePath,
          normalizedQuery,
          dateRange,
        );
        results.push(...fileResults);
      } catch (error) {
        this.logger.warn(
          `Skipping registry file ${fileName}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return results;
  }

  async searchInCaseRegistries(
    options: CourtRegistrySearchOptions,
  ): Promise<CourtRegistrySearchResult[]> {
    const [courtResults, asvpResults] = await Promise.allSettled([
      this.searchInCourtRegistry(options),
      this.withTimeout(
        this.searchInAsvpRegistry(options),
        this.combinedAsvpTimeoutMs,
        "ASVP combined search timeout",
      ),
    ]);

    if (courtResults.status === "rejected") {
      this.logger.warn(
        `Court registry search failed in combined search: ${
          courtResults.reason instanceof Error
            ? courtResults.reason.message
            : String(courtResults.reason)
        }`,
      );
    }

    if (asvpResults.status === "rejected") {
      this.logger.warn(
        `ASVP search failed in combined search: ${
          asvpResults.reason instanceof Error
            ? asvpResults.reason.message
            : String(asvpResults.reason)
        }`,
      );
    }

    return [
      ...(courtResults.status === "fulfilled" ? courtResults.value : []),
      ...(asvpResults.status === "fulfilled" ? asvpResults.value : []),
    ];
  }

  async searchInAsvpRegistry(
    options: CourtRegistrySearchOptions,
  ): Promise<CourtRegistrySearchResult[]> {
    if (this.registryIndexService) {
      try {
        const hasIndex =
          await this.registryIndexService.isIndexAvailableFor("asvp");
        if (hasIndex) {
          return this.registryIndexService.searchAsvpRegistry(options);
        }
      } catch (error) {
        this.logger.warn(
          `ASVP index lookup failed, falling back to raw search: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    const normalizedQuery = this.normalizeSearchValue(options.query);
    const dateRange = this.buildDateRange(options.dateFrom, options.dateTo);

    if (!normalizedQuery) {
      throw new BadRequestException("Пошуковий запит не може бути порожнім");
    }

    const registryDirectory = await this.resolveDirectory(
      this.asvpDirectories,
      "Каталог реєстру виконавчих проваджень не знайдено. Очікувався `asvp` у корені проєкту.",
    );
    const fileNames = await this.listCsvFiles(registryDirectory);
    const results: CourtRegistrySearchResult[] = [];

    for (const fileName of fileNames) {
      const filePath = path.join(registryDirectory, fileName);

      try {
        const fileResults = await this.searchAsvpFile(
          filePath,
          options.query,
          normalizedQuery,
          dateRange,
        );
        results.push(...fileResults);
      } catch (error) {
        this.logger.warn(
          `Skipping ASVP file ${fileName}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return results;
  }

  async findCourtDateByCaseNumber(
    caseNumber: string,
  ): Promise<CourtDateSearchResult | null> {
    if (this.registryIndexService) {
      try {
        const hasIndex =
          await this.registryIndexService.isIndexAvailableFor("court_dates");
        if (hasIndex) {
          return this.registryIndexService.findCourtDateByCaseNumber(
            caseNumber,
          );
        }
      } catch (error) {
        this.logger.warn(
          `Court dates index lookup failed, falling back to CSV scan: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    const results = await this.findCourtDatesByCaseNumbers([caseNumber]);
    return results.get(this.normalizeCaseNumber(caseNumber)) ?? null;
  }

  async findCourtDatesByCaseNumbers(
    caseNumbers: string[],
  ): Promise<Map<string, CourtDateSearchResult>> {
    const normalizedNumbers = new Set(
      caseNumbers
        .map((value) => this.normalizeCaseNumber(value))
        .filter((value) => value.length > 0),
    );

    if (normalizedNumbers.size === 0) {
      return new Map();
    }

    const directory = await this.resolveDirectory(
      this.courtDatesDirectories,
      "Каталог дат судових засідань не знайдено. Очікувався `court_dates` у корені проєкту.",
    );
    const fileNames = await this.listCsvFiles(directory);
    const matches = new Map<string, CourtDateSearchResult>();

    for (const fileName of fileNames) {
      const filePath = path.join(directory, fileName);

      try {
        for await (const row of this.readDelimitedRows<CourtDateRow>(filePath, {
          delimiter: "\t",
          encoding: "utf-8",
        })) {
          const normalizedCaseNumber = this.normalizeCaseNumber(row.case);

          if (
            !normalizedCaseNumber ||
            !normalizedNumbers.has(normalizedCaseNumber) ||
            matches.has(normalizedCaseNumber)
          ) {
            continue;
          }

          matches.set(normalizedCaseNumber, {
            date: row.date || "",
            judges: row.judges || "",
            caseNumber: row.case || "",
            courtName: row.court_name || "",
            courtRoom: row.court_room || "",
            caseInvolved: row.case_involved || "",
            caseDescription: row.case_description || "",
          });

          if (matches.size === normalizedNumbers.size) {
            return matches;
          }
        }
      } catch (error) {
        this.logger.warn(
          `Skipping court dates file ${fileName}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return matches;
  }

  private async searchCourtRegistryFile(
    filePath: string,
    normalizedQuery: string,
    dateRange?: { from?: number; to?: number },
  ): Promise<CourtRegistrySearchResult[]> {
    const results: CourtRegistrySearchResult[] = [];

    for await (const row of this.readDelimitedRows<CourtRegistryRow>(filePath, {
      delimiter: "\t",
      encoding: "utf-8",
    })) {
      results.push(
        ...this.extractCourtMatches(row, normalizedQuery, dateRange),
      );
    }

    return results;
  }

  private async searchAsvpFile(
    filePath: string,
    rawQuery: string,
    normalizedQuery: string,
    dateRange?: { from?: number; to?: number },
  ): Promise<CourtRegistrySearchResult[]> {
    const fastResults = await this.searchAsvpFileWithNativeTools(
      filePath,
      rawQuery,
      normalizedQuery,
      dateRange,
    );

    if (fastResults) {
      return fastResults;
    }

    if (await this.shouldSkipAsvpStreamFallback(filePath)) {
      this.logger.warn(
        `Skipping streamed ASVP fallback for ${path.basename(filePath)} because the file exceeds ${this.asvpStreamFallbackLimitBytes} bytes`,
      );
      return [];
    }

    const results: CourtRegistrySearchResult[] = [];

    for await (const row of this.readDelimitedRows<AsvpRegistryRow>(filePath, {
      delimiter: ",",
      encoding: "asvp-repaired",
    })) {
      results.push(...this.extractAsvpMatches(row, normalizedQuery, dateRange));
    }

    return results;
  }

  private async searchAsvpFileWithNativeTools(
    filePath: string,
    rawQuery: string,
    normalizedQuery: string,
    dateRange?: { from?: number; to?: number },
  ): Promise<CourtRegistrySearchResult[] | null> {
    const rgQuery = rawQuery.trim().replace(/\s+/g, " ");

    if (!rgQuery) {
      return [];
    }

    try {
      const lines = await this.findMatchingLinesWithIconvRg(filePath, rgQuery);

      return lines
        .map((line) => this.parseDelimitedLine(line, ","))
        .filter((values) => values.length === 13)
        .map(
          (values) =>
            [
              "DEBTOR_NAME",
              "DEBTOR_BIRTHDATE",
              "DEBTOR_CODE",
              "CREDITOR_NAME",
              "CREDITOR_CODE",
              "VP_ORDERNUM",
              "VP_BEGINDATE",
              "VP_STATE",
              "ORG_NAME",
              "DVS_CODE",
              "PHONE_NUM",
              "EMAIL_ADDR",
              "BANK_ACCOUNT",
            ].reduce(
              (accumulator, header, index) => {
                accumulator[header] = values[index] ?? "";
                return accumulator;
              },
              {} as Record<string, string>,
            ) as unknown as AsvpRegistryRow,
        )
        .flatMap((row) =>
          this.extractAsvpMatches(row, normalizedQuery, dateRange),
        );
    } catch (error) {
      this.logger.warn(
        `Native ASVP search failed for ${path.basename(filePath)}; falling back to streamed scan. ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  private async findMatchingLinesWithIconvRg(
    filePath: string,
    query: string,
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const iconvProcess = spawn("iconv", [
        "-f",
        "cp1251",
        "-t",
        "utf-8",
        filePath,
      ]);
      const rgProcess = spawn("rg", [
        "-n",
        "-F",
        "-i",
        "--text",
        "--max-count",
        process.env.ASVP_RAW_SEARCH_MAX_COUNT || "1",
        query,
      ]);

      const outputChunks: Buffer[] = [];
      const errorChunks: Buffer[] = [];

      iconvProcess.stdout.pipe(rgProcess.stdin);
      rgProcess.stdin.on("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "EPIPE") {
          return;
        }

        errorChunks.push(Buffer.from(error.message));
      });
      iconvProcess.stderr.on("data", (chunk) =>
        errorChunks.push(Buffer.from(chunk)),
      );
      rgProcess.stdout.on("data", (chunk) =>
        outputChunks.push(Buffer.from(chunk)),
      );
      rgProcess.stderr.on("data", (chunk) =>
        errorChunks.push(Buffer.from(chunk)),
      );

      let iconvClosed = false;
      let rgClosed = false;
      let iconvCode = 0;
      let rgCode = 0;
      const timeoutId = setTimeout(() => {
        iconvProcess.kill("SIGTERM");
        rgProcess.kill("SIGTERM");
        reject(
          new Error(
            `ASVP native search timed out after ${this.asvpNativeSearchTimeoutMs}ms`,
          ),
        );
      }, this.asvpNativeSearchTimeoutMs);

      const maybeResolve = () => {
        if (!iconvClosed || !rgClosed) {
          return;
        }

        clearTimeout(timeoutId);

        const output = Buffer.concat(outputChunks).toString("utf-8");
        const lines = output
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => line.replace(/^\d+:/, ""));

        const brokenPipeOnly = Buffer.concat(errorChunks)
          .toString("utf-8")
          .trim()
          .match(/broken pipe|ePIPE/i);

        if (iconvCode !== 0 && !(lines.length > 0 && brokenPipeOnly)) {
          reject(
            new Error(
              `iconv exited with code ${iconvCode}: ${Buffer.concat(errorChunks).toString("utf-8")}`,
            ),
          );
          return;
        }

        if (rgCode !== 0 && rgCode !== 1) {
          reject(
            new Error(
              `rg exited with code ${rgCode}: ${Buffer.concat(errorChunks).toString("utf-8")}`,
            ),
          );
          return;
        }

        resolve(lines);
      };

      iconvProcess.on("error", reject);
      rgProcess.on("error", reject);
      iconvProcess.on("close", (code) => {
        iconvClosed = true;
        iconvCode = code ?? 0;
        maybeResolve();
      });
      rgProcess.on("close", (code) => {
        if (!iconvClosed) {
          iconvProcess.kill("SIGTERM");
        }
        rgClosed = true;
        rgCode = code ?? 0;
        maybeResolve();
      });
    });
  }

  private async shouldSkipAsvpStreamFallback(
    filePath: string,
  ): Promise<boolean> {
    try {
      const fileStat = await stat(filePath);
      return fileStat.size > this.asvpStreamFallbackLimitBytes;
    } catch {
      return false;
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    label: string,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`${label} after ${timeoutMs}ms`));
      }, timeoutMs);

      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        },
      );
    });
  }

  private extractCourtMatches(
    row: CourtRegistryRow,
    normalizedQuery: string,
    dateRange?: { from?: number; to?: number },
  ): CourtRegistrySearchResult[] {
    if (!this.matchesDateRange(row.registration_date, dateRange)) {
      return [];
    }

    const participants = (row.participants || "")
      .split(",")
      .map((participant) => participant.trim())
      .filter(Boolean);

    if (participants.length === 0) {
      return [];
    }

    return participants
      .map((participant) => this.parseParticipant(participant))
      .filter((participant) =>
        participant.personNormalized.includes(normalizedQuery),
      )
      .map((participant) => ({
        source: "court_registry" as const,
        sourceLabel: COURT_REGISTRY_SOURCE_LABEL,
        person: participant.person,
        role: participant.role,
        caseDescription: row.description || "",
        caseNumber: row.case_number || "",
        courtName: row.court_name || "",
        caseProc: row.case_proc || "",
        registrationDate: row.registration_date || "",
        judge: row.judge || "",
        type: row.type || "",
        stageDate: row.stage_date || "",
        stageName: row.stage_name || "",
        participants: row.participants || "",
      }));
  }

  private extractAsvpMatches(
    row: AsvpRegistryRow,
    normalizedQuery: string,
    dateRange?: { from?: number; to?: number },
  ): CourtRegistrySearchResult[] {
    if (!this.matchesDateRange(row.VP_BEGINDATE, dateRange, true)) {
      return [];
    }

    const debtorName = (row.DEBTOR_NAME || "").trim();
    const creditorName = (row.CREDITOR_NAME || "").trim();
    const debtorMatches =
      this.normalizeSearchValue(debtorName).includes(normalizedQuery);
    const creditorMatches =
      this.normalizeSearchValue(creditorName).includes(normalizedQuery);

    if (!debtorMatches && !creditorMatches) {
      return [];
    }

    const results: CourtRegistrySearchResult[] = [];

    if (debtorMatches) {
      results.push({
        source: "asvp",
        sourceLabel: ASVP_SOURCE_LABEL,
        person: debtorName,
        role: "Боржник",
        caseDescription: row.VP_STATE || "",
        caseNumber: row.VP_ORDERNUM || "",
        courtName: row.ORG_NAME || "",
        caseProc: row.DVS_CODE || "",
        registrationDate: row.VP_BEGINDATE || "",
        judge: "",
        type: "Виконавче провадження",
        stageDate: row.VP_BEGINDATE || "",
        stageName: "Виконавче провадження",
        participants: this.buildAsvpParticipants(row),
        counterpartyName: creditorName,
        counterpartyRole: "Кредитор",
        enforcementState: row.VP_STATE || "",
      });
    }

    if (creditorMatches) {
      results.push({
        source: "asvp",
        sourceLabel: ASVP_SOURCE_LABEL,
        person: creditorName,
        role: "Стягувач",
        caseDescription: row.VP_STATE || "",
        caseNumber: row.VP_ORDERNUM || "",
        courtName: row.ORG_NAME || "",
        caseProc: row.DVS_CODE || "",
        registrationDate: row.VP_BEGINDATE || "",
        judge: "",
        type: "Виконавче провадження",
        stageDate: row.VP_BEGINDATE || "",
        stageName: "Виконавче провадження",
        participants: this.buildAsvpParticipants(row),
        counterpartyName: debtorName,
        counterpartyRole: "Боржник",
        enforcementState: row.VP_STATE || "",
      });
    }

    return results;
  }

  private buildAsvpParticipants(row: AsvpRegistryRow): string {
    const parts = [
      row.CREDITOR_NAME ? `Стягувач: ${row.CREDITOR_NAME}` : "",
      row.DEBTOR_NAME ? `Боржник: ${row.DEBTOR_NAME}` : "",
    ].filter(Boolean);

    return parts.join(", ");
  }

  private parseParticipant(participant: string): {
    role: string;
    person: string;
    personNormalized: string;
  } {
    const separatorIndex = participant.indexOf(":");

    if (separatorIndex === -1) {
      const person = participant.trim();
      return {
        role: "",
        person,
        personNormalized: this.normalizeSearchValue(person),
      };
    }

    const role = participant.slice(0, separatorIndex).trim();
    const person = participant.slice(separatorIndex + 1).trim();

    return {
      role,
      person,
      personNormalized: this.normalizeSearchValue(person),
    };
  }

  private buildDateRange(
    dateFrom?: string,
    dateTo?: string,
  ): {
    from?: number;
    to?: number;
  } {
    const from = this.parseIsoDate(dateFrom, "Початкова дата");
    const to = this.parseIsoDate(dateTo, "Кінцева дата");

    if (from && to && from > to) {
      throw new BadRequestException(
        "Початкова дата не може бути пізніше за кінцеву",
      );
    }

    return { from, to };
  }

  private parseIsoDate(
    value: string | undefined,
    label: string,
  ): number | undefined {
    if (!value) {
      return undefined;
    }

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
      throw new BadRequestException(`${label} має бути у форматі YYYY-MM-DD`);
    }

    const timestamp = Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
    );

    return Number.isNaN(timestamp) ? undefined : timestamp;
  }

  private matchesDateRange(
    rawDate: string,
    range?: { from?: number; to?: number },
    withTime: boolean = false,
  ): boolean {
    if (!range?.from && !range?.to) {
      return true;
    }

    const timestamp = this.parseRegistryDate(rawDate, withTime);

    if (timestamp === undefined) {
      return false;
    }

    if (range.from && timestamp < range.from) {
      return false;
    }

    if (range.to && timestamp > range.to + 24 * 60 * 60 * 1000 - 1) {
      return false;
    }

    return true;
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

  private async resolveDirectory(
    directories: string[],
    notFoundMessage: string,
  ): Promise<string> {
    for (const directory of directories) {
      try {
        await access(directory);
        return directory;
      } catch {
        continue;
      }
    }

    throw new NotFoundException(notFoundMessage);
  }

  private async listCsvFiles(directory: string): Promise<string[]> {
    return (await readdir(directory))
      .filter((fileName) => fileName.toLowerCase().endsWith(".csv"))
      .sort();
  }

  private async *readDelimitedRows<T>(
    filePath: string,
    options: DelimitedReaderOptions,
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
          throw new InternalServerErrorException(
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
    encoding: DelimitedReaderOptions["encoding"],
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

  private cleanValue(value: string): string {
    return value.replace(/\r/g, "").trim();
  }

  private normalizeSearchValue(value: string): string {
    return value
      .normalize("NFKC")
      .trim()
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/[“”«»„]/g, '"')
      .replace(/\s+/g, " ")
      .replace(/[’`']/g, "'")
      .replace(/[‐‑‒–—―]/g, "-")
      .toLocaleLowerCase("uk-UA");
  }

  private normalizeCaseNumber(value: string): string {
    return value
      .trim()
      .replace(/\s+/g, "")
      .replace(/[‐‑‒–—―]/g, "-")
      .toLocaleLowerCase("uk-UA");
  }
}
