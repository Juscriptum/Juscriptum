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
    if (!shouldRunScheduledTasks() || this.intervalMs <= 0) {
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
      const fileNames = (await readdir(directory))
        .filter((fileName) => fileName.toLowerCase().endsWith(".csv"))
        .sort();

      if (fileNames.length === 0) {
        return "";
      }

      const hash = crypto.createHash("sha256");

      for (const fileName of fileNames) {
        const filePath = path.join(directory, fileName);
        const fileStat = await stat(filePath);
        hash.update(fileName);
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

  private getSources(): MonitoredSource[] {
    return ["court_stan", "asvp", "court_dates"];
  }
}
