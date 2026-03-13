import { Injectable, ExecutionContext, Logger } from "@nestjs/common";
import { AuditLog } from "../../database/entities/AuditLog.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, QueryRunner, Repository } from "typeorm";
import { redactPiiData } from "../../common/security/pii-protection";

/**
 * Audit Logging Decorator Factory
 */
export const Audit = (action: string) => {
  return function (
    target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context = args.find(
        (arg) => arg && typeof arg.switchToHttp === "function",
      ) as ExecutionContext | undefined;

      const requestFromContext = context?.switchToHttp().getRequest();
      const requestFromArgs = args.find(
        (arg) =>
          arg && typeof arg === "object" && "headers" in arg && "method" in arg,
      ) as any;

      const request = requestFromContext || requestFromArgs;
      const auditService: AuditService | undefined = (this as any).auditService;

      if (!request || !auditService) {
        return originalMethod.apply(this, args);
      }

      try {
        const result = await originalMethod.apply(this, args);

        await auditService.log({
          tenantId: request.user?.tenant_id,
          userId: request.user?.user_id,
          action: action as any,
          entityType: target.constructor.name,
          entityId: result?.id,
          ipAddress: request.ip,
          userAgent:
            request.get?.("user-agent") ?? request.headers?.["user-agent"],
          requestId: request.correlationId,
          metadata: {
            endpoint: request.route?.path,
            method: request.method,
          },
        });

        return result;
      } catch (error: unknown) {
        await auditService.log({
          tenantId: request.user?.tenant_id,
          userId: request.user?.user_id,
          action: "login" as any,
          entityType: target.constructor.name,
          ipAddress: request.ip,
          userAgent:
            request.get?.("user-agent") ?? request.headers?.["user-agent"],
          requestId: request.correlationId,
          metadata: {
            endpoint: request.route?.path,
            method: request.method,
            error: error instanceof Error ? error.message : String(error),
          },
        });

        throw error;
      }
    };

    return descriptor;
  };
};

/**
 * Audit Service
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Log an audit event
   */
  async log(data: {
    tenantId: string;
    userId?: string;
    action: any;
    entityType: string;
    entityId?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    changedFields?: string[];
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        tenantId: data.tenantId,
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: redactPiiData(data.oldValues),
        newValues: redactPiiData(data.newValues),
        changedFields: data.changedFields,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        requestId: data.requestId,
        metadata: redactPiiData(data.metadata || {}),
      });

      if (this.dataSource.options.type === "postgres" && data.tenantId) {
        await this.saveWithExplicitRlsContext(auditLog);
      } else {
        await this.auditLogRepository.save(auditLog);
      }

      this.logger.debug(
        `Audit log created: ${data.action} on ${data.entityType}`,
      );
    } catch (error: unknown) {
      // Don't throw error in audit logging to avoid breaking main flow
      this.logger.error(
        "Failed to create audit log:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Get audit logs for a tenant
   */
  async getTenantAuditLogs(
    tenantId: string,
    filters: {
      userId?: string;
      action?: string;
      entityType?: string;
      entityId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ data: AuditLog[]; total: number }> {
    const query = this.auditLogRepository
      .createQueryBuilder("auditLog")
      .where("auditLog.tenantId = :tenantId", { tenantId });

    if (filters.userId) {
      query.andWhere("auditLog.userId = :userId", { userId: filters.userId });
    }

    if (filters.action) {
      query.andWhere("auditLog.action = :action", { action: filters.action });
    }

    if (filters.entityType) {
      query.andWhere("auditLog.entityType = :entityType", {
        entityType: filters.entityType,
      });
    }

    if (filters.entityId) {
      query.andWhere("auditLog.entityId = :entityId", {
        entityId: filters.entityId,
      });
    }

    if (filters.startDate) {
      query.andWhere("auditLog.createdAt >= :startDate", {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      query.andWhere("auditLog.createdAt <= :endDate", {
        endDate: filters.endDate,
      });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;

    const [data, total] = await query
      .orderBy("auditLog.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  /**
   * Calculate changed fields
   */
  calculateChangedFields(
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
  ): string[] {
    const changedFields: string[] = [];

    const allKeys = new Set([
      ...Object.keys(oldValues),
      ...Object.keys(newValues),
    ]);

    for (const key of allKeys) {
      const oldValue = oldValues[key];
      const newValue = newValues[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  /**
   * Purge old audit logs (retention policy)
   */
  async purgeOldAuditLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where("createdAt < :cutoffDate", { cutoffDate })
      .execute();

    this.logger.log(
      `Purged ${result.affected} audit logs older than ${retentionDays} days`,
    );

    return result.affected || 0;
  }

  private async saveWithExplicitRlsContext(auditLog: AuditLog): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    try {
      await this.applyTenantAuditContext(queryRunner, auditLog);
      await queryRunner.manager.save(AuditLog, auditLog);
    } finally {
      await queryRunner.release();
    }
  }

  private async applyTenantAuditContext(
    queryRunner: QueryRunner,
    auditLog: AuditLog,
  ): Promise<void> {
    await queryRunner.query(
      `
        SELECT
          set_config('app.current_tenant_id', $1, false),
          set_config('app.current_user_id', $2, false),
          set_config('app.current_user_role', $3, false)
      `,
      [
        auditLog.tenantId,
        auditLog.userId ?? "",
        auditLog.userId ? "system" : "",
      ],
    );
  }
}
