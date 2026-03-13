import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { shouldRunScheduledTasks } from "../../common/runtime/scheduled-tasks";
import { ExternalDataService } from "./external-data.service";

@Injectable()
export class ExternalDataSchedulerService {
  constructor(private readonly externalDataService: ExternalDataService) {}

  @Cron("0 0 10 * * *", { timeZone: "Etc/GMT-1" })
  async updateExternalDataDaily(): Promise<void> {
    if (!shouldRunScheduledTasks()) {
      return;
    }

    await this.externalDataService.updateExternalData();
  }
}
