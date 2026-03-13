import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MulterModule } from "@nestjs/platform-express";
import { DocumentsController } from "./controllers/documents.controller";
import { ScanSessionsController } from "./controllers/scan-sessions.controller";
import { DocumentService } from "./services/document.service";
import { DocumentPdfProcessingWorkerService } from "./services/document-pdf-processing-worker.service";
import { PdfPostProcessingService } from "./services/pdf-post-processing.service";
import { ScanSessionService } from "./services/scan-session.service";
import { Document } from "../database/entities/Document.entity";
import { DocumentProcessingArtifact } from "../database/entities/DocumentProcessingArtifact.entity";
import { DocumentProcessingJob } from "../database/entities/DocumentProcessingJob.entity";
import { DocumentSignature } from "../database/entities/DocumentSignature.entity";
import { ScanPage } from "../database/entities/ScanPage.entity";
import { ScanSession } from "../database/entities/ScanSession.entity";
import { Case } from "../database/entities/Case.entity";
import { Client } from "../database/entities/Client.entity";
import { FileStorageModule } from "../file-storage/file-storage.module";
import { TrustVerificationModule } from "../trust-verification/trust-verification.module";

/**
 * Documents Module
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Document,
      DocumentProcessingJob,
      DocumentProcessingArtifact,
      DocumentSignature,
      ScanSession,
      ScanPage,
      Case,
      Client,
    ]),
    MulterModule.register({
      dest: "./uploads",
      limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB
      },
    }),
    FileStorageModule,
    TrustVerificationModule,
  ],
  controllers: [DocumentsController, ScanSessionsController],
  providers: [
    DocumentService,
    DocumentPdfProcessingWorkerService,
    ScanSessionService,
    PdfPostProcessingService,
  ],
  exports: [DocumentService],
})
export class DocumentsModule {}
