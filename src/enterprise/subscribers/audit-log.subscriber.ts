import { Injectable, Logger } from "@nestjs/common";
import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog } from "../../database/entities/AuditLog.entity";
import { AuditLogEvent } from "../events/user.events";

/**
 * Audit Log Event Handler
 * Processes audit log events asynchronously
 */
@Injectable()
@EventsHandler(AuditLogEvent)
export class AuditLogEventHandler implements IEventHandler<AuditLogEvent> {
  private readonly logger = new Logger(AuditLogEventHandler.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async handle(event: AuditLogEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        tenantId: event.tenantId,
        userId: event.userId,
        action: event.action as any,
        entityType: event.entityType,
        entityId: event.entityId,
        newValues: event.newValues,
        oldValues: event.oldValues,
        changedFields: event.changedFields,
        createdAt: event.timestamp,
      });

      await this.auditLogRepository.save(auditLog);

      // Stream to SIEM (Enterprise feature)
      if (this.isEnterpriseEnabled()) {
        await this.streamToSIEM(auditLog);
      }

      // Send to WebSocket for real-time updates
      if (this.isRealTimeEnabled()) {
        await this.sendToWebSocket(event.tenantId, auditLog);
      }
    } catch (error) {
      this.logger.error("Failed to process audit log event:", error);
      // TODO: Add to dead letter queue
    }
  }

  private isEnterpriseEnabled(): boolean {
    return process.env.ENTERPRISE_MODE === "true";
  }

  private isRealTimeEnabled(): boolean {
    return process.env.ENABLE_REAL_TIME_AUDIT === "true";
  }

  private async streamToSIEM(auditLog: AuditLog): Promise<void> {
    // TODO: Implement SIEM streaming (Elasticsearch, Splunk, etc.)
  }

  private async sendToWebSocket(
    tenantId: string,
    auditLog: AuditLog,
  ): Promise<void> {
    // TODO: Implement WebSocket notification
  }
}
