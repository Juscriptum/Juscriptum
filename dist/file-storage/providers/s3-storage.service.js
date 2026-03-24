"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "S3StorageService", {
    enumerable: true,
    get: function() {
        return S3StorageService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _clients3 = require("@aws-sdk/client-s3");
const _s3requestpresigner = require("@aws-sdk/s3-request-presigner");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let S3StorageService = class S3StorageService {
    /**
   * Upload file to S3
   */ async upload(options) {
        const key = `${options.path}${options.fileName}`;
        const command = new _clients3.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: options.buffer,
            ContentType: options.contentType,
            Metadata: options.metadata,
            ACL: options.isPublic ? "public-read" : "private"
        });
        const result = await this.s3Client.send(command);
        this.logger.log(`File uploaded: ${key}`);
        return {
            path: key,
            url: this.getPublicUrl(key),
            size: options.buffer.length,
            etag: result.ETag,
            versionId: result.VersionId
        };
    }
    /**
   * Download file from S3
   */ async download(options) {
        const command = new _clients3.GetObjectCommand({
            Bucket: this.bucket,
            Key: options.path,
            Range: options.range
        });
        const result = await this.s3Client.send(command);
        const buffer = await this.streamToBuffer(result.Body);
        return {
            buffer,
            contentType: result.ContentType || "application/octet-stream",
            contentLength: result.ContentLength || 0,
            lastModified: result.LastModified,
            etag: result.ETag
        };
    }
    /**
   * Delete file from S3
   */ async delete(path) {
        const command = new _clients3.DeleteObjectCommand({
            Bucket: this.bucket,
            Key: path
        });
        await this.s3Client.send(command);
        this.logger.log(`File deleted: ${path}`);
    }
    /**
   * Check if file exists in S3
   */ async exists(path) {
        try {
            const command = new _clients3.HeadObjectCommand({
                Bucket: this.bucket,
                Key: path
            });
            await this.s3Client.send(command);
            return true;
        } catch (error) {
            if (error instanceof Error && "name" in error && error.name === "NotFound") {
                return false;
            }
            throw error;
        }
    }
    /**
   * Get file metadata from S3
   */ async getMetadata(path) {
        const command = new _clients3.HeadObjectCommand({
            Bucket: this.bucket,
            Key: path
        });
        const result = await this.s3Client.send(command);
        return {
            fileName: path.split("/").pop() || path,
            contentType: result.ContentType || "application/octet-stream",
            size: result.ContentLength || 0,
            lastModified: result.LastModified || new Date(),
            metadata: result.Metadata,
            url: this.getPublicUrl(path)
        };
    }
    /**
   * Generate signed URL for temporary access
   */ async generateSignedUrl(options) {
        const command = new _clients3.GetObjectCommand({
            Bucket: this.bucket,
            Key: options.path,
            ResponseContentDisposition: options.disposition ? `${options.disposition}; filename="${options.path.split("/").pop()}"` : undefined,
            ResponseContentType: options.contentType
        });
        const expiresIn = options.expiresIn || 3600;
        const url = await (0, _s3requestpresigner.getSignedUrl)(this.s3Client, command, {
            expiresIn
        });
        return url;
    }
    /**
   * List all versions of a file
   */ async listVersions(path) {
        // This requires bucket versioning to be enabled
        // For now, return a single version
        const metadata = await this.getMetadata(path);
        return [
            {
                versionId: "null",
                path,
                size: metadata.size,
                lastModified: metadata.lastModified,
                isLatest: true
            }
        ];
    }
    /**
   * Copy file within S3
   */ async copy(sourcePath, destinationPath) {
        const command = new _clients3.CopyObjectCommand({
            Bucket: this.bucket,
            CopySource: `${this.bucket}/${sourcePath}`,
            Key: destinationPath
        });
        const result = await this.s3Client.send(command);
        return {
            path: destinationPath,
            url: this.getPublicUrl(destinationPath),
            size: 0,
            etag: result.CopyObjectResult?.ETag,
            versionId: result.VersionId
        };
    }
    /**
   * Move file within S3 (copy + delete)
   */ async move(sourcePath, destinationPath) {
        const result = await this.copy(sourcePath, destinationPath);
        await this.delete(sourcePath);
        return result;
    }
    /**
   * Delete multiple files from S3
   */ async deleteMultiple(paths) {
        // S3 allows deleting up to 1000 objects at a time
        const batchSize = 1000;
        for(let i = 0; i < paths.length; i += batchSize){
            const batch = paths.slice(i, i + batchSize);
            const command = new _clients3.DeleteObjectsCommand({
                Bucket: this.bucket,
                Delete: {
                    Objects: batch.map((path)=>({
                            Key: path
                        })),
                    Quiet: false
                }
            });
            await this.s3Client.send(command);
        }
        this.logger.log(`Deleted ${paths.length} files`);
    }
    /**
   * Get storage usage for a prefix (tenant)
   */ async getStorageUsage(prefix) {
        // This would require listing all objects under the prefix
        // For production, you might want to use CloudWatch metrics or maintain a counter
        // For now, return 0
        this.logger.warn(`Storage usage calculation not implemented for prefix: ${prefix}`);
        return 0;
    }
    /**
   * Convert stream to buffer
   */ async streamToBuffer(stream) {
        return new Promise((resolve, reject)=>{
            const chunks = [];
            stream.on("data", (chunk)=>chunks.push(chunk));
            stream.on("error", reject);
            stream.on("end", ()=>resolve(Buffer.concat(chunks)));
        });
    }
    /**
   * Get public URL for a file
   */ getPublicUrl(key) {
        const endpoint = this.configService.get("AWS_ENDPOINT");
        const cdnDomain = this.configService.get("CDN_DOMAIN");
        if (cdnDomain) {
            return `https://${cdnDomain}/${key}`;
        }
        if (endpoint) {
            return `${endpoint}/${this.bucket}/${key}`;
        }
        return `https://${this.bucket}.s3.amazonaws.com/${key}`;
    }
    constructor(configService){
        this.configService = configService;
        this.logger = new _common.Logger(S3StorageService.name);
        const endpoint = this.configService.get("AWS_ENDPOINT");
        const region = this.configService.get("AWS_REGION", "us-east-1");
        const accessKeyId = this.configService.get("AWS_ACCESS_KEY_ID");
        const secretAccessKey = this.configService.get("AWS_SECRET_ACCESS_KEY");
        this.bucket = this.configService.get("AWS_S3_BUCKET", "law-organizer-uploads");
        this.s3Client = new _clients3.S3Client({
            region,
            endpoint,
            credentials: {
                accessKeyId: accessKeyId || "",
                secretAccessKey: secretAccessKey || ""
            },
            forcePathStyle: !!endpoint
        });
        this.logger.log(`S3 Storage initialized with bucket: ${this.bucket}, endpoint: ${endpoint || "AWS S3"}`);
    }
};
S3StorageService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], S3StorageService);

//# sourceMappingURL=s3-storage.service.js.map