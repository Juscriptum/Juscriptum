"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "WormAuditService", {
    enumerable: true,
    get: function() {
        return WormAuditService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _config = require("@nestjs/config");
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
const _WormAuditLogentity = require("../entities/WormAuditLog.entity");
const _Organizationentity = require("../../../database/entities/Organization.entity");
const _wormauditinterface = require("../interfaces/worm-audit.interface");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
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
let WormAuditService = class WormAuditService {
    /**
   * Log an audit event
   */ async log(entry) {
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
            action: entry.action,
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
            hash: ""
        });
        // Calculate integrity hash
        auditLog.hash = this.calculateHash(auditLog);
        const saved = await this.auditRepository.save(auditLog);
        // Update chain head cache
        this.chainHeads.set(tenantId, {
            hash: saved.hash,
            index: saved.chainIndex
        });
        this.logger.debug(`Audit log created: ${saved.id} for tenant ${tenantId}`);
        return saved;
    }
    /**
   * Calculate integrity hash for audit entry
   */ calculateHash(log) {
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
            chainIndex: log.chainIndex
        });
        return _crypto.createHash("sha256").update(data).digest("hex");
    }
    /**
   * Get chain head for tenant
   */ async getChainHead(tenantId) {
        // Check cache first
        if (this.chainHeads.has(tenantId)) {
            return this.chainHeads.get(tenantId) || null;
        }
        // Query database
        const latest = await this.auditRepository.findOne({
            where: {
                tenantId
            },
            order: {
                chainIndex: "DESC"
            },
            select: [
                "hash",
                "chainIndex"
            ]
        });
        if (latest) {
            this.chainHeads.set(tenantId, {
                hash: latest.hash,
                index: latest.chainIndex
            });
            return {
                hash: latest.hash,
                index: latest.chainIndex
            };
        }
        return null;
    }
    /**
   * Verify audit chain integrity
   */ async verifyChainIntegrity(tenantId) {
        const logs = await this.auditRepository.find({
            where: {
                tenantId
            },
            order: {
                chainIndex: "ASC"
            },
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
                "timestamp"
            ]
        });
        let previousHash = null;
        for (const log of logs){
            // Verify hash
            const calculatedHash = this.calculateHash(log);
            if (calculatedHash !== log.hash) {
                return {
                    valid: false,
                    brokenAt: log.chainIndex,
                    error: "Hash mismatch detected"
                };
            }
            // Verify chain
            if (previousHash !== null && log.previousHash !== previousHash) {
                return {
                    valid: false,
                    brokenAt: log.chainIndex,
                    error: "Chain link broken"
                };
            }
            previousHash = log.hash;
        }
        return {
            valid: true
        };
    }
    /**
   * Get audit logs with filters
   */ async getLogs(tenantId, options = {}) {
        const page = options.page || 1;
        const limit = Math.min(options.limit || 100, 1000);
        const skip = (page - 1) * limit;
        const queryBuilder = this.auditRepository.createQueryBuilder("log").where("log.tenantId = :tenantId", {
            tenantId
        }).orderBy("log.timestamp", "DESC").skip(skip).take(limit);
        if (options.userId) {
            queryBuilder.andWhere("log.userId = :userId", {
                userId: options.userId
            });
        }
        if (options.action) {
            queryBuilder.andWhere("log.action = :action", {
                action: options.action
            });
        }
        if (options.entityType) {
            queryBuilder.andWhere("log.entityType = :entityType", {
                entityType: options.entityType
            });
        }
        if (options.entityId) {
            queryBuilder.andWhere("log.entityId = :entityId", {
                entityId: options.entityId
            });
        }
        if (options.startDate) {
            queryBuilder.andWhere("log.timestamp >= :startDate", {
                startDate: options.startDate
            });
        }
        if (options.endDate) {
            queryBuilder.andWhere("log.timestamp <= :endDate", {
                endDate: options.endDate
            });
        }
        const [data, total] = await queryBuilder.getManyAndCount();
        return {
            data,
            total
        };
    }
    /**
   * Export audit logs (for compliance)
   */ async exportLogs(tenantId, format = "json", options = {}) {
        const { data } = await this.getLogs(tenantId, {
            startDate: options.startDate,
            endDate: options.endDate,
            limit: 10000
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
            "Hash"
        ];
        const rows = data.map((log)=>[
                log.id,
                log.timestamp.toISOString(),
                log.userId || "",
                log.action,
                log.entityType,
                log.entityId || "",
                log.ipAddress || "",
                log.hash
            ]);
        return [
            headers.join(","),
            ...rows.map((row)=>row.map((cell)=>`"${cell}"`).join(","))
        ].join("\n");
    }
    /**
   * Get retention period for tenant
   */ async getRetentionPeriod(tenantId) {
        const organization = await this.organizationRepository.findOne({
            where: {
                id: tenantId
            },
            select: [
                "subscriptionPlan",
                "auditRetentionDays"
            ]
        });
        if (organization?.auditRetentionDays) {
            return organization.auditRetentionDays;
        }
        return _wormauditinterface.STANDARD_RETENTION_DAYS;
    }
    /**
   * Clean up old audit logs based on retention policy
   */ async cleanupOldLogs() {
        const tenants = await this.organizationRepository.find({
            where: {
                status: "active"
            },
            select: [
                "id",
                "auditRetentionDays"
            ]
        });
        let totalDeleted = 0;
        for (const tenant of tenants){
            const retentionDays = tenant.auditRetentionDays || _wormauditinterface.STANDARD_RETENTION_DAYS;
            const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
            const result = await this.auditRepository.delete({
                tenantId: tenant.id,
                timestamp: (0, _typeorm1.MoreThan)(cutoffDate)
            });
            totalDeleted += result.affected || 0;
        }
        return {
            tenantsProcessed: tenants.length,
            logsDeleted: totalDeleted
        };
    }
    /**
   * Log security event
   */ async logSecurityEvent(tenantId, event) {
        return this.log({
            tenantId,
            userId: event.userId,
            action: event.action,
            entityType: "security",
            metadata: event.details,
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            requestId: event.requestId
        });
    }
    constructor(auditRepository, organizationRepository, configService){
        this.auditRepository = auditRepository;
        this.organizationRepository = organizationRepository;
        this.configService = configService;
        this.logger = new _common.Logger(WormAuditService.name);
        this.chainHeads = new Map();
        this.config = {
            ..._wormauditinterface.DEFAULT_WORM_CONFIG,
            retentionDays: this.configService.get("AUDIT_RETENTION_DAYS", _wormauditinterface.DEFAULT_WORM_CONFIG.retentionDays)
        };
    }
};
WormAuditService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_WormAuditLogentity.WormAuditLog)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_Organizationentity.Organization)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], WormAuditService);

//# sourceMappingURL=worm-audit.service.js.map