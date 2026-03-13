import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { shouldRunScheduledTasks } from "../../common/runtime/scheduled-tasks";
import { DocumentService } from "./document.service";

@Injectable()
export class DocumentPdfProcessingWorkerService {
  private readonly logger = new Logger(DocumentPdfProcessingWorkerService.name);

  constructor(private readonly documentService: DocumentService) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processPendingPdfJobs(): Promise<void> {
    if (!shouldRunScheduledTasks()) {
      return;
    }

    const processed = await this.documentService.processDuePdfJobs(1);
    if (processed > 0) {
      this.logger.log(`Processed ${processed} PDF post-processing job(s)`);
    }
  }
}
