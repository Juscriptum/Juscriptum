import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import * as crypto from "crypto";
import { readdir, stat } from "fs/promises";
import * as path from "path";
import { shouldRunScheduledTasks } from "../../common/runtime/scheduled-tasks";
import { RegistryIndexService } from "./registry-index.service";

type MonitoredSource = "court_stan" | "asvp" | "court_dates";

@Injectable()
export class RegistryIndexSourceMonitorService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(RegistryIndexSourceMonitorService.name);
  private readonly intervalMs = Number(
    process.env.REGISTRY_SOURCE_MONITOR_INTERVAL_MS || "30000",
  );
  private readonly sourceDirectories: Record<MonitoredSource, string> = {
    court_stan: path.resolve(process.cwd(), "court_stan"),
    asvp: path.resolve(process.cwd(), "asvp"),
    court_dates: path.resolve(process.cwd(), "court_dates"),
  };
  private readonly lastSeenSignatures = new Map<MonitoredSource, string>();
  private intervalHandle: NodeJS.Timeout | null = null;
  private scanInProgress = false;

  constructor(private readonly registryIndexService: RegistryIndexService) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!shouldRunScheduledTasks()) {
      await this.warnIfSourceFilesNeedWorker();
      return;
    }

    if (this.intervalMs <= 0) {
      return;
    }

    await this.primeSeenSignatures();
    this.intervalHandle = setInterval(() => {
      void this.scanForSourceChanges();
    }, this.intervalMs);
    this.intervalHandle.unref?.();
  }

  onModuleDestroy(): void {
    if (!this.intervalHandle) {
      return;
    }

    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
  }

  private async primeSeenSignatures(): Promise<void> {
    for (const source of this.getSources()) {
      this.lastSeenSignatures.set(
        source,
        await this.computeSourceDirectorySignature(source),
      );
    }
  }

  private async scanForSourceChanges(): Promise<void> {
    if (!shouldRunScheduledTasks() || this.scanInProgress) {
      return;
    }

    this.scanInProgress = true;

    try {
      for (const source of this.getSources()) {
        const currentSignature =
          await this.computeSourceDirectorySignature(source);
        const previousSignature = this.lastSeenSignatures.get(source) || "";

        if (!currentSignature) {
          this.lastSeenSignatures.set(source, "");
          continue;
        }

        if (currentSignature === previousSignature) {
          continue;
        }

        this.logger.log(
          `Detected new or changed ${source} CSV files, starting shared index rebuild`,
        );
        await this.registryIndexService.rebuildIndexes({ source });
        this.lastSeenSignatures.set(
          source,
          await this.computeSourceDirectorySignature(source),
        );
      }
    } catch (error) {
      this.logger.warn(
        `Registry source monitor warning: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      this.scanInProgress = false;
    }
  }

  private async computeSourceDirectorySignature(
    source: MonitoredSource,
  ): Promise<string> {
    const directory = this.sourceDirectories[source];

    try {
      const filePaths = await this.listCsvFilesRecursively(directory);

      if (filePaths.length === 0) {
        return "";
      }

      const hash = crypto.createHash("sha256");

      for (const filePath of filePaths) {
        const fileStat = await stat(filePath);
        hash.update(path.relative(directory, filePath));
        hash.update(String(fileStat.size));
        hash.update(String(fileStat.mtimeMs));
      }

      return hash.digest("hex");
    } catch (error) {
      const errno = error as NodeJS.ErrnoException;

      if (errno?.code === "ENOENT") {
        return "";
      }

      throw error;
    }
  }

  private async listCsvFilesRecursively(directory: string): Promise<string[]> {
    try {
      const entries = await readdir(directory, { withFileTypes: true });
      const filePaths: string[] = [];

      for (const entry of entries) {
        const entryPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          filePaths.push(...(await this.listCsvFilesRecursively(entryPath)));
          continue;
        }

        if (entry.name.toLowerCase().endsWith(".csv")) {
          filePaths.push(entryPath);
        }
      }

      return filePaths.sort();
    } catch (error) {
      const errno = error as NodeJS.ErrnoException;

      if (errno?.code === "ENOENT") {
        return [];
      }

      throw error;
    }
  }

  private getSources(): MonitoredSource[] {
    return ["court_stan", "asvp", "court_dates"];
  }

  private async warnIfSourceFilesNeedWorker(): Promise<void> {
    const sourcesWithPendingFiles: MonitoredSource[] = [];

    for (const source of this.getSources()) {
      const signature = await this.computeSourceDirectorySignature(source);

      if (signature) {
        sourcesWithPendingFiles.push(source);
      }
    }

    if (sourcesWithPendingFiles.length === 0) {
      return;
    }

    const sourceList = sourcesWithPendingFiles.join(", ");
    this.logger.warn(
      `Detected CSV files in ${sourceList}, but registry source monitoring is disabled in this process because RUN_SCHEDULED_JOBS=false. Start the dedicated worker or run npm run build:registry-index -- --source=<source> --force.`,
    );
  }
}
