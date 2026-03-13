import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { EventBus } from "@nestjs/cqrs";
import { Repository } from "typeorm";
import { Outbox } from "../entities/Outbox.entity";
import { shouldRunScheduledTasks } from "../../common/runtime/scheduled-tasks";

/**
 * Outbox Processor
 * Processes pending events in the outbox table
 */
@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);
  private readonly MAX_RETRIES = 3;
  private readonly BATCH_SIZE = 100;

  constructor(
    @InjectRepository(Outbox)
    private readonly outboxRepository: Repository<Outbox>,
    private readonly eventBus: EventBus,
  ) {}

  /**
   * Process outbox events every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processOutbox(): Promise<void> {
    if (!shouldRunScheduledTasks()) {
      return;
    }

    this.logger.debug("Processing outbox events");

    try {
      // Get pending events
      const events = await this.outboxRepository.find({
        where: { processed: false },
        order: { createdAt: "ASC" },
        take: this.BATCH_SIZE,
      });

      if (events.length === 0) {
        return;
      }

      this.logger.log(`Processing ${events.length} outbox events`);

      // Process each event
      for (const event of events) {
        await this.processEvent(event);
      }
    } catch (error: unknown) {
      this.logger.error("Failed to process outbox events:", error);
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(event: Outbox): Promise<void> {
    try {
      // Publish event to event bus
      switch (event.eventType) {
        case "UserCreatedEvent":
          this.eventBus.publish(event.payload);
          break;
        case "UserUpdatedEvent":
          this.eventBus.publish(event.payload);
          break;
        case "AuditLogEvent":
          this.eventBus.publish(event.payload);
          break;
        // Add more event types as needed
        default:
          this.logger.warn(`Unknown event type: ${event.eventType}`);
          return;
      }

      // Mark as processed
      await this.outboxRepository.update(
        { id: event.id },
        {
          processed: true,
          processedAt: new Date(),
          lastError: undefined,
        },
      );

      this.logger.debug(`Event ${event.id} processed successfully`);
    } catch (error: unknown) {
      const newRetryCount = event.retryCount + 1;

      // Update retry count
      await this.outboxRepository.update(
        { id: event.id },
        {
          retryCount: newRetryCount,
          lastError: {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
          },
        },
      );

      this.logger.error(
        `Failed to process event ${event.id} (attempt ${newRetryCount}):`,
        error,
      );

      // Move to dead letter queue if max retries reached
      if (newRetryCount >= this.MAX_RETRIES) {
        await this.moveToDeadLetterQueue(event);
      }
    }
  }

  /**
   * Move failed event to dead letter queue
   */
  private async moveToDeadLetterQueue(event: Outbox): Promise<void> {
    this.logger.warn(`Moving event ${event.id} to dead letter queue`);

    // TODO: Implement dead letter queue
    await this.outboxRepository.delete({ id: event.id });
  }
}
