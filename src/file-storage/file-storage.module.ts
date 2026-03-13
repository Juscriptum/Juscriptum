import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { Document } from "../database/entities/Document.entity";
import { FileScanRecord } from "../database/entities/FileScanRecord.entity";
import { FileStorageController } from "./controllers/file-storage.controller";
import { FileStorageService } from "./services/file-storage.service";
import { StorageProviderService } from "./services/storage-provider.service";
import { S3StorageService } from "./providers/s3-storage.service";
import { LocalStorageService } from "./providers/local-storage.service";
import { FileScanService } from "./services/file-scan.service";
import { MalwareScannerService } from "./services/malware-scanner.service";

/**
 * File Storage Module
 *
 * Provides unified file storage functionality supporting:
 * - S3/MinIO (production)
 * - Local filesystem (development)
 * - File upload/download/delete
 * - Signed URL generation
 * - File versioning
 * - Storage quotas
 */
@Module({
  imports: [
    ConfigModule,
    AuthModule,
    TypeOrmModule.forFeature([FileScanRecord, Document]),
  ],
  controllers: [FileStorageController],
  providers: [
    FileStorageService,
    FileScanService,
    MalwareScannerService,
    StorageProviderService,
    {
      provide: "StorageService",
      useFactory: (storageProviderService: StorageProviderService) => {
        return storageProviderService.getStorageService();
      },
      inject: [StorageProviderService],
    },
    S3StorageService,
    LocalStorageService,
  ],
  exports: [
    FileStorageService,
    FileScanService,
    MalwareScannerService,
    StorageProviderService,
    "StorageService",
  ],
})
export class FileStorageModule {}
