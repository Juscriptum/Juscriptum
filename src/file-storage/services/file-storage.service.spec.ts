import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { ForbiddenException } from "@nestjs/common";
import { FileScanService } from "./file-scan.service";
import { FileStorageService } from "./file-storage.service";
import { StorageProviderService } from "./storage-provider.service";

describe("FileStorageService", () => {
  let service: FileStorageService;
  let storageProviderService: jest.Mocked<StorageProviderService>;
  let fileScanService: jest.Mocked<FileScanService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileStorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_: string, fallback?: any) => fallback),
          },
        },
        {
          provide: StorageProviderService,
          useValue: {
            generateSignedUrl: jest.fn(),
            download: jest.fn(),
          },
        },
        {
          provide: FileScanService,
          useValue: {
            assertFileIsSafe: jest.fn(),
            createPendingScanRecord: jest.fn(),
            getScanRecord: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(FileStorageService);
    storageProviderService = module.get(StorageProviderService);
    fileScanService = module.get(FileScanService);
  });

  it("should block signed URL generation while file scan is pending", async () => {
    fileScanService.assertFileIsSafe.mockRejectedValue(
      new ForbiddenException("File is still pending malware scan"),
    );

    await expect(
      service.generateSignedUrl(
        "tenant-1",
        "tenants/tenant-1/documents/file.pdf",
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(storageProviderService.generateSignedUrl).not.toHaveBeenCalled();
  });
});
