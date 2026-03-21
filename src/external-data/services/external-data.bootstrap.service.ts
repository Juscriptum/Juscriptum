import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { shouldRunScheduledTasks } from "../../common/runtime/scheduled-tasks";
import { ExternalDataService } from "./external-data.service";

@Injectable()
export class ExternalDataBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ExternalDataBootstrapService.name);
  private bootstrapStarted = false;

  constructor(private readonly externalDataService: ExternalDataService) {}

  onApplicationBootstrap(): void {
    if (
      this.bootstrapStarted ||
      !shouldRunScheduledTasks() ||
      !this.externalDataService.hasConfiguredSources()
    ) {
      return;
    }

    this.bootstrapStarted = true;
    setTimeout(() => {
      void this.runBootstrapUpdate();
    }, 0);
  }

  private async runBootstrapUpdate(): Promise<void> {
    try {
      await this.externalDataService.updateExternalData();
    } catch (error) {
      this.logger.error(
        `External data bootstrap update failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
