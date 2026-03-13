import { Test, TestingModule } from "@nestjs/testing";
import { TrustVerificationService } from "./trust-verification.service";
import { TrustVerificationWorkerService } from "./trust-verification-worker.service";

describe("TrustVerificationWorkerService", () => {
  let service: TrustVerificationWorkerService;
  let trustVerificationService: jest.Mocked<TrustVerificationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrustVerificationWorkerService,
        {
          provide: TrustVerificationService,
          useValue: {
            processDueJobs: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TrustVerificationWorkerService);
    trustVerificationService = module.get(TrustVerificationService);
  });

  it("should process due trust verification jobs on schedule", async () => {
    trustVerificationService.processDueJobs.mockResolvedValue(2);

    await service.processPendingJobs();

    expect(trustVerificationService.processDueJobs).toHaveBeenCalled();
  });
});
