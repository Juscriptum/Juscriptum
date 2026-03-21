import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import axios from "axios";
import * as crypto from "crypto";
import { spawn } from "child_process";
import { unzipSync } from "fflate";
import { createReadStream } from "fs";
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
import { RegistryIndexService } from "../../registry-index/services/registry-index.service";
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
      const downloadedFiles: string[] = [];

      for (const resource of source.resources) {
        const downloaded = await this.downloadResource(
          resource,
          downloadDirectory,
        );
        downloadedFiles.push(downloaded);
        await this.materializeDownloadedResource(downloaded, preparedDirectory);
      }

      await this.ensurePreparedDirectoryHasFiles(
        preparedDirectory,
        source.code,
      );

      const downloadedHash = await this.computeFileSetHash(downloadedFiles);
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
}
