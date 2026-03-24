"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LocalStorageService", {
    enumerable: true,
    get: function() {
        return LocalStorageService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _fs = require("fs");
const _path = require("path");
const _promises = require("node:fs/promises");
const _promises1 = require("node:stream/promises");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let LocalStorageService = class LocalStorageService {
    /**
   * Upload file to local filesystem
   */ async upload(options) {
        const fullPath = (0, _path.join)(this.baseDir, options.path);
        const filePath = (0, _path.join)(fullPath, options.fileName);
        await _fs.promises.mkdir(fullPath, {
            recursive: true
        });
        await _fs.promises.writeFile(filePath, options.buffer);
        this.logger.log(`File uploaded: ${filePath}`);
        return {
            path: `${options.path}${options.fileName}`,
            url: this.getPublicUrl(options.path, options.fileName),
            size: options.buffer.length
        };
    }
    /**
   * Download file from local filesystem
   */ async download(options) {
        const filePath = (0, _path.join)(this.baseDir, options.path);
        const stats = await (0, _promises.stat)(filePath);
        const buffer = await _fs.promises.readFile(filePath);
        return {
            buffer,
            contentType: this.getMimeType(options.path),
            contentLength: stats.size,
            lastModified: stats.mtime
        };
    }
    /**
   * Delete file from local filesystem
   */ async delete(path) {
        const filePath = (0, _path.join)(this.baseDir, path);
        await (0, _promises.unlink)(filePath);
        this.logger.log(`File deleted: ${filePath}`);
    }
    /**
   * Check if file exists
   */ async exists(path) {
        try {
            await (0, _promises.stat)((0, _path.join)(this.baseDir, path));
            return true;
        } catch  {
            return false;
        }
    }
    /**
   * Get file metadata
   */ async getMetadata(path) {
        const filePath = (0, _path.join)(this.baseDir, path);
        const stats = await (0, _promises.stat)(filePath);
        return {
            fileName: path.split("/").pop() || path,
            contentType: this.getMimeType(path),
            size: stats.size,
            lastModified: stats.mtime,
            url: this.getPublicUrl(path.split("/").slice(0, -1).join("/"), path.split("/").pop() || "")
        };
    }
    /**
   * Generate signed URL (not applicable for local storage, returns public URL)
   */ async generateSignedUrl(options) {
        // Local storage doesn't support signed URLs
        // Return the public URL with timestamp query param for logging
        const fileName = options.path.split("/").pop();
        const path = options.path.split("/").slice(0, -1).join("/");
        return `${this.getPublicUrl(path, fileName || "")}?expires=${Date.now() + (options.expiresIn || 3600) * 1000}`;
    }
    /**
   * List file versions (not supported for local storage)
   */ async listVersions(path) {
        const metadata = await this.getMetadata(path);
        return [
            {
                versionId: "1",
                path,
                size: metadata.size,
                lastModified: metadata.lastModified,
                isLatest: true
            }
        ];
    }
    /**
   * Copy file
   */ async copy(sourcePath, destinationPath) {
        const sourceFilePath = (0, _path.join)(this.baseDir, sourcePath);
        const destDir = (0, _path.join)(this.baseDir, destinationPath.split("/").slice(0, -1).join("/"));
        const destFileName = destinationPath.split("/").pop() || "";
        const destFilePath = (0, _path.join)(this.baseDir, destinationPath);
        await (0, _promises.mkdir)(destDir, {
            recursive: true
        });
        await (0, _promises1.pipeline)((0, _fs.createReadStream)(sourceFilePath), (0, _fs.createWriteStream)(destFilePath));
        return {
            path: destinationPath,
            url: this.getPublicUrl(destinationPath.split("/").slice(0, -1).join("/"), destFileName),
            size: (await (0, _promises.stat)(destFilePath)).size
        };
    }
    /**
   * Move file
   */ async move(sourcePath, destinationPath) {
        const result = await this.copy(sourcePath, destinationPath);
        await this.delete(sourcePath);
        return result;
    }
    /**
   * Delete multiple files
   */ async deleteMultiple(paths) {
        await Promise.all(paths.map((path)=>this.delete(path)));
        this.logger.log(`Deleted ${paths.length} files`);
    }
    /**
   * Get storage usage for a prefix
   */ async getStorageUsage(prefix) {
        const dir = (0, _path.join)(this.baseDir, prefix);
        let totalSize = 0;
        try {
            const files = await _fs.promises.readdir(dir, {
                recursive: true
            });
            for (const file of files){
                try {
                    const filePath = (0, _path.join)(dir, file);
                    const stats = await (0, _promises.stat)(filePath);
                    if (stats.isFile()) {
                        totalSize += stats.size;
                    }
                } catch  {
                // Skip files that can't be accessed
                }
            }
        } catch  {
        // Directory doesn't exist
        }
        return totalSize;
    }
    /**
   * Ensure base directory exists
   */ async ensureBaseDir() {
        try {
            await _fs.promises.mkdir(this.baseDir, {
                recursive: true
            });
        } catch (error) {
            this.logger.error(`Failed to create base directory: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
   * Get public URL for a file
   */ getPublicUrl(path, fileName) {
        const normalizedPath = `${path}${fileName}`.replace(/^\/+/, "");
        return `${this.baseUrl}/${normalizedPath}`;
    }
    normalizeBaseUrl(value) {
        const trimmed = value.trim();
        if (/^https?:\/\//i.test(trimmed)) {
            return trimmed.replace(/\/+$/, "");
        }
        return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
    }
    /**
   * Get MIME type from file extension
   */ getMimeType(path) {
        const ext = path.split(".").pop()?.toLowerCase() || "";
        const mimeTypes = {
            pdf: "application/pdf",
            doc: "application/msword",
            docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            xls: "application/vnd.ms-excel",
            xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            gif: "image/gif"
        };
        return mimeTypes[ext] || "application/octet-stream";
    }
    constructor(configService){
        this.configService = configService;
        this.logger = new _common.Logger(LocalStorageService.name);
        this.baseDir = this.configService.get("LOCAL_STORAGE_DIR", "./storage") || "./storage";
        this.baseUrl = this.normalizeBaseUrl(this.configService.get("LOCAL_STORAGE_URL", "/storage") || "/storage");
        this.ensureBaseDir();
        this.logger.log(`Local Storage initialized at: ${this.baseDir}`);
    }
};
LocalStorageService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], LocalStorageService);

//# sourceMappingURL=local-storage.service.js.map