"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get Audit () {
        return Audit;
    },
    get AuditService () {
        return AuditService;
    }
});
const _common = require("@nestjs/common");
const _AuditLogentity = require("../../database/entities/AuditLog.entity");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _piiprotection = require("../../common/security/pii-protection");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
const Audit = (action)=>{
    return function(target, _propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function(...args) {
            const context = args.find((arg)=>arg && typeof arg.switchToHttp === "function");
            const requestFromContext = context?.switchToHttp().getRequest();
            const requestFromArgs = args.find((arg)=>arg && typeof arg === "object" && "headers" in arg && "method" in arg);
            const request = requestFromContext || requestFromArgs;
            const auditService = this.auditService;
            if (!request || !auditService) {
                return originalMethod.apply(this, args);
            }
            try {
                const result = await originalMethod.apply(this, args);
                await auditService.log({
                    tenantId: request.user?.tenant_id,
                    userId: request.user?.user_id,
                    action: action,
                    entityType: target.constructor.name,
                    entityId: result?.id,
                    ipAddress: request.ip,
                    userAgent: request.get?.("user-agent") ?? request.headers?.["user-agent"],
                    requestId: request.correlationId,
                    metadata: {
                        endpoint: request.route?.path,
                        method: request.method
                    }
                });
                return result;
            } catch (error) {
                await auditService.log({
                    tenantId: request.user?.tenant_id,
                    userId: request.user?.user_id,
                    action: "login",
                    entityType: target.constructor.name,
                    ipAddress: request.ip,
                    userAgent: request.get?.("user-agent") ?? request.headers?.["user-agent"],
                    requestId: request.correlationId,
                    metadata: {
                        endpoint: request.route?.path,
                        method: request.method,
                        error: error instanceof Error ? error.message : String(error)
                    }
                });
                throw error;
            }
        };
        return descriptor;
    };
};
let AuditService = class AuditService {
    /**
   * Log an audit event
   */ async log(data) {
        try {
            const auditLog = this.auditLogRepository.create({
                tenantId: data.tenantId,
                userId: data.userId,
                action: data.action,
                entityType: data.entityType,
                entityId: data.entityId,
                oldValues: (0, _piiprotection.redactPiiData)(data.oldValues),
                newValues: (0, _piiprotection.redactPiiData)(data.newValues),
                changedFields: data.changedFields,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                requestId: data.requestId,
                metadata: (0, _piiprotection.redactPiiData)(data.metadata || {})
            });
            if (this.dataSource.options.type === "postgres" && data.tenantId) {
                await this.saveWithExplicitRlsContext(auditLog);
            } else {
                await this.auditLogRepository.save(auditLog);
            }
            this.logger.debug(`Audit log created: ${data.action} on ${data.entityType}`);
        } catch (error) {
            // Don't throw error in audit logging to avoid breaking main flow
            this.logger.error("Failed to create audit log:", error instanceof Error ? error.message : String(error));
        }
    }
    /**
   * Get audit logs for a tenant
   */ async getTenantAuditLogs(tenantId, filters = {}) {
        const query = this.auditLogRepository.createQueryBuilder("auditLog").where("auditLog.tenantId = :tenantId", {
            tenantId
        });
        if (filters.userId) {
            query.andWhere("auditLog.userId = :userId", {
                userId: filters.userId
            });
        }
        if (filters.action) {
            query.andWhere("auditLog.action = :action", {
                action: filters.action
            });
        }
        if (filters.entityType) {
            query.andWhere("auditLog.entityType = :entityType", {
                entityType: filters.entityType
            });
        }
        if (filters.entityId) {
            query.andWhere("auditLog.entityId = :entityId", {
                entityId: filters.entityId
            });
        }
        if (filters.startDate) {
            query.andWhere("auditLog.createdAt >= :startDate", {
                startDate: filters.startDate
            });
        }
        if (filters.endDate) {
            query.andWhere("auditLog.createdAt <= :endDate", {
                endDate: filters.endDate
            });
        }
        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const [data, total] = await query.orderBy("auditLog.createdAt", "DESC").skip((page - 1) * limit).take(limit).getManyAndCount();
        return {
            data,
            total
        };
    }
    /**
   * Calculate changed fields
   */ calculateChangedFields(oldValues, newValues) {
        const changedFields = [];
        const allKeys = new Set([
            ...Object.keys(oldValues),
            ...Object.keys(newValues)
        ]);
        for (const key of allKeys){
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
   */ async purgeOldAuditLogs(retentionDays = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const result = await this.auditLogRepository.createQueryBuilder().delete().where("createdAt < :cutoffDate", {
            cutoffDate
        }).execute();
        this.logger.log(`Purged ${result.affected} audit logs older than ${retentionDays} days`);
        return result.affected || 0;
    }
    async saveWithExplicitRlsContext(auditLog) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            await this.applyTenantAuditContext(queryRunner, auditLog);
            await queryRunner.manager.save(_AuditLogentity.AuditLog, auditLog);
        } finally{
            await queryRunner.release();
        }
    }
    async applyTenantAuditContext(queryRunner, auditLog) {
        await queryRunner.query(`
        SELECT
          set_config('app.current_tenant_id', $1, false),
          set_config('app.current_user_id', $2, false),
          set_config('app.current_user_role', $3, false)
      `, [
            auditLog.tenantId,
            auditLog.userId ?? "",
            auditLog.userId ? "system" : ""
        ]);
    }
    constructor(auditLogRepository, dataSource){
        this.auditLogRepository = auditLogRepository;
        this.dataSource = dataSource;
        this.logger = new _common.Logger(AuditService.name);
    }
};
AuditService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_AuditLogentity.AuditLog)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.DataSource === "undefined" ? Object : _typeorm1.DataSource
    ])
], AuditService);

//# sourceMappingURL=audit.service.js.map