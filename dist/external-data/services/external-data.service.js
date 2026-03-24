"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ExternalDataService", {
    enumerable: true,
    get: function() {
        return ExternalDataService;
    }
});
const _common = require("@nestjs/common");
const _axios = /*#__PURE__*/ _interop_require_default(require("axios"));
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
const _child_process = require("child_process");
const _fflate = require("fflate");
const _fs = require("fs");
const _events = require("events");
const _promises = require("node:fs/promises");
const _os = /*#__PURE__*/ _interop_require_wildcard(require("os"));
const _path = /*#__PURE__*/ _interop_require_wildcard(require("path"));
const _readline = /*#__PURE__*/ _interop_require_wildcard(require("readline"));
const _registryindexservice = require("../../registry-index/services/registry-index.service");
const _registrysourceimportpreparation = require("../../registry-index/services/registry-source-import-preparation");
const _externaldataconstants = require("../external-data.constants");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
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
let ExternalDataService = class ExternalDataService {
    async updateExternalData(options = {}) {
        const sources = options.source ? this.definitions.filter((definition)=>definition.code === options.source) : this.definitions;
        for (const source of sources){
            await this.updateSource(source, options);
        }
    }
    hasConfiguredSources() {
        return this.definitions.some((definition)=>definition.resources.length > 0);
    }
    async updateSource(source, options) {
        if (source.resources.length === 0) {
            this.logger.log(`Skipping ${source.code}: no external resource URLs configured`);
            return;
        }
        const remoteResources = await Promise.all(source.resources.map((resource)=>this.probeRemoteResource(resource)));
        const remoteFingerprint = this.computeRemoteFingerprint(remoteResources);
        const currentState = await this.registryIndexService.getImportState(source.code);
        if (!options.force && currentState?.remote_fingerprint === remoteFingerprint) {
            this.logger.log(`Skipping ${source.code}: remote metadata unchanged`);
            return;
        }
        if (options.dryRun) {
            this.logger.log(`Dry run: ${source.code} would download ${remoteResources.length} resource(s) into ${source.targetDirectory}`);
            return;
        }
        const tempRoot = await (0, _promises.mkdtemp)(_path.join(_os.tmpdir(), `law-organizer-external-${source.code}-`));
        const downloadDirectory = _path.join(tempRoot, "downloads");
        const preparedDirectory = _path.join(tempRoot, "prepared");
        await (0, _promises.mkdir)(downloadDirectory, {
            recursive: true
        });
        await (0, _promises.mkdir)(preparedDirectory, {
            recursive: true
        });
        try {
            const downloadedHash = await this.materializeSourceResources(source, downloadDirectory, preparedDirectory);
            await this.ensurePreparedDirectoryHasFiles(preparedDirectory, source.code);
            const extractedHash = await this.computeDirectoryContentHash(preparedDirectory);
            const downloadedAt = new Date().toISOString();
            if (!options.force && currentState?.extracted_hash && currentState.extracted_hash === extractedHash) {
                this.logger.log(`Skipping ${source.code}: extracted content unchanged`);
                await this.registryIndexService.upsertImportState(source.code, {
                    dataset_url: source.datasetUrl || null,
                    resource_name: JSON.stringify(remoteResources.map((item)=>item.name)),
                    resource_url: JSON.stringify(remoteResources.map((item)=>item.url)),
                    remote_updated_at: this.computeLatestRemoteUpdatedAt(remoteResources),
                    remote_fingerprint: remoteFingerprint,
                    local_file_hash: downloadedHash,
                    extracted_hash: extractedHash,
                    last_downloaded_at: downloadedAt,
                    last_success_at: downloadedAt,
                    last_status: "success",
                    last_error: null
                });
                return;
            }
            await this.replaceTargetDirectory(source.targetDirectory, preparedDirectory);
            await this.registryIndexService.upsertImportState(source.code, {
                dataset_url: source.datasetUrl || null,
                resource_name: JSON.stringify(remoteResources.map((item)=>item.name)),
                resource_url: JSON.stringify(remoteResources.map((item)=>item.url)),
                remote_updated_at: this.computeLatestRemoteUpdatedAt(remoteResources),
                remote_fingerprint: remoteFingerprint,
                local_file_hash: downloadedHash,
                extracted_hash: extractedHash,
                last_downloaded_at: downloadedAt,
                last_success_at: downloadedAt,
                last_status: "success",
                last_error: null
            });
            if (source.indexedSource) {
                await this.registryIndexService.rebuildIndexes({
                    source: source.indexedSource
                });
            }
            this.logger.log(`Updated external source ${source.code} into ${source.targetDirectory}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            await this.registryIndexService.upsertImportState(source.code, {
                dataset_url: source.datasetUrl || null,
                resource_name: JSON.stringify(source.resources.map((item)=>item.name)),
                resource_url: JSON.stringify(source.resources.map((item)=>item.url)),
                remote_fingerprint: remoteFingerprint,
                last_status: "failed",
                last_error: message
            });
            throw error;
        } finally{
            await (0, _promises.rm)(tempRoot, {
                recursive: true,
                force: true
            }).catch(()=>undefined);
        }
    }
    async probeRemoteResource(resource) {
        try {
            const response = await _axios.default.head(resource.url, {
                timeout: this.requestTimeoutMs,
                maxRedirects: 5,
                validateStatus: (status)=>status >= 200 && status < 400
            });
            return {
                name: resource.name,
                url: resource.url,
                etag: response.headers.etag || null,
                lastModified: response.headers["last-modified"] || null,
                contentLength: response.headers["content-length"] || null,
                contentType: response.headers["content-type"] || null
            };
        } catch (error) {
            this.logger.warn(`HEAD probe failed for ${resource.url}: ${error instanceof Error ? error.message : String(error)}`);
            return {
                name: resource.name,
                url: resource.url
            };
        }
    }
    computeRemoteFingerprint(resources) {
        const hash = _crypto.createHash("sha256");
        for (const resource of resources){
            hash.update(resource.name);
            hash.update(resource.url);
            hash.update(resource.etag || "");
            hash.update(resource.lastModified || "");
            hash.update(resource.contentLength || "");
            hash.update(resource.contentType || "");
        }
        return hash.digest("hex");
    }
    computeLatestRemoteUpdatedAt(resources) {
        const values = resources.map((resource)=>resource.lastModified || "").filter(Boolean).sort();
        return values.length > 0 ? values[values.length - 1] : null;
    }
    async downloadResource(resource, downloadDirectory) {
        const fileName = this.buildDownloadFileName(resource);
        const targetPath = _path.join(downloadDirectory, fileName);
        for(let attempt = 0; attempt <= this.requestRetries; attempt += 1){
            try {
                const response = await _axios.default.get(resource.url, {
                    responseType: "arraybuffer",
                    timeout: this.requestTimeoutMs,
                    maxRedirects: 5,
                    validateStatus: (status)=>status >= 200 && status < 400
                });
                await (0, _promises.writeFile)(targetPath, Buffer.from(response.data));
                return targetPath;
            } catch (error) {
                if (attempt >= this.requestRetries) {
                    throw error;
                }
            }
        }
        throw new Error(`Unreachable download retry loop for ${resource.url}`);
    }
    buildDownloadFileName(resource) {
        const parsedUrl = new URL(resource.url);
        const baseName = _path.basename(parsedUrl.pathname) || resource.name;
        return `${resource.name}-${baseName}`;
    }
    async materializeDownloadedResource(downloadedPath, preparedDirectory) {
        if (downloadedPath.toLowerCase().endsWith(".zip")) {
            await this.extractZipArchive(downloadedPath, preparedDirectory);
            return;
        }
        const fileName = this.normalizeExtractedFileName(_path.basename(downloadedPath));
        await (0, _promises.copyFile)(downloadedPath, _path.join(preparedDirectory, fileName));
    }
    async materializeSourceResources(source, downloadDirectory, preparedDirectory) {
        if (source.code === "asvp") {
            return this.streamSplitAsvpResources(source.resources, downloadDirectory, preparedDirectory);
        }
        const downloadedFiles = [];
        for (const resource of source.resources){
            const downloaded = await this.downloadResource(resource, downloadDirectory);
            downloadedFiles.push(downloaded);
            await this.materializeDownloadedResource(downloaded, preparedDirectory);
        }
        return this.computeFileSetHash(downloadedFiles);
    }
    async streamSplitAsvpResources(resources, downloadDirectory, preparedDirectory) {
        const aggregateHash = _crypto.createHash("sha256");
        const splitDirectory = _path.join(preparedDirectory, "split");
        await (0, _promises.mkdir)(splitDirectory, {
            recursive: true
        });
        for (const resource of resources){
            aggregateHash.update(this.buildDownloadFileName(resource));
            aggregateHash.update(resource.url);
            aggregateHash.update(await this.streamSplitAsvpResource(resource, downloadDirectory, splitDirectory));
        }
        return aggregateHash.digest("hex");
    }
    async streamSplitAsvpResource(resource, downloadDirectory, splitDirectory) {
        for(let attempt = 0; attempt <= this.requestRetries; attempt += 1){
            try {
                if (attempt > 0) {
                    await (0, _promises.rm)(splitDirectory, {
                        recursive: true,
                        force: true
                    });
                    await (0, _promises.mkdir)(splitDirectory, {
                        recursive: true
                    });
                    this.logger.warn(`Retrying streamed ASVP resource ${resource.name} (${attempt}/${this.requestRetries})`);
                }
                const response = await _axios.default.get(resource.url, {
                    responseType: "stream",
                    timeout: this.requestTimeoutMs,
                    maxRedirects: 5,
                    validateStatus: (status)=>status >= 200 && status < 400
                });
                const contentType = String(response.headers["content-type"] || "");
                const contentLength = Number(response.headers["content-length"] || "0");
                const treatAsZipByHeaders = resource.url.toLowerCase().endsWith(".zip") || contentType.toLowerCase().includes("zip") || contentType.toLowerCase().includes("octet-stream");
                const shouldPreferBufferedArchive = treatAsZipByHeaders && Number.isFinite(contentLength) && contentLength >= this.asvpResumableArchiveMinBytes;
                if (shouldPreferBufferedArchive) {
                    this.logger.log(`Using chunked resumable temp archive download for large ASVP resource ${resource.name}`);
                    response.data.destroy?.();
                    return this.downloadAndSplitAsvpArchive(resource, downloadDirectory, splitDirectory);
                }
                const prefix = treatAsZipByHeaders ? Buffer.alloc(0) : await this.peekStreamPrefix(response.data);
                const isZipResource = treatAsZipByHeaders || this.isZipFileSignature(prefix);
                if (isZipResource) {
                    return await this.streamSplitAsvpZipStream(response.data, splitDirectory, resource.name);
                }
                return await this.materializeAsvpStream(response.data, splitDirectory, resource.name);
            } catch (error) {
                if (this.shouldUseBufferedAsvpFallback(error)) {
                    const message = error instanceof Error ? error.message : String(error);
                    this.logger.warn(`Streaming ASVP resource ${resource.name} was interrupted (${message}); falling back to chunked resumable temp archive download`);
                    await (0, _promises.rm)(splitDirectory, {
                        recursive: true,
                        force: true
                    });
                    await (0, _promises.mkdir)(splitDirectory, {
                        recursive: true
                    });
                    return this.downloadAndSplitAsvpArchive(resource, downloadDirectory, splitDirectory);
                }
                if (attempt >= this.requestRetries) {
                    throw error;
                }
            }
        }
        throw new Error(`Unreachable ASVP stream retry loop for ${resource.url}`);
    }
    shouldUseBufferedAsvpFallback(error) {
        const message = error instanceof Error ? error.message : String(error);
        return !(message.includes("Invalid delimited row") || message.includes("does not contain a CSV entry"));
    }
    async downloadAndSplitAsvpArchive(resource, downloadDirectory, splitDirectory) {
        const archivePath = _path.join(downloadDirectory, `${resource.name}.zip`);
        await this.downloadAsvpArchiveInRanges(resource, archivePath);
        await this.streamSplitAsvpArchive(archivePath, splitDirectory, resource.name);
        return this.computeFileSetHash([
            archivePath
        ]);
    }
    async downloadAsvpArchiveInRanges(resource, targetPath) {
        const probe = await this.probeRemoteResource(resource);
        const totalBytes = Number(probe.contentLength || "0");
        if (!Number.isFinite(totalBytes) || totalBytes <= 0) {
            throw new Error(`ASVP resumable archive download for ${resource.name} requires a valid content-length`);
        }
        const chunkBytes = Math.max(1024, this.asvpArchiveChunkBytes);
        const progressLogBytes = Math.max(chunkBytes, this.asvpArchiveProgressLogBytes);
        let downloadedBytes = 0;
        try {
            downloadedBytes = (await (0, _promises.stat)(targetPath)).size;
        } catch (error) {
            const errno = error;
            if (errno?.code !== "ENOENT") {
                throw error;
            }
        }
        if (downloadedBytes > totalBytes) {
            await (0, _promises.rm)(targetPath, {
                force: true
            });
            downloadedBytes = 0;
        }
        let nextProgressLogAt = downloadedBytes + progressLogBytes;
        while(downloadedBytes < totalBytes){
            const start = downloadedBytes;
            const end = Math.min(start + chunkBytes - 1, totalBytes - 1);
            const chunk = await this.downloadAsvpArchiveChunk(resource, start, end);
            const expectedBytes = end - start + 1;
            if (chunk.length !== expectedBytes) {
                throw new Error(`ASVP archive chunk ${start}-${end} returned ${chunk.length} bytes instead of ${expectedBytes}`);
            }
            await (0, _promises.writeFile)(targetPath, chunk, {
                flag: "a"
            });
            downloadedBytes += chunk.length;
            if (downloadedBytes >= nextProgressLogAt || downloadedBytes === totalBytes) {
                this.logger.log(`Downloaded ASVP temp archive ${this.formatMebibytes(downloadedBytes)} / ${this.formatMebibytes(totalBytes)}`);
                nextProgressLogAt = downloadedBytes + progressLogBytes;
            }
        }
    }
    async downloadAsvpArchiveChunk(resource, start, end) {
        const rangeHeader = `bytes=${start}-${end}`;
        for(let attempt = 0; attempt <= this.asvpArchiveChunkRetries; attempt += 1){
            try {
                const response = await _axios.default.get(resource.url, {
                    responseType: "arraybuffer",
                    timeout: this.requestTimeoutMs,
                    maxRedirects: 5,
                    headers: {
                        Range: rangeHeader
                    },
                    validateStatus: (status)=>status === 206
                });
                const contentRange = String(response.headers["content-range"] || "");
                if (!contentRange.startsWith(`bytes ${start}-${end}/`)) {
                    throw new Error(`Unexpected content-range for ASVP chunk ${rangeHeader}: ${contentRange || "<missing>"}`);
                }
                return Buffer.from(response.data);
            } catch (error) {
                if (attempt >= this.asvpArchiveChunkRetries) {
                    const message = error instanceof Error ? error.message : String(error);
                    throw new Error(`Failed to download ASVP archive chunk ${rangeHeader}: ${message}`);
                }
                const nextAttempt = attempt + 1;
                const message = error instanceof Error ? error.message : String(error);
                this.logger.warn(`Retrying ASVP archive chunk ${rangeHeader} (${nextAttempt}/${this.asvpArchiveChunkRetries}) after ${message}`);
                await this.sleep(this.asvpArchiveChunkRetryDelayMs * Math.max(nextAttempt, 1));
            }
        }
        throw new Error(`Unreachable ASVP archive chunk retry loop for ${rangeHeader}`);
    }
    async streamSplitAsvpZipStream(input, splitDirectory, resourceName) {
        const rawHash = _crypto.createHash("sha256");
        let expectedTermination = false;
        const child = (0, _child_process.spawn)("funzip", [], {
            stdio: [
                "pipe",
                "pipe",
                "pipe"
            ]
        });
        const stderrChunks = [];
        const closePromise = new Promise((resolve, reject)=>{
            child.stderr.on("data", (chunk)=>stderrChunks.push(Buffer.from(chunk)));
            child.on("error", reject);
            child.on("close", (code, signal)=>{
                if (code === 0 || expectedTermination && signal) {
                    resolve();
                    return;
                }
                reject(new Error(`funzip exited with code ${code}${signal ? ` signal ${signal}` : ""}: ${Buffer.concat(stderrChunks).toString("utf-8")}`));
            });
        });
        const streamErrorPromise = new Promise((_, reject)=>{
            input.once("error", reject);
            child.stdin.once("error", (error)=>{
                if (expectedTermination && error.code === "EPIPE") {
                    return;
                }
                reject(error);
            });
            child.stdout.once("error", reject);
        });
        input.on("data", (chunk)=>{
            rawHash.update(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        });
        input.pipe(child.stdin);
        try {
            await Promise.race([
                (async ()=>{
                    await this.materializeAsvpStream(child.stdout, splitDirectory, resourceName);
                    await closePromise;
                })(),
                streamErrorPromise
            ]);
            return rawHash.digest("hex");
        } catch (error) {
            expectedTermination = true;
            child.kill();
            await closePromise.catch(()=>undefined);
            throw error;
        }
    }
    async streamSplitAsvpArchive(archivePath, splitDirectory, resourceName) {
        const entryName = await this.findFirstCsvEntryInArchive(archivePath);
        const stderrChunks = [];
        const child = (0, _child_process.spawn)("unzip", [
            "-p",
            archivePath,
            entryName
        ], {
            stdio: [
                "ignore",
                "pipe",
                "pipe"
            ]
        });
        const closePromise = new Promise((resolve, reject)=>{
            child.stderr.on("data", (chunk)=>stderrChunks.push(Buffer.from(chunk)));
            child.on("error", reject);
            child.on("close", (code)=>{
                if (code === 0) {
                    resolve();
                    return;
                }
                reject(new Error(`unzip -p exited with code ${code}: ${Buffer.concat(stderrChunks).toString("utf-8")}`));
            });
        });
        try {
            await this.materializeAsvpStream(child.stdout, splitDirectory, resourceName);
            await closePromise;
        } catch (error) {
            child.kill();
            throw error;
        }
    }
    async findFirstCsvEntryInArchive(archivePath) {
        const stdoutChunks = [];
        const stderrChunks = [];
        await new Promise((resolve, reject)=>{
            const child = (0, _child_process.spawn)("unzip", [
                "-Z1",
                archivePath
            ], {
                stdio: [
                    "ignore",
                    "pipe",
                    "pipe"
                ]
            });
            child.stdout.on("data", (chunk)=>stdoutChunks.push(Buffer.from(chunk)));
            child.stderr.on("data", (chunk)=>stderrChunks.push(Buffer.from(chunk)));
            child.on("error", reject);
            child.on("close", (code)=>{
                if (code === 0) {
                    resolve();
                    return;
                }
                reject(new Error(`unzip -Z1 exited with code ${code}: ${Buffer.concat(stderrChunks).toString("utf-8")}`));
            });
        });
        const entryName = Buffer.concat(stdoutChunks).toString("utf-8").split(/\r?\n/).map((value)=>value.trim()).find((value)=>value.toLowerCase().endsWith(".csv"));
        if (!entryName) {
            throw new Error(`ASVP archive ${_path.basename(archivePath)} does not contain a CSV entry`);
        }
        return entryName;
    }
    async writeStreamToFileAndHash(input, targetPath) {
        const hash = _crypto.createHash("sha256");
        const output = (0, _fs.createWriteStream)(targetPath);
        await new Promise((resolve, reject)=>{
            input.on("data", (chunk)=>{
                hash.update(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
            });
            input.on("error", reject);
            output.on("error", reject);
            output.on("finish", resolve);
            input.pipe(output);
        });
        return hash.digest("hex");
    }
    async peekStreamPrefix(input) {
        const readable = input;
        readable.pause?.();
        const immediateChunk = readable.read?.();
        const firstChunk = immediateChunk ?? (await (0, _events.once)(readable, "data"))[0];
        const prefix = Buffer.isBuffer(firstChunk) ? firstChunk : Buffer.from(String(firstChunk));
        readable.unshift?.(firstChunk);
        readable.resume?.();
        return prefix;
    }
    isZipFileSignature(prefix) {
        return prefix.length >= 4 && prefix[0] === 0x50 && prefix[1] === 0x4b && [
            0x03,
            0x05,
            0x07
        ].includes(prefix[2]) && [
            0x04,
            0x06,
            0x08
        ].includes(prefix[3]);
    }
    async materializeAsvpStream(input, splitDirectory, resourceName) {
        const rawHash = _crypto.createHash("sha256");
        const decodedInput = input.pipe((0, _registrysourceimportpreparation.createAsvpRepairStream)());
        const reader = _readline.createInterface({
            input: decodedInput,
            crlfDelay: Infinity
        });
        const writers = new Map();
        const streamErrorPromise = new Promise((_, reject)=>{
            input.once("error", reject);
            if ("once" in decodedInput && typeof decodedInput.once === "function") {
                decodedInput.once("error", reject);
            }
            reader.once("error", reject);
        });
        let headers = null;
        let bufferedLine = "";
        input.on("data", (chunk)=>{
            rawHash.update(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        });
        try {
            await Promise.race([
                (async ()=>{
                    for await (const line of reader){
                        if (!line.trim() && !bufferedLine) {
                            continue;
                        }
                        bufferedLine = bufferedLine ? `${bufferedLine}\n${line}` : line;
                        if (!(0, _registrysourceimportpreparation.isCompleteDelimitedRecord)(bufferedLine)) {
                            continue;
                        }
                        const record = bufferedLine;
                        bufferedLine = "";
                        if (!headers) {
                            headers = (0, _registrysourceimportpreparation.parseDelimitedLine)(record, ",");
                            continue;
                        }
                        const values = (0, _registrysourceimportpreparation.parseDelimitedLine)(record, ",");
                        if (values.length !== headers.length) {
                            throw new Error(`Invalid delimited row in streamed ASVP resource ${resourceName}`);
                        }
                        const row = headers.reduce((accumulator, header, index)=>{
                            accumulator[header] = values[index] ?? "";
                            return accumulator;
                        }, {});
                        const writer = await this.getOrCreateAsvpSplitWriter(splitDirectory, this.normalizeAsvpSplitBucket(row.VP_BEGINDATE || ""), writers);
                        await (0, _registrysourceimportpreparation.writeDelimitedRow)(writer, _registrysourceimportpreparation.ASVP_HEADERS.map((header)=>row[header] || ""), ",");
                    }
                })(),
                streamErrorPromise
            ]);
        } finally{
            reader.close();
            if ("destroy" in decodedInput && typeof decodedInput.destroy === "function") {
                decodedInput.destroy();
            }
            await Promise.all([
                ...writers.values()
            ].map((writer)=>(0, _registrysourceimportpreparation.closeStream)(writer)));
        }
        return rawHash.digest("hex");
    }
    async getOrCreateAsvpSplitWriter(splitDirectory, bucketKey, writers) {
        const fileName = `asvp-${bucketKey}.csv`;
        const existingWriter = writers.get(fileName);
        if (existingWriter) {
            return existingWriter;
        }
        const filePath = _path.join(splitDirectory, fileName);
        let hasHeader = false;
        try {
            hasHeader = (await (0, _promises.stat)(filePath)).size > 0;
        } catch (error) {
            const errno = error;
            if (errno?.code !== "ENOENT") {
                throw error;
            }
        }
        const writer = (0, _fs.createWriteStream)(filePath, {
            flags: "a",
            encoding: "utf-8"
        });
        if (!hasHeader) {
            await (0, _registrysourceimportpreparation.writeDelimitedRow)(writer, _registrysourceimportpreparation.ASVP_HEADERS, ",");
        }
        writers.set(fileName, writer);
        return writer;
    }
    normalizeAsvpSplitBucket(rawDate) {
        const bucketKey = (0, _registrysourceimportpreparation.extractYearFromDate)(rawDate);
        return /^\d{4}$/.test(bucketKey) ? bucketKey : "unknown";
    }
    normalizeExtractedFileName(fileName) {
        return fileName.replace(/^[^-]+-/, "");
    }
    async extractZipArchive(archivePath, targetDirectory) {
        try {
            await this.execCommand("unzip", [
                "-o",
                archivePath,
                "-d",
                targetDirectory
            ]);
            return;
        } catch  {
            const archiveBuffer = await (0, _promises.readFile)(archivePath);
            const files = (0, _fflate.unzipSync)(new Uint8Array(archiveBuffer));
            for (const [entryName, content] of Object.entries(files)){
                if (entryName.endsWith("/")) {
                    await (0, _promises.mkdir)(_path.join(targetDirectory, entryName), {
                        recursive: true
                    });
                    continue;
                }
                const targetPath = _path.join(targetDirectory, entryName);
                await (0, _promises.mkdir)(_path.dirname(targetPath), {
                    recursive: true
                });
                await (0, _promises.writeFile)(targetPath, Buffer.from(content));
            }
        }
    }
    async ensurePreparedDirectoryHasFiles(directory, sourceCode) {
        const files = await this.listFilesRecursively(directory);
        if (files.length === 0) {
            throw new Error(`Prepared directory for ${sourceCode} is empty`);
        }
    }
    async replaceTargetDirectory(targetDirectory, preparedDirectory) {
        await (0, _promises.mkdir)(_path.dirname(targetDirectory), {
            recursive: true
        });
        const backupDirectory = `${targetDirectory}.backup-${Date.now()}`;
        const stagedDirectory = `${targetDirectory}.staged-${Date.now()}`;
        let targetMoved = false;
        try {
            await (0, _promises.rm)(stagedDirectory, {
                recursive: true,
                force: true
            });
            await (0, _promises.rename)(preparedDirectory, stagedDirectory);
            try {
                await (0, _promises.rename)(targetDirectory, backupDirectory);
                targetMoved = true;
            } catch  {
                targetMoved = false;
            }
            await (0, _promises.rename)(stagedDirectory, targetDirectory);
            if (targetMoved) {
                await (0, _promises.rm)(backupDirectory, {
                    recursive: true,
                    force: true
                });
            }
        } catch (error) {
            await (0, _promises.rm)(stagedDirectory, {
                recursive: true,
                force: true
            }).catch(()=>undefined);
            if (targetMoved) {
                await (0, _promises.rm)(targetDirectory, {
                    recursive: true,
                    force: true
                }).catch(()=>undefined);
                await (0, _promises.rename)(backupDirectory, targetDirectory).catch(()=>undefined);
            }
            throw error;
        }
    }
    async computeFileSetHash(filePaths) {
        const hash = _crypto.createHash("sha256");
        const sortedFiles = [
            ...filePaths
        ].sort();
        for (const filePath of sortedFiles){
            hash.update(_path.basename(filePath));
            await this.updateHashFromFile(hash, filePath);
        }
        return hash.digest("hex");
    }
    async computeDirectoryContentHash(directory) {
        const hash = _crypto.createHash("sha256");
        const files = await this.listFilesRecursively(directory);
        for (const filePath of files.sort()){
            hash.update(_path.relative(directory, filePath));
            await this.updateHashFromFile(hash, filePath);
        }
        return hash.digest("hex");
    }
    async listFilesRecursively(directory) {
        const entries = await (0, _promises.readdir)(directory, {
            withFileTypes: true
        });
        const files = [];
        for (const entry of entries){
            const entryPath = _path.join(directory, entry.name);
            if (entry.isDirectory()) {
                files.push(...await this.listFilesRecursively(entryPath));
            } else {
                files.push(entryPath);
            }
        }
        return files;
    }
    async updateHashFromFile(hash, filePath) {
        await new Promise((resolve, reject)=>{
            const stream = (0, _fs.createReadStream)(filePath);
            stream.on("data", (chunk)=>hash.update(chunk));
            stream.on("error", reject);
            stream.on("end", ()=>resolve());
        });
    }
    async execCommand(command, args) {
        await new Promise((resolve, reject)=>{
            const child = (0, _child_process.spawn)(command, args, {
                stdio: [
                    "ignore",
                    "ignore",
                    "pipe"
                ]
            });
            const stderrChunks = [];
            child.stderr.on("data", (chunk)=>stderrChunks.push(Buffer.from(chunk)));
            child.on("error", reject);
            child.on("close", (code)=>{
                if (code === 0) {
                    resolve();
                    return;
                }
                reject(new Error(`${command} exited with code ${code}: ${Buffer.concat(stderrChunks).toString("utf-8")}`));
            });
        });
    }
    async sleep(milliseconds) {
        await new Promise((resolve)=>setTimeout(resolve, milliseconds));
    }
    formatMebibytes(bytes) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
    }
    constructor(registryIndexService, definitions){
        this.registryIndexService = registryIndexService;
        this.logger = new _common.Logger(ExternalDataService.name);
        this.requestTimeoutMs = Number(process.env.EXTERNAL_DATA_REQUEST_TIMEOUT_MS || "60000");
        this.requestRetries = Number(process.env.EXTERNAL_DATA_REQUEST_RETRIES || "2");
        this.asvpResumableArchiveMinBytes = Number(process.env.ASVP_RESUMABLE_ARCHIVE_MIN_BYTES || "1000000000");
        this.asvpArchiveChunkBytes = Number(process.env.ASVP_ARCHIVE_CHUNK_BYTES || "2097152");
        this.asvpArchiveChunkRetries = Number(process.env.ASVP_ARCHIVE_CHUNK_RETRIES || "12");
        this.asvpArchiveChunkRetryDelayMs = Number(process.env.ASVP_ARCHIVE_CHUNK_RETRY_DELAY_MS || "1500");
        this.asvpArchiveProgressLogBytes = Number(process.env.ASVP_ARCHIVE_PROGRESS_LOG_BYTES || "134217728");
        this.definitions = definitions ?? (0, _externaldataconstants.buildDefaultExternalDataDefinitions)();
    }
};
ExternalDataService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(1, (0, _common.Optional)()),
    _ts_param(1, (0, _common.Inject)(_externaldataconstants.EXTERNAL_DATA_SOURCE_DEFINITIONS)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _registryindexservice.RegistryIndexService === "undefined" ? Object : _registryindexservice.RegistryIndexService,
        Array
    ])
], ExternalDataService);

//# sourceMappingURL=external-data.service.js.map