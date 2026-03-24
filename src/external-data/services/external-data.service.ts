import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import axios from "axios";
import * as crypto from "crypto";
import { spawn } from "child_process";
import { unzipSync } from "fflate";
import { createReadStream, createWriteStream, WriteStream } from "fs";
import { once } from "events";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "fs/promises";
import * as os from "os";
import * as path from "path";
import * as readline from "readline";
import { RegistryIndexService } from "../../registry-index/services/registry-index.service";
import {
  ASVP_HEADERS,
  closeStream,
  createAsvpRepairStream,
  extractYearFromDate,
  isCompleteDelimitedRecord,
  parseDelimitedLine,
  writeDelimitedRow,
} from "../../registry-index/services/registry-source-import-preparation";
import {
  EXTERNAL_DATA_SOURCE_DEFINITIONS,
  ExternalDataSourceCode,
  ExternalDataSourceDefinition,
  ExternalDataResourceDefinition,
  buildDefaultExternalDataDefinitions,
} from "../external-data.constants";

interface RemoteResourceProbe {
  name: string;
  url: string;
  etag?: string | null;
  lastModified?: string | null;
  contentLength?: string | null;
  contentType?: string | null;
}

export interface ExternalDataUpdateOptions {
  source?: ExternalDataSourceCode;
  dryRun?: boolean;
  force?: boolean;
}

@Injectable()
export class ExternalDataService {
  private readonly logger = new Logger(ExternalDataService.name);
  private readonly requestTimeoutMs = Number(
    process.env.EXTERNAL_DATA_REQUEST_TIMEOUT_MS || "60000",
  );
  private readonly requestRetries = Number(
    process.env.EXTERNAL_DATA_REQUEST_RETRIES || "2",
  );
  private readonly asvpResumableArchiveMinBytes = Number(
    process.env.ASVP_RESUMABLE_ARCHIVE_MIN_BYTES || "1000000000",
  );
  private readonly asvpArchiveChunkBytes = Number(
    process.env.ASVP_ARCHIVE_CHUNK_BYTES || "2097152",
  );
  private readonly asvpArchiveChunkRetries = Number(
    process.env.ASVP_ARCHIVE_CHUNK_RETRIES || "12",
  );
  private readonly asvpArchiveChunkRetryDelayMs = Number(
    process.env.ASVP_ARCHIVE_CHUNK_RETRY_DELAY_MS || "1500",
  );
  private readonly asvpArchiveProgressLogBytes = Number(
    process.env.ASVP_ARCHIVE_PROGRESS_LOG_BYTES || "134217728",
  );

  constructor(
    private readonly registryIndexService: RegistryIndexService,
    @Optional()
    @Inject(EXTERNAL_DATA_SOURCE_DEFINITIONS)
    definitions?: ExternalDataSourceDefinition[],
  ) {
    this.definitions = definitions ?? buildDefaultExternalDataDefinitions();
  }

  private readonly definitions: ExternalDataSourceDefinition[];

  async updateExternalData(
    options: ExternalDataUpdateOptions = {},
  ): Promise<void> {
    const sources = options.source
      ? this.definitions.filter(
          (definition) => definition.code === options.source,
        )
      : this.definitions;

    for (const source of sources) {
      await this.updateSource(source, options);
    }
  }

  hasConfiguredSources(): boolean {
    return this.definitions.some(
      (definition) => definition.resources.length > 0,
    );
  }

  private async updateSource(
    source: ExternalDataSourceDefinition,
    options: ExternalDataUpdateOptions,
  ): Promise<void> {
    if (source.resources.length === 0) {
      this.logger.log(
        `Skipping ${source.code}: no external resource URLs configured`,
      );
      return;
    }

    const remoteResources = await Promise.all(
      source.resources.map((resource) => this.probeRemoteResource(resource)),
    );
    const remoteFingerprint = this.computeRemoteFingerprint(remoteResources);
    const currentState = await this.registryIndexService.getImportState(
      source.code,
    );

    if (
      !options.force &&
      currentState?.remote_fingerprint === remoteFingerprint
    ) {
      this.logger.log(`Skipping ${source.code}: remote metadata unchanged`);
      return;
    }

    if (options.dryRun) {
      this.logger.log(
        `Dry run: ${source.code} would download ${remoteResources.length} resource(s) into ${source.targetDirectory}`,
      );
      return;
    }

    const tempRoot = await mkdtemp(
      path.join(os.tmpdir(), `law-organizer-external-${source.code}-`),
    );
    const downloadDirectory = path.join(tempRoot, "downloads");
    const preparedDirectory = path.join(tempRoot, "prepared");

    await mkdir(downloadDirectory, { recursive: true });
    await mkdir(preparedDirectory, { recursive: true });

    try {
      const downloadedHash = await this.materializeSourceResources(
        source,
        downloadDirectory,
        preparedDirectory,
      );
      await this.ensurePreparedDirectoryHasFiles(
        preparedDirectory,
        source.code,
      );

      const extractedHash =
        await this.computeDirectoryContentHash(preparedDirectory);
      const downloadedAt = new Date().toISOString();

      if (
        !options.force &&
        currentState?.extracted_hash &&
        currentState.extracted_hash === extractedHash
      ) {
        this.logger.log(`Skipping ${source.code}: extracted content unchanged`);
        await this.registryIndexService.upsertImportState(source.code, {
          dataset_url: source.datasetUrl || null,
          resource_name: JSON.stringify(
            remoteResources.map((item) => item.name),
          ),
          resource_url: JSON.stringify(remoteResources.map((item) => item.url)),
          remote_updated_at: this.computeLatestRemoteUpdatedAt(remoteResources),
          remote_fingerprint: remoteFingerprint,
          local_file_hash: downloadedHash,
          extracted_hash: extractedHash,
          last_downloaded_at: downloadedAt,
          last_success_at: downloadedAt,
          last_status: "success",
          last_error: null,
        });
        return;
      }

      await this.replaceTargetDirectory(
        source.targetDirectory,
        preparedDirectory,
      );

      await this.registryIndexService.upsertImportState(source.code, {
        dataset_url: source.datasetUrl || null,
        resource_name: JSON.stringify(remoteResources.map((item) => item.name)),
        resource_url: JSON.stringify(remoteResources.map((item) => item.url)),
        remote_updated_at: this.computeLatestRemoteUpdatedAt(remoteResources),
        remote_fingerprint: remoteFingerprint,
        local_file_hash: downloadedHash,
        extracted_hash: extractedHash,
        last_downloaded_at: downloadedAt,
        last_success_at: downloadedAt,
        last_status: "success",
        last_error: null,
      });

      if (source.indexedSource) {
        await this.registryIndexService.rebuildIndexes({
          source: source.indexedSource,
        });
      }

      this.logger.log(
        `Updated external source ${source.code} into ${source.targetDirectory}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.registryIndexService.upsertImportState(source.code, {
        dataset_url: source.datasetUrl || null,
        resource_name: JSON.stringify(
          source.resources.map((item) => item.name),
        ),
        resource_url: JSON.stringify(source.resources.map((item) => item.url)),
        remote_fingerprint: remoteFingerprint,
        last_status: "failed",
        last_error: message,
      });
      throw error;
    } finally {
      await rm(tempRoot, { recursive: true, force: true }).catch(
        () => undefined,
      );
    }
  }

  private async probeRemoteResource(
    resource: ExternalDataResourceDefinition,
  ): Promise<RemoteResourceProbe> {
    try {
      const response = await axios.head(resource.url, {
        timeout: this.requestTimeoutMs,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      return {
        name: resource.name,
        url: resource.url,
        etag: response.headers.etag || null,
        lastModified: response.headers["last-modified"] || null,
        contentLength: response.headers["content-length"] || null,
        contentType: response.headers["content-type"] || null,
      };
    } catch (error) {
      this.logger.warn(
        `HEAD probe failed for ${resource.url}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return {
        name: resource.name,
        url: resource.url,
      };
    }
  }

  private computeRemoteFingerprint(resources: RemoteResourceProbe[]): string {
    const hash = crypto.createHash("sha256");

    for (const resource of resources) {
      hash.update(resource.name);
      hash.update(resource.url);
      hash.update(resource.etag || "");
      hash.update(resource.lastModified || "");
      hash.update(resource.contentLength || "");
      hash.update(resource.contentType || "");
    }

    return hash.digest("hex");
  }

  private computeLatestRemoteUpdatedAt(
    resources: RemoteResourceProbe[],
  ): string | null {
    const values = resources
      .map((resource) => resource.lastModified || "")
      .filter(Boolean)
      .sort();

    return values.length > 0 ? values[values.length - 1] : null;
  }

  private async downloadResource(
    resource: ExternalDataResourceDefinition,
    downloadDirectory: string,
  ): Promise<string> {
    const fileName = this.buildDownloadFileName(resource);
    const targetPath = path.join(downloadDirectory, fileName);

    for (let attempt = 0; attempt <= this.requestRetries; attempt += 1) {
      try {
        const response = await axios.get<ArrayBuffer>(resource.url, {
          responseType: "arraybuffer",
          timeout: this.requestTimeoutMs,
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 400,
        });
        await writeFile(targetPath, Buffer.from(response.data));
        return targetPath;
      } catch (error) {
        if (attempt >= this.requestRetries) {
          throw error;
        }
      }
    }

    throw new Error(`Unreachable download retry loop for ${resource.url}`);
  }

  private buildDownloadFileName(
    resource: ExternalDataResourceDefinition,
  ): string {
    const parsedUrl = new URL(resource.url);
    const baseName = path.basename(parsedUrl.pathname) || resource.name;
    return `${resource.name}-${baseName}`;
  }

  private async materializeDownloadedResource(
    downloadedPath: string,
    preparedDirectory: string,
  ): Promise<void> {
    if (downloadedPath.toLowerCase().endsWith(".zip")) {
      await this.extractZipArchive(downloadedPath, preparedDirectory);
      return;
    }

    const fileName = this.normalizeExtractedFileName(
      path.basename(downloadedPath),
    );
    await copyFile(downloadedPath, path.join(preparedDirectory, fileName));
  }

  private async materializeSourceResources(
    source: ExternalDataSourceDefinition,
    downloadDirectory: string,
    preparedDirectory: string,
  ): Promise<string> {
    if (source.code === "asvp") {
      return this.streamSplitAsvpResources(
        source.resources,
        downloadDirectory,
        preparedDirectory,
      );
    }

    const downloadedFiles: string[] = [];

    for (const resource of source.resources) {
      const downloaded = await this.downloadResource(
        resource,
        downloadDirectory,
      );
      downloadedFiles.push(downloaded);
      await this.materializeDownloadedResource(downloaded, preparedDirectory);
    }

    return this.computeFileSetHash(downloadedFiles);
  }

  private async streamSplitAsvpResources(
    resources: ExternalDataResourceDefinition[],
    downloadDirectory: string,
    preparedDirectory: string,
  ): Promise<string> {
    const aggregateHash = crypto.createHash("sha256");
    const splitDirectory = path.join(preparedDirectory, "split");

    await mkdir(splitDirectory, { recursive: true });

    for (const resource of resources) {
      aggregateHash.update(this.buildDownloadFileName(resource));
      aggregateHash.update(resource.url);
      aggregateHash.update(
        await this.streamSplitAsvpResource(
          resource,
          downloadDirectory,
          splitDirectory,
        ),
      );
    }

    return aggregateHash.digest("hex");
  }

  private async streamSplitAsvpResource(
    resource: ExternalDataResourceDefinition,
    downloadDirectory: string,
    splitDirectory: string,
  ): Promise<string> {
    for (let attempt = 0; attempt <= this.requestRetries; attempt += 1) {
      try {
        if (attempt > 0) {
          await rm(splitDirectory, { recursive: true, force: true });
          await mkdir(splitDirectory, { recursive: true });
          this.logger.warn(
            `Retrying streamed ASVP resource ${resource.name} (${attempt}/${this.requestRetries})`,
          );
        }

        const response = await axios.get<NodeJS.ReadableStream>(resource.url, {
          responseType: "stream",
          timeout: this.requestTimeoutMs,
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 400,
        });
        const contentType = String(response.headers["content-type"] || "");
        const contentLength = Number(response.headers["content-length"] || "0");
        const treatAsZipByHeaders =
          resource.url.toLowerCase().endsWith(".zip") ||
          contentType.toLowerCase().includes("zip") ||
          contentType.toLowerCase().includes("octet-stream");
        const shouldPreferBufferedArchive =
          treatAsZipByHeaders &&
          Number.isFinite(contentLength) &&
          contentLength >= this.asvpResumableArchiveMinBytes;

        if (shouldPreferBufferedArchive) {
          this.logger.log(
            `Using chunked resumable temp archive download for large ASVP resource ${resource.name}`,
          );
          (
            response.data as NodeJS.ReadableStream & {
              destroy?: (error?: Error) => void;
            }
          ).destroy?.();
          return this.downloadAndSplitAsvpArchive(
            resource,
            downloadDirectory,
            splitDirectory,
          );
        }

        const prefix = treatAsZipByHeaders
          ? Buffer.alloc(0)
          : await this.peekStreamPrefix(response.data);
        const isZipResource =
          treatAsZipByHeaders || this.isZipFileSignature(prefix);

        if (isZipResource) {
          return await this.streamSplitAsvpZipStream(
            response.data,
            splitDirectory,
            resource.name,
          );
        }

        return await this.materializeAsvpStream(
          response.data,
          splitDirectory,
          resource.name,
        );
      } catch (error) {
        if (this.shouldUseBufferedAsvpFallback(error)) {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `Streaming ASVP resource ${resource.name} was interrupted (${message}); falling back to chunked resumable temp archive download`,
          );
          await rm(splitDirectory, { recursive: true, force: true });
          await mkdir(splitDirectory, { recursive: true });
          return this.downloadAndSplitAsvpArchive(
            resource,
            downloadDirectory,
            splitDirectory,
          );
        }

        if (attempt >= this.requestRetries) {
          throw error;
        }
      }
    }

    throw new Error(`Unreachable ASVP stream retry loop for ${resource.url}`);
  }

  private shouldUseBufferedAsvpFallback(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);

    return !(
      message.includes("Invalid delimited row") ||
      message.includes("does not contain a CSV entry")
    );
  }

  private async downloadAndSplitAsvpArchive(
    resource: ExternalDataResourceDefinition,
    downloadDirectory: string,
    splitDirectory: string,
  ): Promise<string> {
    const archivePath = path.join(downloadDirectory, `${resource.name}.zip`);

    await this.downloadAsvpArchiveInRanges(resource, archivePath);
    await this.streamSplitAsvpArchive(
      archivePath,
      splitDirectory,
      resource.name,
    );

    return this.computeFileSetHash([archivePath]);
  }

  private async downloadAsvpArchiveInRanges(
    resource: ExternalDataResourceDefinition,
    targetPath: string,
  ): Promise<void> {
    const probe = await this.probeRemoteResource(resource);
    const totalBytes = Number(probe.contentLength || "0");

    if (!Number.isFinite(totalBytes) || totalBytes <= 0) {
      throw new Error(
        `ASVP resumable archive download for ${resource.name} requires a valid content-length`,
      );
    }

    const chunkBytes = Math.max(1024, this.asvpArchiveChunkBytes);
    const progressLogBytes = Math.max(
      chunkBytes,
      this.asvpArchiveProgressLogBytes,
    );
    let downloadedBytes = 0;

    try {
      downloadedBytes = (await stat(targetPath)).size;
    } catch (error) {
      const errno = error as NodeJS.ErrnoException;

      if (errno?.code !== "ENOENT") {
        throw error;
      }
    }

    if (downloadedBytes > totalBytes) {
      await rm(targetPath, { force: true });
      downloadedBytes = 0;
    }

    let nextProgressLogAt = downloadedBytes + progressLogBytes;

    while (downloadedBytes < totalBytes) {
      const start = downloadedBytes;
      const end = Math.min(start + chunkBytes - 1, totalBytes - 1);
      const chunk = await this.downloadAsvpArchiveChunk(resource, start, end);
      const expectedBytes = end - start + 1;

      if (chunk.length !== expectedBytes) {
        throw new Error(
          `ASVP archive chunk ${start}-${end} returned ${chunk.length} bytes instead of ${expectedBytes}`,
        );
      }

      await writeFile(targetPath, chunk, { flag: "a" });
      downloadedBytes += chunk.length;

      if (
        downloadedBytes >= nextProgressLogAt ||
        downloadedBytes === totalBytes
      ) {
        this.logger.log(
          `Downloaded ASVP temp archive ${this.formatMebibytes(downloadedBytes)} / ${this.formatMebibytes(totalBytes)}`,
        );
        nextProgressLogAt = downloadedBytes + progressLogBytes;
      }
    }
  }

  private async downloadAsvpArchiveChunk(
    resource: ExternalDataResourceDefinition,
    start: number,
    end: number,
  ): Promise<Buffer> {
    const rangeHeader = `bytes=${start}-${end}`;

    for (
      let attempt = 0;
      attempt <= this.asvpArchiveChunkRetries;
      attempt += 1
    ) {
      try {
        const response = await axios.get<ArrayBuffer>(resource.url, {
          responseType: "arraybuffer",
          timeout: this.requestTimeoutMs,
          maxRedirects: 5,
          headers: {
            Range: rangeHeader,
          },
          validateStatus: (status) => status === 206,
        });
        const contentRange = String(response.headers["content-range"] || "");

        if (!contentRange.startsWith(`bytes ${start}-${end}/`)) {
          throw new Error(
            `Unexpected content-range for ASVP chunk ${rangeHeader}: ${contentRange || "<missing>"}`,
          );
        }

        return Buffer.from(response.data);
      } catch (error) {
        if (attempt >= this.asvpArchiveChunkRetries) {
          const message =
            error instanceof Error ? error.message : String(error);
          throw new Error(
            `Failed to download ASVP archive chunk ${rangeHeader}: ${message}`,
          );
        }

        const nextAttempt = attempt + 1;
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Retrying ASVP archive chunk ${rangeHeader} (${nextAttempt}/${this.asvpArchiveChunkRetries}) after ${message}`,
        );
        await this.sleep(
          this.asvpArchiveChunkRetryDelayMs * Math.max(nextAttempt, 1),
        );
      }
    }

    throw new Error(
      `Unreachable ASVP archive chunk retry loop for ${rangeHeader}`,
    );
  }

  private async streamSplitAsvpZipStream(
    input: NodeJS.ReadableStream,
    splitDirectory: string,
    resourceName: string,
  ): Promise<string> {
    const rawHash = crypto.createHash("sha256");
    let expectedTermination = false;
    const child = spawn("funzip", [], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stderrChunks: Buffer[] = [];
    const closePromise = new Promise<void>((resolve, reject) => {
      child.stderr.on("data", (chunk) => stderrChunks.push(Buffer.from(chunk)));
      child.on("error", reject);
      child.on("close", (code, signal) => {
        if (code === 0 || (expectedTermination && signal)) {
          resolve();
          return;
        }

        reject(
          new Error(
            `funzip exited with code ${code}${signal ? ` signal ${signal}` : ""}: ${Buffer.concat(stderrChunks).toString("utf-8")}`,
          ),
        );
      });
    });
    const streamErrorPromise = new Promise<never>((_, reject) => {
      input.once("error", reject);
      child.stdin.once("error", (error: NodeJS.ErrnoException) => {
        if (expectedTermination && error.code === "EPIPE") {
          return;
        }

        reject(error);
      });
      child.stdout.once("error", reject);
    });

    input.on("data", (chunk) => {
      rawHash.update(
        Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)),
      );
    });
    input.pipe(child.stdin);

    try {
      await Promise.race([
        (async () => {
          await this.materializeAsvpStream(
            child.stdout,
            splitDirectory,
            resourceName,
          );
          await closePromise;
        })(),
        streamErrorPromise,
      ]);
      return rawHash.digest("hex");
    } catch (error) {
      expectedTermination = true;
      child.kill();
      await closePromise.catch(() => undefined);
      throw error;
    }
  }

  private async streamSplitAsvpArchive(
    archivePath: string,
    splitDirectory: string,
    resourceName: string,
  ): Promise<void> {
    const entryName = await this.findFirstCsvEntryInArchive(archivePath);
    const stderrChunks: Buffer[] = [];
    const child = spawn("unzip", ["-p", archivePath, entryName], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const closePromise = new Promise<void>((resolve, reject) => {
      child.stderr.on("data", (chunk) => stderrChunks.push(Buffer.from(chunk)));
      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(
          new Error(
            `unzip -p exited with code ${code}: ${Buffer.concat(stderrChunks).toString("utf-8")}`,
          ),
        );
      });
    });

    try {
      await this.materializeAsvpStream(
        child.stdout,
        splitDirectory,
        resourceName,
      );
      await closePromise;
    } catch (error) {
      child.kill();
      throw error;
    }
  }

  private async findFirstCsvEntryInArchive(
    archivePath: string,
  ): Promise<string> {
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      const child = spawn("unzip", ["-Z1", archivePath], {
        stdio: ["ignore", "pipe", "pipe"],
      });

      child.stdout.on("data", (chunk) => stdoutChunks.push(Buffer.from(chunk)));
      child.stderr.on("data", (chunk) => stderrChunks.push(Buffer.from(chunk)));
      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(
          new Error(
            `unzip -Z1 exited with code ${code}: ${Buffer.concat(stderrChunks).toString("utf-8")}`,
          ),
        );
      });
    });

    const entryName = Buffer.concat(stdoutChunks)
      .toString("utf-8")
      .split(/\r?\n/)
      .map((value) => value.trim())
      .find((value) => value.toLowerCase().endsWith(".csv"));

    if (!entryName) {
      throw new Error(
        `ASVP archive ${path.basename(archivePath)} does not contain a CSV entry`,
      );
    }

    return entryName;
  }

  private async writeStreamToFileAndHash(
    input: NodeJS.ReadableStream,
    targetPath: string,
  ): Promise<string> {
    const hash = crypto.createHash("sha256");
    const output = createWriteStream(targetPath);

    await new Promise<void>((resolve, reject) => {
      input.on("data", (chunk) => {
        hash.update(
          Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)),
        );
      });
      input.on("error", reject);
      output.on("error", reject);
      output.on("finish", resolve);
      input.pipe(output);
    });

    return hash.digest("hex");
  }

  private async peekStreamPrefix(
    input: NodeJS.ReadableStream,
  ): Promise<Buffer> {
    const readable = input as NodeJS.ReadableStream & {
      pause?: () => void;
      resume?: () => void;
      read?: (size?: number) => Buffer | string | null;
      unshift?: (chunk: any) => void;
    };

    readable.pause?.();

    const immediateChunk = readable.read?.();
    const firstChunk =
      immediateChunk ??
      ((await once(readable as unknown as NodeJS.EventEmitter, "data"))[0] as
        | Buffer
        | string);
    const prefix = Buffer.isBuffer(firstChunk)
      ? firstChunk
      : Buffer.from(String(firstChunk));

    readable.unshift?.(firstChunk);
    readable.resume?.();

    return prefix;
  }

  private isZipFileSignature(prefix: Buffer): boolean {
    return (
      prefix.length >= 4 &&
      prefix[0] === 0x50 &&
      prefix[1] === 0x4b &&
      [0x03, 0x05, 0x07].includes(prefix[2]) &&
      [0x04, 0x06, 0x08].includes(prefix[3])
    );
  }

  private async materializeAsvpStream(
    input: NodeJS.ReadableStream,
    splitDirectory: string,
    resourceName: string,
  ): Promise<string> {
    const rawHash = crypto.createHash("sha256");
    const decodedInput = input.pipe(createAsvpRepairStream());
    const reader = readline.createInterface({
      input: decodedInput as NodeJS.ReadableStream,
      crlfDelay: Infinity,
    });
    const writers = new Map<string, WriteStream>();
    const streamErrorPromise = new Promise<never>((_, reject) => {
      input.once("error", reject);
      if ("once" in decodedInput && typeof decodedInput.once === "function") {
        decodedInput.once("error", reject);
      }
      reader.once("error", reject as (...args: any[]) => void);
    });
    let headers: string[] | null = null;
    let bufferedLine = "";

    input.on("data", (chunk) => {
      rawHash.update(
        Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)),
      );
    });

    try {
      await Promise.race([
        (async () => {
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
              headers = parseDelimitedLine(record, ",");
              continue;
            }

            const values = parseDelimitedLine(record, ",");

            if (values.length !== headers.length) {
              throw new Error(
                `Invalid delimited row in streamed ASVP resource ${resourceName}`,
              );
            }

            const row = headers.reduce(
              (accumulator, header, index) => {
                accumulator[header] = values[index] ?? "";
                return accumulator;
              },
              {} as Record<string, string>,
            );
            const writer = await this.getOrCreateAsvpSplitWriter(
              splitDirectory,
              this.normalizeAsvpSplitBucket(row.VP_BEGINDATE || ""),
              writers,
            );

            await writeDelimitedRow(
              writer,
              ASVP_HEADERS.map((header) => row[header] || ""),
              ",",
            );
          }
        })(),
        streamErrorPromise,
      ]);
    } finally {
      reader.close();

      if (
        "destroy" in decodedInput &&
        typeof decodedInput.destroy === "function"
      ) {
        decodedInput.destroy();
      }

      await Promise.all(
        [...writers.values()].map((writer) => closeStream(writer)),
      );
    }

    return rawHash.digest("hex");
  }

  private async getOrCreateAsvpSplitWriter(
    splitDirectory: string,
    bucketKey: string,
    writers: Map<string, WriteStream>,
  ): Promise<WriteStream> {
    const fileName = `asvp-${bucketKey}.csv`;
    const existingWriter = writers.get(fileName);

    if (existingWriter) {
      return existingWriter;
    }

    const filePath = path.join(splitDirectory, fileName);
    let hasHeader = false;

    try {
      hasHeader = (await stat(filePath)).size > 0;
    } catch (error) {
      const errno = error as NodeJS.ErrnoException;

      if (errno?.code !== "ENOENT") {
        throw error;
      }
    }

    const writer = createWriteStream(filePath, {
      flags: "a",
      encoding: "utf-8",
    });

    if (!hasHeader) {
      await writeDelimitedRow(writer, ASVP_HEADERS, ",");
    }

    writers.set(fileName, writer);
    return writer;
  }

  private normalizeAsvpSplitBucket(rawDate: string): string {
    const bucketKey = extractYearFromDate(rawDate);
    return /^\d{4}$/.test(bucketKey) ? bucketKey : "unknown";
  }

  private normalizeExtractedFileName(fileName: string): string {
    return fileName.replace(/^[^-]+-/, "");
  }

  private async extractZipArchive(
    archivePath: string,
    targetDirectory: string,
  ): Promise<void> {
    try {
      await this.execCommand("unzip", [
        "-o",
        archivePath,
        "-d",
        targetDirectory,
      ]);
      return;
    } catch {
      const archiveBuffer = await readFile(archivePath);
      const files = unzipSync(new Uint8Array(archiveBuffer));

      for (const [entryName, content] of Object.entries(files)) {
        if (entryName.endsWith("/")) {
          await mkdir(path.join(targetDirectory, entryName), {
            recursive: true,
          });
          continue;
        }

        const targetPath = path.join(targetDirectory, entryName);
        await mkdir(path.dirname(targetPath), { recursive: true });
        await writeFile(targetPath, Buffer.from(content));
      }
    }
  }

  private async ensurePreparedDirectoryHasFiles(
    directory: string,
    sourceCode: ExternalDataSourceCode,
  ): Promise<void> {
    const files = await this.listFilesRecursively(directory);
    if (files.length === 0) {
      throw new Error(`Prepared directory for ${sourceCode} is empty`);
    }
  }

  private async replaceTargetDirectory(
    targetDirectory: string,
    preparedDirectory: string,
  ): Promise<void> {
    await mkdir(path.dirname(targetDirectory), { recursive: true });
    const backupDirectory = `${targetDirectory}.backup-${Date.now()}`;
    const stagedDirectory = `${targetDirectory}.staged-${Date.now()}`;
    let targetMoved = false;

    try {
      await rm(stagedDirectory, { recursive: true, force: true });
      await rename(preparedDirectory, stagedDirectory);

      try {
        await rename(targetDirectory, backupDirectory);
        targetMoved = true;
      } catch {
        targetMoved = false;
      }

      await rename(stagedDirectory, targetDirectory);

      if (targetMoved) {
        await rm(backupDirectory, { recursive: true, force: true });
      }
    } catch (error) {
      await rm(stagedDirectory, { recursive: true, force: true }).catch(
        () => undefined,
      );

      if (targetMoved) {
        await rm(targetDirectory, { recursive: true, force: true }).catch(
          () => undefined,
        );
        await rename(backupDirectory, targetDirectory).catch(() => undefined);
      }

      throw error;
    }
  }

  private async computeFileSetHash(filePaths: string[]): Promise<string> {
    const hash = crypto.createHash("sha256");
    const sortedFiles = [...filePaths].sort();

    for (const filePath of sortedFiles) {
      hash.update(path.basename(filePath));
      await this.updateHashFromFile(hash, filePath);
    }

    return hash.digest("hex");
  }

  private async computeDirectoryContentHash(
    directory: string,
  ): Promise<string> {
    const hash = crypto.createHash("sha256");
    const files = await this.listFilesRecursively(directory);

    for (const filePath of files.sort()) {
      hash.update(path.relative(directory, filePath));
      await this.updateHashFromFile(hash, filePath);
    }

    return hash.digest("hex");
  }

  private async listFilesRecursively(directory: string): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await this.listFilesRecursively(entryPath)));
      } else {
        files.push(entryPath);
      }
    }

    return files;
  }

  private async updateHashFromFile(
    hash: crypto.Hash,
    filePath: string,
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const stream = createReadStream(filePath);
      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve());
    });
  }

  private async execCommand(command: string, args: string[]): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ["ignore", "ignore", "pipe"],
      });
      const stderrChunks: Buffer[] = [];

      child.stderr.on("data", (chunk) => stderrChunks.push(Buffer.from(chunk)));
      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(
          new Error(
            `${command} exited with code ${code}: ${Buffer.concat(stderrChunks).toString("utf-8")}`,
          ),
        );
      });
    });
  }

  private async sleep(milliseconds: number): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
  }

  private formatMebibytes(bytes: number): string {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
  }
}
