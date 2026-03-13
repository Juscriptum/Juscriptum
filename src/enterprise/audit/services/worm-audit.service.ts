import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, MoreThan } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { WormAuditLog } from "../entities/WormAuditLog.entity";
import { Organization } from "../../../database/entities/Organization.entity";
import {
  AuditEntry,
  AuditActionType,
  WormAuditConfig,
  DEFAULT_WORM_CONFIG,
  ENTERPRISE_RETENTION_DAYS,
  STANDARD_RETENTION_DAYS,
} from "../interfaces/worm-audit.interface";

/**
 * WORM Audit Service
 * Provides immutable, tamper-evident audit logging
 */
@Injectable()
export class WormAuditService {
  private readonly logger = new Logger(WormAuditService.name);
  private readonly config: WormAuditConfig;
  private chainHeads: Map<string, { hash: string; index: number }> = new Map();

  constructor(
    @InjectRepository(WormAuditLog)
    private readonly auditRepository: Repository<WormAuditLog>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly configService: ConfigService,
  ) {
    this.config = {
      ...DEFAULT_WORM_CONFIG,
      retentionDays: this.configService.get(
        "AUDIT_RETENTION_DAYS",
        DEFAULT_WORM_CONFIG.retentionDays,
      ),
    };
  }

  /**
   * Log an audit event
   */
  async log(entry: Partial<AuditEntry>): Promise<WormAuditLog> {
    const tenantId = entry.tenantId;
    if (!tenantId) {
      throw new Error("Tenant ID is required for audit logging");
    }

    // Get chain head for tenant
    const chainHead = await this.getChainHead(tenantId);

    // Create audit log entry
    const auditLog = this.auditRepository.create({
      tenantId,
      userId: entry.userId,
      action: entry.action as any,
      entityType: entry.entityType,
      entityId: entry.entityId,
      oldValues: entry.oldValues,
      newValues: entry.newValues,
      changedFields: entry.changedFields,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      requestId: entry.requestId,
      sessionId: entry.sessionId,
      metadata: entry.metadata || {},
      timestamp: entry.timestamp || new Date(),
      previousHash: chainHead?.hash,
      chainIndex: (chainHead?.index || 0) + 1,
      hash: "", // Will be calculated
    });

    // Calculate integrity hash
    auditLog.hash = this.calculateHash(auditLog);

    const saved = await this.auditRepository.save(auditLog);

    // Update chain head cache
    this.chainHeads.set(tenantId, {
      hash: saved.hash,
      index: saved.chainIndex,
    });

    this.logger.debug(`Audit log created: ${saved.id} for tenant ${tenantId}`);

    return saved;
  }

  /**
   * Calculate integrity hash for audit entry
   */
  private calculateHash(log: WormAuditLog): string {
    const data = JSON.stringify({
      tenantId: log.tenantId,
      userId: log.userId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      oldValues: log.oldValues,
      newValues: log.newValues,
      timestamp: log.timestamp,
      previousHash: log.previousHash,
      chainIndex: log.chainIndex,
    });

    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Get chain head for tenant
   */
  private async getChainHead(
    tenantId: string,
  ): Promise<{ hash: string; index: number } | null> {
    // Check cache first
    if (this.chainHeads.has(tenantId)) {
      return this.chainHeads.get(tenantId) || null;
    }

    // Query database
    const latest = await this.auditRepository.findOne({
      where: { tenantId },
      order: { chainIndex: "DESC" },
      select: ["hash", "chainIndex"],
    });

    if (latest) {
      this.chainHeads.set(tenantId, {
        hash: latest.hash,
        index: latest.chainIndex,
      });
      return { hash: latest.hash, index: latest.chainIndex };
    }

    return null;
  }

  /**
   * Verify audit chain integrity
   */
  async verifyChainIntegrity(
    tenantId: string,
  ): Promise<{ valid: boolean; brokenAt?: number; error?: string }> {
    const logs = await this.auditRepository.find({
      where: { tenantId },
      order: { chainIndex: "ASC" },
      select: [
        "id",
        "hash",
        "previousHash",
        "chainIndex",
        "tenantId",
        "userId",
        "action",
        "entityType",
        "entityId",
        "oldValues",
        "newValues",
        "timestamp",
      ],
    });

    let previousHash: string | null = null;

    for (const log of logs) {
      // Verify hash
      const calculatedHash = this.calculateHash(log as any);
      if (calculatedHash !== log.hash) {
        return {
          valid: false,
          brokenAt: log.chainIndex,
          error: "Hash mismatch detected",
        };
      }

      // Verify chain
      if (previousHash !== null && log.previousHash !== previousHash) {
        return {
          valid: false,
          brokenAt: log.chainIndex,
          error: "Chain link broken",
        };
      }

      previousHash = log.hash;
    }

    return { valid: true };
  }

  /**
   * Get audit logs with filters
   */
  async getLogs(
    tenantId: string,
    options: {
      userId?: string;
      action?: AuditActionType;
      entityType?: string;
      entityId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ data: WormAuditLog[]; total: number }> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 100, 1000);
    const skip = (page - 1) * limit;

    const queryBuilder = this.auditRepository
      .createQueryBuilder("log")
      .where("log.tenantId = :tenantId", { tenantId })
      .orderBy("log.timestamp", "DESC")
      .skip(skip)
      .take(limit);

    if (options.userId) {
      queryBuilder.andWhere("log.userId = :userId", { userId: options.userId });
    }

    if (options.action) {
      queryBuilder.andWhere("log.action = :action", { action: options.action });
    }

    if (options.entityType) {
      queryBuilder.andWhere("log.entityType = :entityType", {
        entityType: options.entityType,
      });
    }

    if (options.entityId) {
      queryBuilder.andWhere("log.entityId = :entityId", {
        entityId: options.entityId,
      });
    }

    if (options.startDate) {
      queryBuilder.andWhere("log.timestamp >= :startDate", {
        startDate: options.startDate,
      });
    }

    if (options.endDate) {
      queryBuilder.andWhere("log.timestamp <= :endDate", {
        endDate: options.endDate,
      });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  /**
   * Export audit logs (for compliance)
   */
  async exportLogs(
    tenantId: string,
    format: "json" | "csv" = "json",
    options: { startDate?: Date; endDate?: Date } = {},
  ): Promise<string> {
    const { data } = await this.getLogs(tenantId, {
      startDate: options.startDate,
      endDate: options.endDate,
      limit: 10000,
    });

    if (format === "json") {
      return JSON.stringify(data, null, 2);
    }

    // CSV format
    const headers = [
      "ID",
      "Timestamp",
      "User ID",
      "Action",
      "Entity Type",
      "Entity ID",
      "IP Address",
      "Hash",
    ];
    const rows = data.map((log) => [
      log.id,
      log.timestamp.toISOString(),
      log.userId || "",
      log.action,
      log.entityType,
      log.entityId || "",
      log.ipAddress || "",
      log.hash,
    ]);

    return [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
  }

  /**
   * Get retention period for tenant
   */
  async getRetentionPeriod(tenantId: string): Promise<number> {
    const organization = await this.organizationRepository.findOne({
      where: { id: tenantId },
      select: ["subscriptionPlan", "auditRetentionDays"],
    });

    if (organization?.auditRetentionDays) {
      return organization.auditRetentionDays;
    }

    return STANDARD_RETENTION_DAYS;
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  async cleanupOldLogs(): Promise<{
    tenantsProcessed: number;
    logsDeleted: number;
  }> {
    const tenants = await this.organizationRepository.find({
      where: { status: "active" },
      select: ["id", "auditRetentionDays"],
    });

    let totalDeleted = 0;

    for (const tenant of tenants) {
      const retentionDays =
        tenant.auditRetentionDays || STANDARD_RETENTION_DAYS;
      const cutoffDate = new Date(
        Date.now() - retentionDays * 24 * 60 * 60 * 1000,
      );

      const result = await this.auditRepository.delete({
        tenantId: tenant.id,
        timestamp: MoreThan(cutoffDate) as any,
      });

      totalDeleted += result.affected || 0;
    }

    return {
      tenantsProcessed: tenants.length,
      logsDeleted: totalDeleted,
    };
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    tenantId: string,
    event: {
      userId?: string;
      action: AuditActionType;
      details?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
      requestId?: string;
    },
  ): Promise<WormAuditLog> {
    return this.log({
      tenantId,
      userId: event.userId,
      action: event.action,
      entityType: "security",
      metadata: event.details,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      requestId: event.requestId,
    });
  }
}
