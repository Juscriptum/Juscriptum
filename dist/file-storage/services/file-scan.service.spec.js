"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _typeorm = require("@nestjs/typeorm");
const _common = require("@nestjs/common");
const _auditservice = require("../../auth/services/audit.service");
const _Documententity = require("../../database/entities/Document.entity");
const _FileScanRecordentity = require("../../database/entities/FileScanRecord.entity");
const _filescanservice = require("./file-scan.service");
const _malwarescannerservice = require("./malware-scanner.service");
const _storageproviderservice = require("./storage-provider.service");
describe("FileScanService", ()=>{
    let service;
    let fileScanRepository;
    let documentRepository;
    let storageProviderService;
    let malwareScannerService;
    let auditService;
    beforeEach(async ()=>{
        const repositoryFactory = ()=>({
                findOne: jest.fn(),
                find: jest.fn(),
                create: jest.fn((value)=>value),
                save: jest.fn(async (value)=>value),
                update: jest.fn()
            });
        const module = await _testing.Test.createTestingModule({
            providers: [
                _filescanservice.FileScanService,
                {
                    provide: (0, _typeorm.getRepositoryToken)(_FileScanRecordentity.FileScanRecord),
                    useFactory: repositoryFactory
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_Documententity.Document),
                    useFactory: repositoryFactory
                },
                {
                    provide: _storageproviderservice.StorageProviderService,
                    useValue: {
                        download: jest.fn()
                    }
                },
                {
                    provide: _malwarescannerservice.MalwareScannerService,
                    useValue: {
                        scanFile: jest.fn()
                    }
                },
                {
                    provide: _auditservice.AuditService,
                    useValue: {
                        log: jest.fn()
                    }
                }
            ]
        }).compile();
        service = module.get(_filescanservice.FileScanService);
        fileScanRepository = module.get((0, _typeorm.getRepositoryToken)(_FileScanRecordentity.FileScanRecord));
        documentRepository = module.get((0, _typeorm.getRepositoryToken)(_Documententity.Document));
        storageProviderService = module.get(_storageproviderservice.StorageProviderService);
        malwareScannerService = module.get(_malwarescannerservice.MalwareScannerService);
        auditService = module.get(_auditservice.AuditService);
    });
    it("should create a pending scan record for a new upload", async ()=>{
        fileScanRepository.findOne.mockResolvedValue(null);
        fileScanRepository.create.mockImplementation((value)=>({
                id: "scan-1",
                ...value
            }));
        const record = await service.createPendingScanRecord({
            tenantId: "tenant-1",
            storagePath: "tenants/tenant-1/documents/file.pdf",
            fileName: "file.pdf",
            mimeType: "application/pdf"
        });
        expect(record.status).toBe("pending");
        expect(fileScanRepository.save).toHaveBeenCalled();
        expect(auditService.log).toHaveBeenCalled();
    });
    it("should mark a file as infected when scanner detects malware", async ()=>{
        const record = Object.assign(new _FileScanRecordentity.FileScanRecord(), {
            id: "scan-1",
            tenantId: "tenant-1",
            storagePath: "tenants/tenant-1/documents/eicar.txt",
            fileName: "eicar.txt",
            status: "pending",
            scanAttempts: 0,
            maxAttempts: 3,
            nextAttemptAt: new Date(),
            documentId: "document-1"
        });
        fileScanRepository.findOne.mockResolvedValue(record);
        fileScanRepository.save.mockImplementation(async (value)=>value);
        storageProviderService.download.mockResolvedValue({
            buffer: Buffer.from("X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"),
            contentType: "text/plain",
            contentLength: 68
        });
        malwareScannerService.scanFile.mockResolvedValue({
            status: "infected",
            engine: "stub",
            signature: "EICAR-Test-File"
        });
        await service.processScan("scan-1");
        expect(fileScanRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            status: "infected",
            malwareSignature: "EICAR-Test-File"
        }));
        expect(documentRepository.update).toHaveBeenCalledWith({
            id: "document-1",
            tenantId: "tenant-1"
        }, expect.objectContaining({
            malwareScanStatus: "infected"
        }));
    });
    it("should leave failed scans blocked from serving", async ()=>{
        fileScanRepository.findOne.mockResolvedValue(Object.assign(new _FileScanRecordentity.FileScanRecord(), {
            id: "scan-2",
            tenantId: "tenant-1",
            storagePath: "tenants/tenant-1/documents/file.pdf",
            status: "failed"
        }));
        await expect(service.assertFileIsSafe("tenant-1", "tenants/tenant-1/documents/file.pdf")).rejects.toThrow(_common.ForbiddenException);
    });
    it("should mark a trusted internally generated file as clean", async ()=>{
        fileScanRepository.findOne.mockResolvedValue(null);
        fileScanRepository.create.mockImplementation((value)=>({
                id: "scan-3",
                ...value
            }));
        fileScanRepository.save.mockImplementation(async (value)=>value);
        const record = await service.markFileAsClean({
            tenantId: "tenant-1",
            storagePath: "tenants/tenant-1/documents/scan.pdf",
            fileName: "Скан-120326-1510.pdf",
            mimeType: "application/pdf",
            documentId: "document-3",
            scannerEngine: "internal_scan_pdf",
            metadata: {
                sourceKind: "scan_session"
            }
        });
        expect(record.status).toBe("clean");
        expect(record.scannerEngine).toBe("internal_scan_pdf");
        expect(documentRepository.update).toHaveBeenCalledWith({
            id: "document-3",
            tenantId: "tenant-1"
        }, expect.objectContaining({
            malwareScanStatus: "clean",
            malwareScanner: "internal_scan_pdf"
        }));
        expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
            metadata: expect.objectContaining({
                event: "file_scan_marked_clean_internal"
            })
        }));
    });
});

//# sourceMappingURL=file-scan.service.spec.js.map