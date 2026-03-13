import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { shouldRunScheduledTasks } from "../../common/runtime/scheduled-tasks";
import { RegistryIndexService } from "./registry-index.service";

@Injectable()
export class RegistryIndexSchedulerService {
  constructor(private readonly registryIndexService: RegistryIndexService) {}

  @Cron("0 0 10 * * *", { timeZone: "Etc/GMT-1" })
  async rebuildRegistryIndexesIfNeeded(): Promise<void> {
    if (!shouldRunScheduledTasks() || this.isExternalDataCronConfigured()) {
      return;
    }

    await this.registryIndexService.rebuildIndexes();
  }

  private isExternalDataCronConfigured(): boolean {
    return [
      process.env.EXTERNAL_DATA_URLS_COURT_STAN,
      process.env.EXTERNAL_DATA_URLS_COURT_DATES,
      process.env.EXTERNAL_DATA_URLS_REESTR,
      process.env.EXTERNAL_DATA_URLS_ASVP,
    ].some((value) => Boolean(value?.trim()));
  }
}
