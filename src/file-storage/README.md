# File Storage Module

Complete file storage solution for the Law Organizer platform with support for S3/MinIO and local filesystem storage.

## Overview

The File Storage module provides a unified interface for file operations including upload, download, delete, and signed URL generation. It supports multiple storage providers and is designed for production use with proper error handling, validation, and security.

## Features

- **Multi-Provider Support**: S3/MinIO for production, local filesystem for development
- **File Validation**: MIME type and size validation with plan-based limits
- **Signed URLs**: Time-limited access URLs for secure file sharing
- **Tenant Isolation**: Automatic tenant prefixing for multi-tenant architecture
- **Storage Quotas**: Plan-based storage limits with usage tracking
- **Versioning**: Support for file version history
- **Bulk Operations**: Upload and delete multiple files at once
- **Copy/Move**: File management operations

## Architecture

### Module Structure

```
src/file-storage/
├── file-storage.module.ts          # Module definition
├── controllers/
│   └── file-storage.controller.ts  # REST API endpoints
├── services/
│   ├── file-storage.service.ts     # High-level business logic
│   └── storage-provider.service.ts # Provider selection
├── providers/
│   ├── s3-storage.service.ts       # S3/MinIO implementation
│   └── local-storage.service.ts   # Local filesystem implementation
├── interfaces/
│   └── file-storage.interfaces.ts  # TypeScript interfaces
└── dto/
    └── file-storage.dto.ts         # Data transfer objects
```

### Storage Providers

#### S3 Storage Service

Production-ready S3-compatible storage supporting:
- AWS S3
- MinIO (self-hosted)
- DigitalOcean Spaces
- Wasabi
- Any S3-compatible storage

**Features:**
- Presigned URLs for temporary access
- Multi-part upload support
- ETag validation
- Custom metadata
- ACL management
- Versioning support

#### Local Storage Service

Development-focused local filesystem storage:
- File-based storage
- Directory structure mirroring S3 paths
- Public URL generation
- Recursive directory operations
- Size calculation

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `STORAGE_PROVIDER` | Storage provider type (`s3` or `local`) | `s3` |
| `AWS_S3_BUCKET` | S3 bucket name | `law-organizer-uploads` |
| `AWS_ACCESS_KEY_ID` | S3 access key | `minioadmin` |
| `AWS_SECRET_ACCESS_KEY` | S3 secret key | `minioadmin` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_ENDPOINT` | Custom S3 endpoint (for MinIO) | `http://minio:9000` |
| `CDN_DOMAIN` | CDN domain for public URLs | - |
| `LOCAL_STORAGE_DIR` | Local storage directory | `./storage` |
| `LOCAL_STORAGE_URL` | Base URL for local files | `http://localhost:3000/storage` |

### Docker Compose

The module includes MinIO service configuration in `docker-compose.yml`:

```yaml
minio:
  image: minio/minio:latest
  command: server /data --console-address ":9001"
  ports:
    - "9000:9000"  # API
    - "9001:9001"  # Console UI
  volumes:
    - minio_data:/data
```

## API Endpoints

### Upload

#### Single File Upload

```
POST /file-storage/upload
Content-Type: multipart/form-data

Query Parameters:
- caseId: string (optional)
- clientId: string (optional)
- folder: string (optional)
- isPublic: boolean (optional)

Body:
- file: File (required)

Response:
{
  "path": "tenants/{tenantId}/documents/{fileName}",
  "url": "https://...",
  "size": 123456,
  "etag": "...",
  "versionId": "..."
}
```

#### Bulk File Upload

```
POST /file-storage/upload/bulk
Content-Type: multipart/form-data

Query Parameters:
- caseId: string (optional)
- clientId: string (optional)
- folder: string (optional)
- isPublic: boolean (optional)

Body:
- files: File[] (up to 10 files)

Response:
{
  "success": [...],
  "failed": [...]
}
```

### Download

#### Direct Download

```
GET /file-storage/download/:path

Response:
- File stream with Content-Disposition header
```

#### Signed URL Generation

```
GET /file-storage/signed-url

Query Parameters:
- path: string (required)
- expiresIn: number (optional, default: 3600 seconds)
- disposition: 'attachment' | 'inline' (optional)
- contentType: string (optional)

Response:
{
  "url": "https://...",
  "expiresAt": "2024-01-01T00:00:00.000Z"
}
```

### File Management

#### Delete File

```
DELETE /file-storage/file/:path

Response: 204 No Content
```

#### Delete Multiple Files

```
DELETE /file-storage/files

Body:
{
  "paths": ["path1", "path2", ...]
}

Response: 204 No Content
```

#### Copy File

```
POST /file-storage/copy

Body:
{
  "sourcePath": "source",
  "destinationPath": "destination"
}

Response:
{
  "path": "...",
  "url": "...",
  "size": 123456
}
```

#### Move File

```
POST /file-storage/move

Body:
{
  "sourcePath": "source",
  "destinationPath": "destination"
}

Response:
{
  "path": "...",
  "url": "...",
  "size": 123456
}
```

### Metadata & Status

#### Check File Exists

```
GET /file-storage/exists/:path

Response:
{
  "exists": true
}
```

#### Get File Metadata

```
GET /file-storage/metadata/:path

Response:
{
  "fileName": "...",
  "contentType": "application/pdf",
  "size": 123456,
  "lastModified": "2024-01-01T00:00:00.000Z",
  "url": "https://..."
}
```

#### Get Storage Quota

```
GET /file-storage/quota

Query Parameters:
- plan: 'basic' | 'professional' | 'enterprise' (optional)

Response:
{
  "total": 1073741824,
  "used": 536870912,
  "available": 536870912,
  "usagePercentage": 50.0
}
```

#### Get Configuration

```
GET /file-storage/config

Query Parameters:
- plan: 'basic' | 'professional' | 'enterprise' (optional)

Response:
{
  "allowedMimeTypes": ["application/pdf", ...],
  "fileSizeLimit": 52428800
}
```

## File Validation

### Allowed MIME Types

- `application/pdf`
- `application/msword` (.doc)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx)
- `application/vnd.ms-excel` (.xls)
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (.xlsx)
- `image/jpeg` (.jpg, .jpeg)
- `image/png` (.png)
- `image/gif` (.gif)

### File Size Limits by Plan

| Plan | Max File Size | Storage Quota |
|------|--------------|---------------|
| Basic | 10 MB | 1 GB |
| Professional | 50 MB | 10 GB |
| Enterprise | 100 MB | 100 GB |

## Usage Examples

### Using the Service in Other Modules

```typescript
import { FileStorageService } from '../file-storage/services/file-storage.service';

@Injectable()
export class YourService {
  constructor(
    private readonly fileStorageService: FileStorageService,
  ) {}

  async uploadDocument(
    tenantId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    const result = await this.fileStorageService.uploadFile(
      tenantId,
      userId,
      file,
      {
        caseId: 'case-123',
        folder: 'documents',
        isPublic: false,
      },
    );

    return result;
  }

  async generateDownloadLink(
    tenantId: string,
    storagePath: string,
  ) {
    const url = await this.fileStorageService.generateSignedUrl(
      tenantId,
      storagePath,
      {
        expiresIn: 86400, // 24 hours
        disposition: 'attachment',
      },
    );

    return { url };
  }
}
```

### Direct API Usage (Frontend)

```typescript
// Upload file
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/file-storage/upload?caseId=123', {
  method: 'POST',
  body: formData,
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const result = await response.json();

// Generate signed URL
const { url } = await fetch(
  `/api/file-storage/signed-url?path=${encodeURIComponent(result.path)}&expiresIn=3600`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
).then(res => res.json());

window.open(url, '_blank');
```

## Storage Path Structure

Files are organized in the following structure:

```
{tenantId}/
  documents/
    cases/{caseId}/{fileName}
    clients/{clientId}/{fileName}
  invoices/
  contracts/
  ...
```

Example path: `tenants/123e4567-e89b-12d3-a456-426614174000/documents/cases/abc123/abc123.pdf`

## Security

### Tenant Isolation

All file operations automatically validate tenant access. The service ensures that:

1. Files can only be uploaded to the tenant's directory
2. Files can only be accessed within the tenant's directory
3. Signed URLs are tenant-specific
4. Quota calculations are tenant-specific

### Signed URL Security

- URLs are generated with expiration times
- URLs are signed with AWS SigV4 (for S3) or timestamp verification
- URLs include tenant validation
- URLs can be revoked by file deletion

## Error Handling

The module provides detailed error messages:

- `BadRequestException`: Invalid file type, file too large, invalid path
- `NotFoundException`: File not found
- `ForbiddenException`: Access denied (wrong tenant)

## Integration with Documents Module

The Documents module has been updated to use the File Storage service:

1. **Upload**: Documents are uploaded using the file storage service
2. **Storage Path**: Stored in `Document.entity.storagePath`
3. **CDN URL**: Generated and stored in `Document.entity.cdnUrl`
4. **Signed URLs**: Generated for secure document access
5. **Deletion**: Files are deleted from storage when document is deleted

## Development

### Using Local Storage

For local development, set:

```bash
STORAGE_PROVIDER=local
LOCAL_STORAGE_DIR=./storage
LOCAL_STORAGE_URL=http://localhost:3000/storage
```

### Using MinIO

For local MinIO (default with docker-compose):

```bash
STORAGE_PROVIDER=s3
AWS_ENDPOINT=http://minio:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
```

Access MinIO Console: http://localhost:9001

### Using AWS S3

For production AWS S3:

```bash
STORAGE_PROVIDER=s3
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
CDN_DOMAIN=cdn.yourdomain.com
```

## Monitoring

### Storage Usage

Track storage usage per tenant:

```typescript
const quota = await fileStorageService.getStorageQuota(tenantId, 'professional');
console.log(`Used: ${quota.used} / ${quota.total} (${quota.usagePercentage}%)`);
```

### Logging

The module includes comprehensive logging:

- File uploads with metadata
- File deletions
- Storage quota warnings
- Error details

## Testing

To test the file storage functionality:

1. Start the application with MinIO
2. Access MinIO Console: http://localhost:9001
3. Use API endpoints or integrate with Documents module
4. Verify files are stored in the correct bucket structure

## Troubleshooting

### File Upload Fails

- Check file size limits (plan-based)
- Verify MIME type is allowed
- Ensure tenant ID is valid
- Check storage provider connectivity

### Signed URL Not Working

- Verify AWS credentials (if using S3)
- Check MinIO is running (if using local MinIO)
- Ensure expiration time hasn't passed
- Verify bucket/region configuration

### Quota Issues

- Check current storage usage
- Verify plan configuration
- Clean up old/unused files
- Consider upgrading plan

## Future Enhancements

- Thumbnail generation for images
- Video transcoding support
- OCR for document text extraction
- File virus scanning lifecycle with persistent scan records and blocked serving until `clean`
- Multi-region replication
- CDN integration (CloudFront, Cloudflare)
- Advanced compression options
- Webhook notifications for file events
