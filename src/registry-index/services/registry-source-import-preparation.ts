import { once } from "events";
import { createReadStream, createWriteStream, WriteStream } from "fs";
import { mkdir, mkdtemp, rm, stat, unlink } from "fs/promises";
import * as iconv from "iconv-lite";
import * as os from "os";
import * as path from "path";
import * as readline from "readline";
import { Transform } from "stream";

export type PreparedFileEncoding = "utf-8" | "asvp-repaired";
export type RegistryImportSourceCode = "court_stan" | "asvp" | "court_dates";

interface SourceConfig {
  delimiter: string;
  originalEncoding: PreparedFileEncoding;
  splitMinBytesEnv: string;
  splitMinBytesDefault: number;
  splitRowsEnv: string;
  splitRowsDefault: number;
  deleteSourceFilesEnv: string;
  headers: string[];
  extractBucket: (row: Record<string, string>) => string;
}

interface ChunkWriterState {
  stream: WriteStream;
  rowCount: number;
}

const COURT_STAN_HEADERS = [
  "court_name",
  "case_number",
  "case_proc",
  "registration_date",
  "judge",
  "judges",
  "participants",
  "stage_date",
  "stage_name",
  "cause_result",
  "cause_dep",
  "type",
  "description",
];

const ASVP_HEADERS = [
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
];

const COURT_DATES_HEADERS = [
  "date",
  "judges",
  "case",
  "court_name",
  "court_room",
  "case_involved",
  "case_description",
];

const SOURCE_CONFIGS: Record<RegistryImportSourceCode, SourceConfig> = {
  court_stan: {
    delimiter: "\t",
    originalEncoding: "utf-8",
    splitMinBytesEnv: "COURT_STAN_PRE_SPLIT_MIN_BYTES",
    splitMinBytesDefault: 64 * 1024 * 1024,
    splitRowsEnv: "COURT_STAN_SPLIT_ROWS_PER_FILE",
    splitRowsDefault: 200000,
    deleteSourceFilesEnv: "COURT_STAN_DELETE_IMPORTED_FILES",
    headers: COURT_STAN_HEADERS,
    extractBucket: (row) =>
      extractYearFromDate(row.registration_date || row.stage_date || ""),
  },
  asvp: {
    delimiter: ",",
    originalEncoding: "asvp-repaired",
    splitMinBytesEnv: "ASVP_PRE_SPLIT_MIN_BYTES",
    splitMinBytesDefault: 256 * 1024 * 1024,
    splitRowsEnv: "ASVP_SPLIT_ROWS_PER_FILE",
    splitRowsDefault: 200000,
    deleteSourceFilesEnv: "ASVP_DELETE_IMPORTED_FILES",
    headers: ASVP_HEADERS,
    extractBucket: (row) => extractYearFromDate(row.VP_BEGINDATE || ""),
  },
  court_dates: {
    delimiter: "\t",
    originalEncoding: "utf-8",
    splitMinBytesEnv: "COURT_DATES_PRE_SPLIT_MIN_BYTES",
    splitMinBytesDefault: 64 * 1024 * 1024,
    splitRowsEnv: "COURT_DATES_SPLIT_ROWS_PER_FILE",
    splitRowsDefault: 200000,
    deleteSourceFilesEnv: "COURT_DATES_DELETE_IMPORTED_FILES",
    headers: COURT_DATES_HEADERS,
    extractBucket: (row) => extractYearFromDate(row.date || ""),
  },
};

export interface PreparedSourceImportFile {
  filePath: string;
  encoding: PreparedFileEncoding;
  sourceFileName: string;
}

export interface PreparedSourceImportPlan {
  files: PreparedSourceImportFile[];
  sourceFilesToDelete: string[];
  tempRoot: string | null;
}

export async function prepareSourceImportPlan(
  source: RegistryImportSourceCode,
  files: string[],
): Promise<PreparedSourceImportPlan> {
  const config = SOURCE_CONFIGS[source];
  const splitMinBytes = Math.max(
    Number(
      process.env[config.splitMinBytesEnv] || `${config.splitMinBytesDefault}`,
    ),
    1,
  );
  const splitRowsPerFile = Math.max(
    Number(process.env[config.splitRowsEnv] || `${config.splitRowsDefault}`),
    1,
  );
  const plan: PreparedSourceImportPlan = {
    files: [],
    sourceFilesToDelete: [...files],
    tempRoot: null,
  };

  for (const filePath of files) {
    const sourceFileName = path.basename(filePath);
    const fileSize = (await stat(filePath)).size;

    if (fileSize <= splitMinBytes) {
      plan.files.push({
        filePath,
        encoding: config.originalEncoding,
        sourceFileName,
      });
      continue;
    }

    if (!plan.tempRoot) {
      plan.tempRoot = await mkdtemp(
        path.join(os.tmpdir(), `law-organizer-${source}-import-`),
      );
    }

    const splitFiles = await splitLargeDelimitedFile(
      source,
      filePath,
      plan.tempRoot,
      splitRowsPerFile,
    );

    plan.files.push(
      ...splitFiles.map((preparedFilePath) => ({
        filePath: preparedFilePath,
        encoding: "utf-8" as const,
        sourceFileName,
      })),
    );
  }

  return plan;
}

export async function cleanupPreparedSourceImportPlan(
  plan: PreparedSourceImportPlan,
): Promise<void> {
  if (!plan.tempRoot) {
    return;
  }

  await rm(plan.tempRoot, { recursive: true, force: true });
}

export async function finalizePreparedSourceImportPlan(
  source: RegistryImportSourceCode,
  plan: PreparedSourceImportPlan,
  options?: {
    deleteSourceFiles?: boolean;
  },
): Promise<void> {
  const deleteSourceFiles = options?.deleteSourceFiles !== false;
  const cleanupErrors: string[] = [];

  try {
    await cleanupPreparedSourceImportPlan(plan);
  } catch (error) {
    cleanupErrors.push(
      `failed to remove ${source} temp chunks: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  if (deleteSourceFiles) {
    for (const filePath of new Set(plan.sourceFilesToDelete)) {
      try {
        await unlink(filePath);
      } catch (error) {
        cleanupErrors.push(
          `failed to remove imported ${source} source ${path.basename(filePath)}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  if (cleanupErrors.length > 0) {
    throw new Error(cleanupErrors.join("; "));
  }
}

export function shouldDeleteImportedSourceFiles(
  source: RegistryImportSourceCode,
): boolean {
  return process.env[SOURCE_CONFIGS[source].deleteSourceFilesEnv] !== "false";
}

async function splitLargeDelimitedFile(
  source: RegistryImportSourceCode,
  filePath: string,
  tempRoot: string,
  splitRowsPerFile: number,
): Promise<string[]> {
  const config = SOURCE_CONFIGS[source];
  const sourceBaseName = path.basename(filePath, path.extname(filePath));
  const splitDirectory = path.join(
    tempRoot,
    sanitizeFileSegment(sourceBaseName),
  );
  const chunkFiles: string[] = [];
  const activeWriters = new Map<string, ChunkWriterState>();
  const nextPartNumbers = new Map<string, number>();

  await mkdir(splitDirectory, { recursive: true });

  try {
    for await (const row of readDelimitedRows(filePath, config)) {
      const bucketKey = sanitizeFileSegment(
        config.extractBucket(row) || "unknown",
      );
      let writerState = activeWriters.get(bucketKey);

      if (!writerState || writerState.rowCount >= splitRowsPerFile) {
        if (writerState) {
          await closeStream(writerState.stream);
        }

        const nextPartNumber = (nextPartNumbers.get(bucketKey) || 0) + 1;
        nextPartNumbers.set(bucketKey, nextPartNumber);

        const chunkPath = path.join(
          splitDirectory,
          `${sanitizeFileSegment(sourceBaseName)}-${bucketKey}-part-${String(nextPartNumber).padStart(3, "0")}.csv`,
        );
        const stream = createWriteStream(chunkPath, {
          encoding: "utf-8",
        });
        await writeDelimitedRow(stream, config.headers, config.delimiter);

        writerState = {
          stream,
          rowCount: 0,
        };
        activeWriters.set(bucketKey, writerState);
        chunkFiles.push(chunkPath);
      }

      await writeDelimitedRow(
        writerState.stream,
        config.headers.map((header) => row[header] || ""),
        config.delimiter,
      );
      writerState.rowCount += 1;
    }
  } finally {
    await Promise.all(
      [...activeWriters.values()].map((writerState) =>
        closeStream(writerState.stream),
      ),
    );
  }

  return chunkFiles;
}

async function writeDelimitedRow(
  stream: WriteStream,
  values: string[],
  delimiter: string,
): Promise<void> {
  const line = `${values.map(escapeDelimitedValue).join(delimiter)}\n`;
  if (!stream.write(line)) {
    await once(stream, "drain");
  }
}

async function closeStream(stream: WriteStream): Promise<void> {
  if (stream.closed || stream.destroyed) {
    return;
  }

  stream.end();
  await once(stream, "finish");
}

async function* readDelimitedRows(
  filePath: string,
  config: SourceConfig,
): AsyncGenerator<Record<string, string>> {
  const rawInput = createDecodedInputStream(filePath, config.originalEncoding);
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

      if (!isCompleteDelimitedRecord(bufferedLine)) {
        continue;
      }

      const record = bufferedLine;
      bufferedLine = "";

      if (!headers) {
        headers = parseDelimitedLine(record, config.delimiter);
        continue;
      }

      const values = parseDelimitedLine(record, config.delimiter);

      if (values.length !== headers.length) {
        throw new Error(
          `Invalid ${path.basename(filePath)} row for ${config.headers[0] || "registry source"}`,
        );
      }

      yield headers.reduce(
        (accumulator, header, index) => {
          accumulator[header] = values[index] ?? "";
          return accumulator;
        },
        {} as Record<string, string>,
      );
    }
  } finally {
    reader.close();
    if ("destroy" in rawInput && typeof rawInput.destroy === "function") {
      rawInput.destroy();
    }
  }
}

function createDecodedInputStream(
  filePath: string,
  encoding: PreparedFileEncoding,
): NodeJS.ReadableStream {
  if (encoding === "utf-8") {
    return createReadStream(filePath, { encoding: "utf-8" });
  }

  return createReadStream(filePath).pipe(createAsvpRepairStream());
}

function createAsvpRepairStream(): Transform {
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

function parseDelimitedLine(line: string, delimiter: string): string[] {
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
      values.push(cleanValue(currentValue));
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  values.push(cleanValue(currentValue));
  return values;
}

function isCompleteDelimitedRecord(line: string): boolean {
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

function cleanValue(value: string): string {
  return value.replace(/\r/g, "").trim();
}

function escapeDelimitedValue(value: string): string {
  return `"${String(value || "").replace(/"/g, '""')}"`;
}

function sanitizeFileSegment(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractYearFromDate(rawDate: string): string {
  const match = rawDate.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  return match?.[3] || "unknown";
}
