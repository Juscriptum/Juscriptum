import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ForbiddenException } from "@nestjs/common";
import { Repository } from "typeorm";
import { AuditService } from "../../auth/services/audit.service";
import { Document } from "../../database/entities/Document.entity";
import { FileScanRecord } from "../../database/entities/FileScanRecord.entity";
import { FileScanService } from "./file-scan.service";
import { MalwareScannerService } from "./malware-scanner.service";
import { StorageProviderService } from "./storage-provider.service";

describe("FileScanService", () => {
  let service: FileScanService;
  let fileScanRepository: jest.Mocked<Repository<FileScanRecord>>;
  let documentRepository: jest.Mocked<Repository<Document>>;
  let storageProviderService: jest.Mocked<StorageProviderService>;
  let malwareScannerService: jest.Mocked<MalwareScannerService>;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    const repositoryFactory = () => ({
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      update: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileScanService,
        {
          provide: getRepositoryToken(FileScanRecord),
          useFactory: repositoryFactory,
        },
        {
          provide: getRepositoryToken(Document),
          useFactory: repositoryFactory,
        },
        {
          provide: StorageProviderService,
          useValue: {
            download: jest.fn(),
          },
        },
        {
          provide: MalwareScannerService,
          useValue: {
            scanFile: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(FileScanService);
    fileScanRepository = module.get(getRepositoryToken(FileScanRecord));
    documentRepository = module.get(getRepositoryToken(Document));
    storageProviderService = module.get(StorageProviderService);
    malwareScannerService = module.get(MalwareScannerService);
    auditService = module.get(AuditService);
  });

  it("should create a pending scan record for a new upload", async () => {
    fileScanRepository.findOne.mockResolvedValue(null);
    fileScanRepository.create.mockImplementation(
      (value) => ({ id: "scan-1", ...value }) as any,
    );

    const record = await service.createPendingScanRecord({
      tenantId: "tenant-1",
      storagePath: "tenants/tenant-1/documents/file.pdf",
      fileName: "file.pdf",
      mimeType: "application/pdf",
    });

    expect(record.status).toBe("pending");
    expect(fileScanRepository.save).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalled();
  });

  it("should mark a file as infected when scanner detects malware", async () => {
    const record = Object.assign(new FileScanRecord(), {
      id: "scan-1",
      tenantId: "tenant-1",
      storagePath: "tenants/tenant-1/documents/eicar.txt",
      fileName: "eicar.txt",
      status: "pending",
      scanAttempts: 0,
      maxAttempts: 3,
      nextAttemptAt: new Date(),
      documentId: "document-1",
    });

    fileScanRepository.findOne.mockResolvedValue(record);
    fileScanRepository.save.mockImplementation(async (value: any) => value);
    storageProviderService.download.mockResolvedValue({
      buffer: Buffer.from(
        "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*",
      ),
      contentType: "text/plain",
      contentLength: 68,
    } as any);
    malwareScannerService.scanFile.mockResolvedValue({
      status: "infected",
      engine: "stub",
      signature: "EICAR-Test-File",
    });

    await service.processScan("scan-1");

    expect(fileScanRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "infected",
        malwareSignature: "EICAR-Test-File",
      }),
    );
    expect(documentRepository.update).toHaveBeenCalledWith(
      { id: "document-1", tenantId: "tenant-1" },
      expect.objectContaining({
        malwareScanStatus: "infected",
      }),
    );
  });

  it("should leave failed scans blocked from serving", async () => {
    fileScanRepository.findOne.mockResolvedValue(
      Object.assign(new FileScanRecord(), {
        id: "scan-2",
        tenantId: "tenant-1",
        storagePath: "tenants/tenant-1/documents/file.pdf",
        status: "failed",
      }),
    );

    await expect(
      service.assertFileIsSafe(
        "tenant-1",
        "tenants/tenant-1/documents/file.pdf",
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it("should mark a trusted internally generated file as clean", async () => {
    fileScanRepository.findOne.mockResolvedValue(null);
    fileScanRepository.create.mockImplementation(
      (value) => ({ id: "scan-3", ...value }) as any,
    );
    fileScanRepository.save.mockImplementation(async (value: any) => value);

    const record = await service.markFileAsClean({
      tenantId: "tenant-1",
      storagePath: "tenants/tenant-1/documents/scan.pdf",
      fileName: "Скан-120326-1510.pdf",
      mimeType: "application/pdf",
      documentId: "document-3",
      scannerEngine: "internal_scan_pdf",
      metadata: {
        sourceKind: "scan_session",
      },
    });

    expect(record.status).toBe("clean");
    expect(record.scannerEngine).toBe("internal_scan_pdf");
    expect(documentRepository.update).toHaveBeenCalledWith(
      { id: "document-3", tenantId: "tenant-1" },
      expect.objectContaining({
        malwareScanStatus: "clean",
        malwareScanner: "internal_scan_pdf",
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          event: "file_scan_marked_clean_internal",
        }),
      }),
    );
  });
});
