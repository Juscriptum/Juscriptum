import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { TrustVerificationService } from "./trust-verification.service";
import { shouldRunScheduledTasks } from "../../common/runtime/scheduled-tasks";

@Injectable()
export class TrustVerificationWorkerService {
  private readonly logger = new Logger(TrustVerificationWorkerService.name);

  constructor(
    private readonly trustVerificationService: TrustVerificationService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingJobs(): Promise<void> {
    if (!shouldRunScheduledTasks()) {
      return;
    }

    const processed = await this.trustVerificationService.processDueJobs();
    if (processed > 0) {
      this.logger.log(`Processed ${processed} trust verification job(s)`);
    }
  }
}
