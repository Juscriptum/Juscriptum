"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _config = require("@nestjs/config");
const _common = require("@nestjs/common");
const _filescanservice = require("./file-scan.service");
const _filestorageservice = require("./file-storage.service");
const _storageproviderservice = require("./storage-provider.service");
describe("FileStorageService", ()=>{
    let service;
    let storageProviderService;
    let fileScanService;
    beforeEach(async ()=>{
        const module = await _testing.Test.createTestingModule({
            providers: [
                _filestorageservice.FileStorageService,
                {
                    provide: _config.ConfigService,
                    useValue: {
                        get: jest.fn((_, fallback)=>fallback)
                    }
                },
                {
                    provide: _storageproviderservice.StorageProviderService,
                    useValue: {
                        generateSignedUrl: jest.fn(),
                        download: jest.fn()
                    }
                },
                {
                    provide: _filescanservice.FileScanService,
                    useValue: {
                        assertFileIsSafe: jest.fn(),
                        createPendingScanRecord: jest.fn(),
                        getScanRecord: jest.fn()
                    }
                }
            ]
        }).compile();
        service = module.get(_filestorageservice.FileStorageService);
        storageProviderService = module.get(_storageproviderservice.StorageProviderService);
        fileScanService = module.get(_filescanservice.FileScanService);
    });
    it("should block signed URL generation while file scan is pending", async ()=>{
        fileScanService.assertFileIsSafe.mockRejectedValue(new _common.ForbiddenException("File is still pending malware scan"));
        await expect(service.generateSignedUrl("tenant-1", "tenants/tenant-1/documents/file.pdf")).rejects.toThrow(_common.ForbiddenException);
        expect(storageProviderService.generateSignedUrl).not.toHaveBeenCalled();
    });
});

//# sourceMappingURL=file-storage.service.spec.js.map