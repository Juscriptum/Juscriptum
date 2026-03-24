"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "StorageProviderService", {
    enumerable: true,
    get: function() {
        return StorageProviderService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _s3storageservice = require("../providers/s3-storage.service");
const _localstorageservice = require("../providers/local-storage.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let StorageProviderService = class StorageProviderService {
    /**
   * Get the storage provider type
   */ getProviderType() {
        const provider = this.configService.get("STORAGE_PROVIDER", "local");
        return provider;
    }
    /**
   * Get the appropriate storage service
   */ getStorageService() {
        const provider = this.configService.get("STORAGE_PROVIDER", "local");
        switch(provider){
            case "s3":
                return this.s3StorageService;
            case "local":
            default:
                return this.localStorageService;
        }
    }
    isDevS3FallbackEnabled() {
        const provider = this.configService.get("STORAGE_PROVIDER", "local");
        const nodeEnv = this.configService.get("NODE_ENV", "development");
        return provider === "s3" && nodeEnv !== "production";
    }
    shouldFallbackToLocal(error) {
        if (!this.isDevS3FallbackEnabled()) {
            return false;
        }
        const code = error && typeof error === "object" && "code" in error ? String(error.code || "") : "";
        return [
            "ENOTFOUND",
            "ECONNREFUSED",
            "ECONNRESET",
            "ETIMEDOUT"
        ].includes(code);
    }
    async withProviderFallback(operation, action) {
        try {
            return await action(this.provider);
        } catch (error) {
            if (!this.shouldFallbackToLocal(error)) {
                throw error;
            }
            this.logger.warn(`Storage provider ${this.getProviderType()} failed during ${operation}; falling back to local storage for development`);
            return action(this.localStorageService);
        }
    }
    /**
   * Upload a file
   */ async upload(options) {
        return this.withProviderFallback("upload", (provider)=>provider.upload(options));
    }
    /**
   * Download a file
   */ async download(options) {
        return this.withProviderFallback("download", (provider)=>provider.download(options));
    }
    /**
   * Delete a file
   */ async delete(path) {
        return this.withProviderFallback("delete", (provider)=>provider.delete(path));
    }
    /**
   * Check if a file exists
   */ async exists(path) {
        return this.withProviderFallback("exists", (provider)=>provider.exists(path));
    }
    /**
   * Get file metadata
   */ async getMetadata(path) {
        return this.withProviderFallback("getMetadata", (provider)=>provider.getMetadata(path));
    }
    /**
   * Generate a signed URL
   */ async generateSignedUrl(options) {
        return this.withProviderFallback("generateSignedUrl", (provider)=>provider.generateSignedUrl(options));
    }
    /**
   * List file versions
   */ async listVersions(path) {
        return this.withProviderFallback("listVersions", (provider)=>provider.listVersions(path));
    }
    /**
   * Copy a file
   */ async copy(sourcePath, destinationPath) {
        return this.withProviderFallback("copy", (provider)=>provider.copy(sourcePath, destinationPath));
    }
    /**
   * Move a file
   */ async move(sourcePath, destinationPath) {
        return this.withProviderFallback("move", (provider)=>provider.move(sourcePath, destinationPath));
    }
    /**
   * Delete multiple files
   */ async deleteMultiple(paths) {
        return this.withProviderFallback("deleteMultiple", (provider)=>provider.deleteMultiple(paths));
    }
    /**
   * Get storage usage for a prefix
   */ async getStorageUsage(prefix) {
        return this.withProviderFallback("getStorageUsage", (provider)=>provider.getStorageUsage(prefix));
    }
    constructor(configService, s3StorageService, localStorageService){
        this.configService = configService;
        this.s3StorageService = s3StorageService;
        this.localStorageService = localStorageService;
        this.logger = new _common.Logger(StorageProviderService.name);
        this.provider = this.getStorageService();
        this.logger.log(`Storage provider initialized: ${this.getProviderType()}`);
    }
};
StorageProviderService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService,
        typeof _s3storageservice.S3StorageService === "undefined" ? Object : _s3storageservice.S3StorageService,
        typeof _localstorageservice.LocalStorageService === "undefined" ? Object : _localstorageservice.LocalStorageService
    ])
], StorageProviderService);

//# sourceMappingURL=storage-provider.service.js.map