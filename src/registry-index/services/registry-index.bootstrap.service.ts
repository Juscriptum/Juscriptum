import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { shouldRunScheduledTasks } from "../../common/runtime/scheduled-tasks";
import { RegistryIndexService } from "./registry-index.service";

type WarmupSource = "court_stan" | "asvp" | "court_dates";

@Injectable()
export class RegistryIndexBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RegistryIndexBootstrapService.name);
  private warmupStarted = false;

  constructor(private readonly registryIndexService: RegistryIndexService) {}

  onApplicationBootstrap(): void {
    if (
      this.warmupStarted ||
      !shouldRunScheduledTasks() ||
      this.isExternalDataConfigured()
    ) {
      return;
    }

    this.warmupStarted = true;
    const warmupSources = this.getWarmupSources();
    setTimeout(() => {
      void this.warmupIndexes(warmupSources);
    }, 0);
  }

  private getWarmupSources(): WarmupSource[] {
    const configured = (
      process.env.REGISTRY_INDEX_WARMUP_SOURCES || "court_stan,asvp,court_dates"
    )
      .split(",")
      .map((value) => value.trim())
      .filter(
        (value): value is WarmupSource =>
          value === "court_stan" || value === "asvp" || value === "court_dates",
      );

    return configured.length > 0
      ? configured
      : ["court_stan", "asvp", "court_dates"];
  }

  private async warmupIndexes(sources: WarmupSource[]): Promise<void> {
    for (const source of sources) {
      try {
        await this.registryIndexService.rebuildIndexes({ source });
      } catch (error) {
        this.logger.error(
          `Registry index warmup failed for ${source}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  private isExternalDataConfigured(): boolean {
    return [
      process.env.EXTERNAL_DATA_URLS_COURT_STAN,
      process.env.EXTERNAL_DATA_URLS_COURT_DATES,
      process.env.EXTERNAL_DATA_URLS_REESTR,
      process.env.EXTERNAL_DATA_URLS_ASVP,
    ].some((value) => Boolean(value?.trim()));
  }
}
