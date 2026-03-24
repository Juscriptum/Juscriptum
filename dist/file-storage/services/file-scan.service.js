"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FileScanService", {
    enumerable: true,
    get: function() {
        return FileScanService;
    }
});
const _common = require("@nestjs/common");
const _schedule = require("@nestjs/schedule");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _auditservice = require("../../auth/services/audit.service");
const _Documententity = require("../../database/entities/Document.entity");
const _FileScanRecordentity = require("../../database/entities/FileScanRecord.entity");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
const _storageproviderservice = require("./storage-provider.service");
const _malwarescannerservice = require("./malware-scanner.service");
const _scheduledtasks = require("../../common/runtime/scheduled-tasks");
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
let FileScanService = class FileScanService {
    async createPendingScanRecord(data) {
        const existing = await this.fileScanRepository.findOne({
            where: {
                storagePath: data.storagePath
            }
        });
        const record = existing || this.fileScanRepository.create({
            tenantId: data.tenantId,
            storagePath: data.storagePath,
            fileName: data.fileName,
            mimeType: data.mimeType || null,
            status: "pending",
            scannerEngine: null,
            malwareSignature: null,
            scanError: null,
            scanAttempts: 0,
            maxAttempts: 3,
            nextAttemptAt: new Date(),
            scannedAt: null,
            documentId: null,
            metadata: null
        });
        Object.assign(record, {
            tenantId: data.tenantId,
            storagePath: data.storagePath,
            fileName: data.fileName,
            mimeType: data.mimeType || null,
            status: "pending",
            scannerEngine: null,
            malwareSignature: null,
            scanError: null,
            nextAttemptAt: new Date(),
            metadata: {
                ...existing?.metadata || {},
                ...data.metadata || {}
            }
        });
        const savedRecord = await this.fileScanRepository.save(record);
        await this.auditService.log({
            tenantId: data.tenantId,
            action: _subscriptionenum.AuditAction.CREATE,
            entityType: "FileScanRecord",
            entityId: savedRecord.id,
            metadata: {
                event: "file_scan_queued",
                storagePath: data.storagePath,
                fileName: data.fileName
            }
        });
        return savedRecord;
    }
    async linkDocument(tenantId, storagePath, documentId) {
        const record = await this.fileScanRepository.findOne({
            where: {
                tenantId,
                storagePath
            }
        });
        if (!record) {
            throw new _common.NotFoundException("File scan record not found");
        }
        record.documentId = documentId;
        await this.fileScanRepository.save(record);
        await this.documentRepository.update({
            id: documentId,
            tenantId
        }, {
            malwareScanStatus: record.status,
            malwareScannedAt: record.scannedAt,
            malwareScanner: record.scannerEngine,
            malwareSignature: record.malwareSignature,
            malwareScanError: record.scanError
        });
    }
    async getScanRecord(tenantId, storagePath) {
        return this.fileScanRepository.findOne({
            where: {
                tenantId,
                storagePath
            }
        });
    }
    async markFileAsClean(data) {
        const existing = await this.fileScanRepository.findOne({
            where: {
                tenantId: data.tenantId,
                storagePath: data.storagePath
            }
        });
        const record = existing || this.fileScanRepository.create({
            tenantId: data.tenantId,
            storagePath: data.storagePath,
            fileName: data.fileName,
            mimeType: data.mimeType || null,
            status: "clean",
            scannerEngine: data.scannerEngine || "internal_trusted",
            malwareSignature: null,
            scanError: null,
            scanAttempts: 0,
            maxAttempts: 1,
            nextAttemptAt: new Date("2999-01-01T00:00:00.000Z"),
            scannedAt: new Date(),
            documentId: data.documentId || null,
            metadata: null
        });
        Object.assign(record, {
            tenantId: data.tenantId,
            storagePath: data.storagePath,
            fileName: data.fileName,
            mimeType: data.mimeType || null,
            status: "clean",
            scannerEngine: data.scannerEngine || "internal_trusted",
            malwareSignature: null,
            scanError: null,
            scannedAt: new Date(),
            nextAttemptAt: new Date("2999-01-01T00:00:00.000Z"),
            documentId: data.documentId || existing?.documentId || null,
            metadata: {
                ...existing?.metadata || {},
                ...data.metadata || {}
            }
        });
        const savedRecord = await this.fileScanRepository.save(record);
        await this.syncDocumentState(savedRecord);
        await this.auditService.log({
            tenantId: data.tenantId,
            action: _subscriptionenum.AuditAction.VERIFY,
            entityType: "FileScanRecord",
            entityId: savedRecord.id,
            metadata: {
                event: "file_scan_marked_clean_internal",
                storagePath: data.storagePath,
                fileName: data.fileName,
                engine: savedRecord.scannerEngine
            }
        });
        return savedRecord;
    }
    async assertFileIsSafe(tenantId, storagePath) {
        const record = await this.getScanRecord(tenantId, storagePath);
        if (!record) {
            throw new _common.ForbiddenException("File cannot be served before malware scan");
        }
        if (record.status !== "clean") {
            const messageByStatus = {
                pending: "File is still pending malware scan",
                clean: "File is clean",
                infected: "File was blocked by malware scanner",
                failed: "File cannot be served because malware scan failed"
            };
            throw new _common.ForbiddenException(messageByStatus[record.status]);
        }
    }
    async processDueScans(limit = 20) {
        const records = await this.fileScanRepository.find({
            where: [
                {
                    status: "pending",
                    nextAttemptAt: (0, _typeorm1.LessThanOrEqual)(new Date())
                },
                {
                    status: "failed",
                    nextAttemptAt: (0, _typeorm1.LessThanOrEqual)(new Date())
                }
            ],
            order: {
                nextAttemptAt: "ASC"
            },
            take: limit
        });
        for (const record of records){
            await this.processScan(record.id);
        }
        return records.length;
    }
    async processScan(recordId) {
        const record = await this.fileScanRepository.findOne({
            where: {
                id: recordId
            }
        });
        if (!record) {
            throw new _common.NotFoundException("File scan record not found");
        }
        record.scanAttempts += 1;
        record.scanError = null;
        await this.fileScanRepository.save(record);
        try {
            const download = await this.storageProviderService.download({
                path: record.storagePath
            });
            const result = await this.malwareScannerService.scanFile(record.fileName, download.buffer);
            await this.applyScanResult(record, result);
        } catch (error) {
            await this.applyFailure(record, error instanceof Error ? error.message : String(error));
        }
    }
    async processPendingScans() {
        if (!(0, _scheduledtasks.shouldRunScheduledTasks)()) {
            return;
        }
        const processed = await this.processDueScans();
        if (processed > 0) {
            this.logger.log(`Processed ${processed} malware scan job(s)`);
        }
    }
    async applyScanResult(record, result) {
        record.status = result.status;
        record.scannedAt = new Date();
        record.scannerEngine = result.engine;
        record.malwareSignature = result.signature || null;
        record.scanError = null;
        record.nextAttemptAt = new Date("2999-01-01T00:00:00.000Z");
        await this.fileScanRepository.save(record);
        await this.syncDocumentState(record);
        await this.auditService.log({
            tenantId: record.tenantId,
            action: result.status === "infected" ? _subscriptionenum.AuditAction.REVOKE : _subscriptionenum.AuditAction.VERIFY,
            entityType: "FileScanRecord",
            entityId: record.id,
            metadata: {
                event: result.status === "infected" ? "file_scan_infected" : "file_scan_clean",
                storagePath: record.storagePath,
                engine: result.engine,
                signature: result.signature
            }
        });
    }
    async applyFailure(record, message) {
        const hasAttemptsLeft = record.scanAttempts < record.maxAttempts;
        record.status = "failed";
        record.scanError = message;
        record.scannerEngine = record.scannerEngine || "unavailable";
        record.nextAttemptAt = hasAttemptsLeft ? new Date(Date.now() + record.scanAttempts * 60 * 1000) : new Date("2999-01-01T00:00:00.000Z");
        await this.fileScanRepository.save(record);
        await this.syncDocumentState(record);
        await this.auditService.log({
            tenantId: record.tenantId,
            action: _subscriptionenum.AuditAction.UPDATE,
            entityType: "FileScanRecord",
            entityId: record.id,
            metadata: {
                event: hasAttemptsLeft ? "file_scan_retry_scheduled" : "file_scan_failed",
                storagePath: record.storagePath,
                reason: message,
                attemptCount: record.scanAttempts
            }
        });
    }
    async syncDocumentState(record) {
        if (!record.documentId) {
            return;
        }
        await this.documentRepository.update({
            id: record.documentId,
            tenantId: record.tenantId
        }, {
            malwareScanStatus: record.status,
            malwareScannedAt: record.scannedAt,
            malwareScanner: record.scannerEngine,
            malwareSignature: record.malwareSignature,
            malwareScanError: record.scanError
        });
    }
    constructor(fileScanRepository, documentRepository, storageProviderService, malwareScannerService, auditService){
        this.fileScanRepository = fileScanRepository;
        this.documentRepository = documentRepository;
        this.storageProviderService = storageProviderService;
        this.malwareScannerService = malwareScannerService;
        this.auditService = auditService;
        this.logger = new _common.Logger(FileScanService.name);
    }
};
_ts_decorate([
    (0, _schedule.Cron)(_schedule.CronExpression.EVERY_MINUTE),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], FileScanService.prototype, "processPendingScans", null);
FileScanService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_FileScanRecordentity.FileScanRecord)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_Documententity.Document)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _storageproviderservice.StorageProviderService === "undefined" ? Object : _storageproviderservice.StorageProviderService,
        typeof _malwarescannerservice.MalwareScannerService === "undefined" ? Object : _malwarescannerservice.MalwareScannerService,
        typeof _auditservice.AuditService === "undefined" ? Object : _auditservice.AuditService
    ])
], FileScanService);

//# sourceMappingURL=file-scan.service.js.map