"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get ASVP_HEADERS () {
        return ASVP_HEADERS;
    },
    get cleanupPreparedSourceImportPlan () {
        return cleanupPreparedSourceImportPlan;
    },
    get closeStream () {
        return closeStream;
    },
    get createAsvpRepairStream () {
        return createAsvpRepairStream;
    },
    get escapeDelimitedValue () {
        return escapeDelimitedValue;
    },
    get extractYearFromDate () {
        return extractYearFromDate;
    },
    get finalizePreparedSourceImportPlan () {
        return finalizePreparedSourceImportPlan;
    },
    get isCompleteDelimitedRecord () {
        return isCompleteDelimitedRecord;
    },
    get parseDelimitedLine () {
        return parseDelimitedLine;
    },
    get prepareSourceImportPlan () {
        return prepareSourceImportPlan;
    },
    get shouldDeleteImportedSourceFiles () {
        return shouldDeleteImportedSourceFiles;
    },
    get writeDelimitedRow () {
        return writeDelimitedRow;
    }
});
const _events = require("events");
const _fs = require("fs");
const _promises = require("node:fs/promises");
const _iconvlite = /*#__PURE__*/ _interop_require_wildcard(require("iconv-lite"));
const _os = /*#__PURE__*/ _interop_require_wildcard(require("os"));
const _path = /*#__PURE__*/ _interop_require_wildcard(require("path"));
const _readline = /*#__PURE__*/ _interop_require_wildcard(require("readline"));
const _stream = require("stream");
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
    "description"
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
    "BANK_ACCOUNT"
];
const COURT_DATES_HEADERS = [
    "date",
    "judges",
    "case",
    "court_name",
    "court_room",
    "case_involved",
    "case_description"
];
const SOURCE_CONFIGS = {
    court_stan: {
        delimiter: "\t",
        originalEncoding: "utf-8",
        preSplitEnabledDefault: true,
        splitMinBytesEnv: "COURT_STAN_PRE_SPLIT_MIN_BYTES",
        splitMinBytesDefault: 64 * 1024 * 1024,
        splitRowsEnv: "COURT_STAN_SPLIT_ROWS_PER_FILE",
        splitRowsDefault: 200000,
        deleteSourceFilesEnv: "COURT_STAN_DELETE_IMPORTED_FILES",
        headers: COURT_STAN_HEADERS,
        extractBucket: (row)=>extractYearFromDate(row.registration_date || row.stage_date || "")
    },
    asvp: {
        delimiter: ",",
        originalEncoding: "asvp-repaired",
        preSplitEnabledEnv: "ASVP_PRE_SPLIT_ENABLED",
        preSplitEnabledDefault: false,
        splitMinBytesEnv: "ASVP_PRE_SPLIT_MIN_BYTES",
        splitMinBytesDefault: 256 * 1024 * 1024,
        splitRowsEnv: "ASVP_SPLIT_ROWS_PER_FILE",
        splitRowsDefault: 200000,
        deleteSourceFilesEnv: "ASVP_DELETE_IMPORTED_FILES",
        headers: ASVP_HEADERS,
        extractBucket: (row)=>extractYearFromDate(row.VP_BEGINDATE || "")
    },
    court_dates: {
        delimiter: "\t",
        originalEncoding: "utf-8",
        preSplitEnabledDefault: true,
        splitMinBytesEnv: "COURT_DATES_PRE_SPLIT_MIN_BYTES",
        splitMinBytesDefault: 64 * 1024 * 1024,
        splitRowsEnv: "COURT_DATES_SPLIT_ROWS_PER_FILE",
        splitRowsDefault: 200000,
        deleteSourceFilesEnv: "COURT_DATES_DELETE_IMPORTED_FILES",
        headers: COURT_DATES_HEADERS,
        extractBucket: (row)=>extractYearFromDate(row.date || "")
    }
};
async function prepareSourceImportPlan(source, files) {
    const config = SOURCE_CONFIGS[source];
    const splitMinBytes = Math.max(Number(process.env[config.splitMinBytesEnv] || `${config.splitMinBytesDefault}`), 1);
    const splitRowsPerFile = Math.max(Number(process.env[config.splitRowsEnv] || `${config.splitRowsDefault}`), 1);
    const plan = {
        files: [],
        sourceFilesToDelete: [
            ...files
        ],
        tempRoot: null
    };
    for (const filePath of files){
        const sourceFileName = _path.basename(filePath);
        const fileSize = (await (0, _promises.stat)(filePath)).size;
        if (!shouldPreSplitSource(config) || fileSize <= splitMinBytes) {
            plan.files.push({
                filePath,
                encoding: resolvePreparedFileEncoding(source, filePath, config),
                sourceFileName
            });
            continue;
        }
        if (!plan.tempRoot) {
            plan.tempRoot = await (0, _promises.mkdtemp)(_path.join(_os.tmpdir(), `law-organizer-${source}-import-`));
        }
        const splitFiles = await splitLargeDelimitedFile(source, filePath, plan.tempRoot, splitRowsPerFile);
        plan.files.push(...splitFiles.map((preparedFilePath)=>({
                filePath: preparedFilePath,
                encoding: "utf-8",
                sourceFileName
            })));
    }
    return plan;
}
async function cleanupPreparedSourceImportPlan(plan) {
    if (!plan.tempRoot) {
        return;
    }
    await (0, _promises.rm)(plan.tempRoot, {
        recursive: true,
        force: true
    });
}
async function finalizePreparedSourceImportPlan(source, plan, options) {
    const deleteSourceFiles = options?.deleteSourceFiles !== false;
    const cleanupErrors = [];
    try {
        await cleanupPreparedSourceImportPlan(plan);
    } catch (error) {
        cleanupErrors.push(`failed to remove ${source} temp chunks: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (deleteSourceFiles) {
        for (const filePath of new Set(plan.sourceFilesToDelete)){
            try {
                await (0, _promises.unlink)(filePath);
            } catch (error) {
                cleanupErrors.push(`failed to remove imported ${source} source ${_path.basename(filePath)}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    if (cleanupErrors.length > 0) {
        throw new Error(cleanupErrors.join("; "));
    }
}
function shouldDeleteImportedSourceFiles(source) {
    return process.env[SOURCE_CONFIGS[source].deleteSourceFilesEnv] !== "false";
}
async function splitLargeDelimitedFile(source, filePath, tempRoot, splitRowsPerFile) {
    const config = SOURCE_CONFIGS[source];
    const sourceBaseName = _path.basename(filePath, _path.extname(filePath));
    const splitDirectory = _path.join(tempRoot, sanitizeFileSegment(sourceBaseName));
    const chunkFiles = [];
    const activeWriters = new Map();
    const nextPartNumbers = new Map();
    await (0, _promises.mkdir)(splitDirectory, {
        recursive: true
    });
    try {
        for await (const row of readDelimitedRows(filePath, config)){
            const bucketKey = sanitizeFileSegment(config.extractBucket(row) || "unknown");
            let writerState = activeWriters.get(bucketKey);
            if (!writerState || writerState.rowCount >= splitRowsPerFile) {
                if (writerState) {
                    await closeStream(writerState.stream);
                }
                const nextPartNumber = (nextPartNumbers.get(bucketKey) || 0) + 1;
                nextPartNumbers.set(bucketKey, nextPartNumber);
                const chunkPath = _path.join(splitDirectory, `${sanitizeFileSegment(sourceBaseName)}-${bucketKey}-part-${String(nextPartNumber).padStart(3, "0")}.csv`);
                const stream = (0, _fs.createWriteStream)(chunkPath, {
                    encoding: "utf-8"
                });
                await writeDelimitedRow(stream, config.headers, config.delimiter);
                writerState = {
                    stream,
                    rowCount: 0
                };
                activeWriters.set(bucketKey, writerState);
                chunkFiles.push(chunkPath);
            }
            await writeDelimitedRow(writerState.stream, config.headers.map((header)=>row[header] || ""), config.delimiter);
            writerState.rowCount += 1;
        }
    } finally{
        await Promise.all([
            ...activeWriters.values()
        ].map((writerState)=>closeStream(writerState.stream)));
    }
    return chunkFiles;
}
async function writeDelimitedRow(stream, values, delimiter) {
    const line = `${values.map(escapeDelimitedValue).join(delimiter)}\n`;
    if (!stream.write(line)) {
        await (0, _events.once)(stream, "drain");
    }
}
async function closeStream(stream) {
    if (stream.closed || stream.destroyed) {
        return;
    }
    stream.end();
    await (0, _events.once)(stream, "finish");
}
async function* readDelimitedRows(filePath, config) {
    const rawInput = createDecodedInputStream(filePath, config.originalEncoding);
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
                throw new Error(`Invalid ${_path.basename(filePath)} row for ${config.headers[0] || "registry source"}`);
            }
            yield headers.reduce((accumulator, header, index)=>{
                accumulator[header] = values[index] ?? "";
                return accumulator;
            }, {});
        }
    } finally{
        reader.close();
        if ("destroy" in rawInput && typeof rawInput.destroy === "function") {
            rawInput.destroy();
        }
    }
}
function createDecodedInputStream(filePath, encoding) {
    if (encoding === "utf-8") {
        return (0, _fs.createReadStream)(filePath, {
            encoding: "utf-8"
        });
    }
    return (0, _fs.createReadStream)(filePath).pipe(createAsvpRepairStream());
}
function createAsvpRepairStream() {
    return new _stream.Transform({
        transform: (chunk, _encoding, callback)=>{
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, "latin1");
            const repairedText = _iconvlite.decode(Buffer.from(buffer.toString("latin1"), "latin1"), "cp1251");
            callback(null, repairedText);
        }
    });
}
function parseDelimitedLine(line, delimiter) {
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
            values.push(cleanValue(currentValue));
            currentValue = "";
            continue;
        }
        currentValue += char;
    }
    values.push(cleanValue(currentValue));
    return values;
}
function isCompleteDelimitedRecord(line) {
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
function cleanValue(value) {
    return value.replace(/\r/g, "").trim();
}
function escapeDelimitedValue(value) {
    return `"${String(value || "").replace(/"/g, '""')}"`;
}
function sanitizeFileSegment(value) {
    return value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}
function shouldPreSplitSource(config) {
    const defaultValue = config.preSplitEnabledDefault !== false;
    if (!config.preSplitEnabledEnv) {
        return defaultValue;
    }
    const rawValue = process.env[config.preSplitEnabledEnv]?.trim();
    if (!rawValue) {
        return defaultValue;
    }
    return rawValue.toLowerCase() === "true";
}
function extractYearFromDate(rawDate) {
    const match = rawDate.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
    return match?.[3] || "unknown";
}
function resolvePreparedFileEncoding(source, filePath, config) {
    if (source === "asvp" && filePath.split(_path.sep).includes("split")) {
        return "utf-8";
    }
    return config.originalEncoding;
}

//# sourceMappingURL=registry-source-import-preparation.js.map