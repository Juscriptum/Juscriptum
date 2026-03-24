"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FileStorageService", {
    enumerable: true,
    get: function() {
        return FileStorageService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _storageproviderservice = require("./storage-provider.service");
const _filescanservice = require("./file-scan.service");
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
const _promises = require("node:fs/promises");
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
/**
 * Allowed file types for upload
 */ const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/rtf",
    "application/json",
    "application/xml",
    "application/zip",
    "application/x-zip-compressed",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "text/plain",
    "text/markdown",
    "text/csv",
    "text/html",
    "text/xml"
];
/**
 * Maximum file size per plan (in bytes)
 */ const PLAN_LIMITS = {
    basic: 10 * 1024 * 1024,
    professional: 50 * 1024 * 1024,
    enterprise: 100 * 1024 * 1024
};
/**
 * Storage quotas per plan (in GB)
 */ const STORAGE_QUOTAS = {
    basic: 1,
    professional: 10,
    enterprise: 100
};
let FileStorageService = class FileStorageService {
    /**
   * Upload file with validation and quota check
   */ async uploadFile(tenantId, userId, file, options = {}) {
        const fileBuffer = file.buffer && file.buffer.length > 0 ? file.buffer : file.path ? await (0, _promises.readFile)(file.path) : null;
        if (!fileBuffer) {
            throw new _common.BadRequestException("Uploaded file payload is empty");
        }
        // Validate file type
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new _common.BadRequestException(`Unsupported file type: ${file.mimetype}`);
        }
        // Validate file size (basic check)
        const maxSize = PLAN_LIMITS.basic; // Default to basic limit
        if (file.size > maxSize) {
            throw new _common.BadRequestException(`Файл завеликий. Максимальний розмір: ${maxSize / (1024 * 1024)} МБ`);
        }
        // Generate unique file name
        const fileExtension = file.originalname.split(".").pop();
        const fileName = `${_crypto.randomUUID()}.${fileExtension}`;
        // Build storage path
        const path = this.buildStoragePath(tenantId, options.folder, options.caseId, options.clientId);
        // Prepare upload options
        const uploadOptions = {
            path,
            fileName,
            buffer: fileBuffer,
            contentType: file.mimetype,
            metadata: {
                originalName: file.originalname,
                uploadedBy: userId,
                ...options.metadata
            },
            isPublic: options.isPublic || false
        };
        // Upload file
        const result = await this.storageProvider.upload(uploadOptions);
        const scanRecord = await this.fileScanService.createPendingScanRecord({
            tenantId,
            storagePath: result.path,
            fileName: file.originalname,
            mimeType: file.mimetype,
            metadata: {
                uploadedBy: userId,
                originalName: file.originalname,
                fileSize: file.size
            }
        });
        if (file.path) {
            await (0, _promises.unlink)(file.path).catch(()=>undefined);
        }
        this.logger.log(`File uploaded for tenant ${tenantId}: ${fileName}`);
        return {
            ...result,
            malwareScanStatus: scanRecord.status,
            malwareScanId: scanRecord.id
        };
    }
    /**
   * Upload multiple files
   */ async uploadFiles(tenantId, userId, files, options = {}) {
        const results = {
            success: [],
            failed: []
        };
        for (const file of files){
            try {
                const result = await this.uploadFile(tenantId, userId, file, options);
                results.success.push(result);
            } catch (error) {
                results.failed.push({
                    fileName: file.originalname,
                    error: error instanceof Error ? error.message : String(error) || "Upload failed"
                });
            }
        }
        return results;
    }
    /**
   * Download file
   */ async downloadFile(tenantId, storagePath) {
        this.validateTenantAccess(storagePath, tenantId);
        await this.fileScanService.assertFileIsSafe(tenantId, storagePath);
        const result = await this.storageProvider.download({
            path: storagePath
        });
        return result.buffer;
    }
    /**
   * Download file for internal processing pipelines without serving it to users.
   * This intentionally bypasses the malware-serve gate because the file stays
   * inside trusted backend processing.
   */ async downloadFileForInternalProcessing(tenantId, storagePath) {
        this.validateTenantAccess(storagePath, tenantId);
        const result = await this.storageProvider.download({
            path: storagePath
        });
        return result.buffer;
    }
    /**
   * Generate signed URL for file
   */ async generateSignedUrl(tenantId, storagePath, options = {}) {
        this.validateTenantAccess(storagePath, tenantId);
        await this.fileScanService.assertFileIsSafe(tenantId, storagePath);
        return this.storageProvider.generateSignedUrl({
            path: storagePath,
            expiresIn: options.expiresIn,
            disposition: options.disposition,
            contentType: options.contentType
        });
    }
    /**
   * Delete file
   */ async deleteFile(tenantId, storagePath) {
        this.validateTenantAccess(storagePath, tenantId);
        await this.storageProvider.delete(storagePath);
        this.logger.log(`File deleted for tenant ${tenantId}: ${storagePath}`);
    }
    /**
   * Delete multiple files
   */ async deleteFiles(tenantId, storagePaths) {
        // Validate all paths belong to the tenant
        for (const path of storagePaths){
            this.validateTenantAccess(path, tenantId);
        }
        await this.storageProvider.deleteMultiple(storagePaths);
        this.logger.log(`Deleted ${storagePaths.length} files for tenant ${tenantId}`);
    }
    /**
   * Copy file
   */ async copyFile(tenantId, sourcePath, destinationPath) {
        this.validateTenantAccess(sourcePath, tenantId);
        this.validateTenantAccess(destinationPath, tenantId);
        return this.storageProvider.copy(sourcePath, destinationPath);
    }
    /**
   * Move file
   */ async moveFile(tenantId, sourcePath, destinationPath) {
        this.validateTenantAccess(sourcePath, tenantId);
        this.validateTenantAccess(destinationPath, tenantId);
        return this.storageProvider.move(sourcePath, destinationPath);
    }
    /**
   * Check if file exists
   */ async fileExists(tenantId, storagePath) {
        this.validateTenantAccess(storagePath, tenantId);
        return this.storageProvider.exists(storagePath);
    }
    /**
   * Get file metadata
   */ async getFileMetadata(tenantId, storagePath) {
        this.validateTenantAccess(storagePath, tenantId);
        const [metadata, scanRecord] = await Promise.all([
            this.storageProvider.getMetadata(storagePath),
            this.fileScanService.getScanRecord(tenantId, storagePath)
        ]);
        return {
            ...metadata,
            malwareScan: scanRecord ? {
                id: scanRecord.id,
                status: scanRecord.status,
                scannedAt: scanRecord.scannedAt,
                scannerEngine: scanRecord.scannerEngine,
                malwareSignature: scanRecord.malwareSignature,
                scanError: scanRecord.scanError,
                attempts: scanRecord.scanAttempts
            } : null
        };
    }
    /**
   * Get storage quota for tenant
   */ async getStorageQuota(tenantId, plan = "basic") {
        const quotaGB = STORAGE_QUOTAS[plan] || STORAGE_QUOTAS.basic;
        const total = quotaGB * 1024 * 1024 * 1024;
        const prefix = `tenants/${tenantId}/`;
        const used = await this.storageProvider.getStorageUsage(prefix);
        return {
            total,
            used,
            available: total - used,
            usagePercentage: used / total * 100
        };
    }
    /**
   * Validate file before upload
   */ validateFile(file) {
        if (!file) {
            return {
                valid: false,
                error: "No file provided"
            };
        }
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            return {
                valid: false,
                error: `Unsupported file type: ${file.mimetype}`
            };
        }
        if (file.size > PLAN_LIMITS.basic) {
            return {
                valid: false,
                error: `Файл завеликий. Максимальний розмір: ${PLAN_LIMITS.basic / (1024 * 1024)} МБ`
            };
        }
        return {
            valid: true
        };
    }
    /**
   * Get allowed MIME types
   */ getAllowedMimeTypes() {
        return ALLOWED_MIME_TYPES;
    }
    /**
   * Get file size limit for a plan
   */ getFileSizeLimit(plan = "basic") {
        return PLAN_LIMITS[plan] || PLAN_LIMITS.basic;
    }
    /**
   * Build storage path
   */ buildStoragePath(tenantId, folder, caseId, clientId) {
        let path = `tenants/${tenantId}/`;
        if (folder) {
            path += `${folder}/`;
        }
        if (caseId) {
            path += `cases/${caseId}/`;
        }
        if (clientId) {
            path += `clients/${clientId}/`;
        }
        return path;
    }
    /**
   * Validate tenant access to storage path
   */ validateTenantAccess(storagePath, tenantId) {
        const tenantPrefix = `tenants/${tenantId}/`;
        if (!storagePath.startsWith(tenantPrefix)) {
            throw new _common.BadRequestException("Access denied to file");
        }
    }
    constructor(configService, storageProvider, fileScanService){
        this.configService = configService;
        this.storageProvider = storageProvider;
        this.fileScanService = fileScanService;
        this.logger = new _common.Logger(FileStorageService.name);
    }
};
FileStorageService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService,
        typeof _storageproviderservice.StorageProviderService === "undefined" ? Object : _storageproviderservice.StorageProviderService,
        typeof _filescanservice.FileScanService === "undefined" ? Object : _filescanservice.FileScanService
    ])
], FileStorageService);

//# sourceMappingURL=file-storage.service.js.map