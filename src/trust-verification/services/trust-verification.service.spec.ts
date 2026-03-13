import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditService } from "../../auth/services/audit.service";
import { DocumentSignature } from "../../database/entities/DocumentSignature.entity";
import { TrustVerificationJob } from "../../database/entities/TrustVerificationJob.entity";
import { UserIdentity } from "../../database/entities/UserIdentity.entity";
import { TrustVerificationService } from "./trust-verification.service";
import { TrustProviderRegistry } from "./trust-provider.registry";
import { TrustVerificationOutcome } from "./trust-provider.adapters";
import { TrustCallbackAuthService } from "./trust-callback-auth.service";

describe("TrustVerificationService", () => {
  let service: TrustVerificationService;
  let userIdentityRepository: jest.Mocked<Repository<UserIdentity>>;
  let documentSignatureRepository: jest.Mocked<Repository<DocumentSignature>>;
  let verificationJobRepository: jest.Mocked<Repository<TrustVerificationJob>>;
  let providerRegistry: jest.Mocked<TrustProviderRegistry>;
  let auditService: jest.Mocked<AuditService>;
  let trustCallbackAuthService: jest.Mocked<TrustCallbackAuthService>;

  const mockTenantId = "tenant-1";
  const mockUserId = "user-1";

  const mockProvider = {
    verifySignature: jest.fn<Promise<TrustVerificationOutcome>, any[]>(),
    verifyIdentity: jest.fn<Promise<TrustVerificationOutcome>, any[]>(),
    handleCallback: jest.fn<Promise<TrustVerificationOutcome>, any[]>(),
  };

  beforeEach(async () => {
    const repositoryFactory = () => ({
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrustVerificationService,
        {
          provide: getRepositoryToken(UserIdentity),
          useFactory: repositoryFactory,
        },
        {
          provide: getRepositoryToken(DocumentSignature),
          useFactory: repositoryFactory,
        },
        {
          provide: getRepositoryToken(TrustVerificationJob),
          useFactory: repositoryFactory,
        },
        {
          provide: TrustProviderRegistry,
          useValue: {
            getProvider: jest.fn(() => mockProvider),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: TrustCallbackAuthService,
          useValue: {
            assertAuthenticCallback: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TrustVerificationService);
    userIdentityRepository = module.get(getRepositoryToken(UserIdentity));
    documentSignatureRepository = module.get(
      getRepositoryToken(DocumentSignature),
    );
    verificationJobRepository = module.get(
      getRepositoryToken(TrustVerificationJob),
    );
    providerRegistry = module.get(TrustProviderRegistry);
    auditService = module.get(AuditService);
    trustCallbackAuthService = module.get(TrustCallbackAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create pending identity verification and queue a verification job", async () => {
    userIdentityRepository.findOne.mockResolvedValue(null);
    verificationJobRepository.create.mockImplementation(
      (value) => ({ id: "job-1", ...value }) as any,
    );

    const identityEntity = Object.assign(new UserIdentity(), {
      id: "identity-1",
      tenantId: mockTenantId,
      userId: mockUserId,
      provider: "diia",
      status: "pending",
      externalSubjectId: "subject-1",
    });
    userIdentityRepository.create.mockReturnValue(identityEntity);
    userIdentityRepository.save.mockResolvedValue(identityEntity);

    await service.requestIdentityVerification(mockTenantId, mockUserId, {
      provider: "diia",
      externalSubjectId: "subject-1",
      assuranceLevel: "substantial",
    });

    expect(userIdentityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "diia",
        status: "pending",
      }),
    );
    expect(verificationJobRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        subjectType: "user_identity",
        subjectId: "identity-1",
        provider: "diia",
        jobKind: "verify",
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "UserIdentity",
      }),
    );
  });

  it("should verify a document signature job and schedule recheck", async () => {
    const signature = Object.assign(new DocumentSignature(), {
      id: "signature-1",
      tenantId: mockTenantId,
      documentId: "document-1",
      userId: mockUserId,
      provider: "acsk",
      verificationStatus: "pending",
      signatureHash: "sig-hash",
      signedPayloadHash: "payload-hash",
      certificateSerialNumber: "cert-1",
      certificateIssuer: "issuer-1",
      metadata: {},
    });
    const job = Object.assign(new TrustVerificationJob(), {
      id: "job-1",
      tenantId: mockTenantId,
      subjectType: "document_signature",
      subjectId: "signature-1",
      provider: "acsk",
      jobKind: "verify",
      status: "queued",
      attemptCount: 0,
      maxAttempts: 3,
      nextAttemptAt: new Date(),
      payload: null,
    });

    verificationJobRepository.findOne
      .mockResolvedValueOnce(job)
      .mockResolvedValueOnce(null);
    documentSignatureRepository.findOne.mockResolvedValue(signature);
    verificationJobRepository.save.mockImplementation(
      async (value: any) => value,
    );
    documentSignatureRepository.save.mockImplementation(
      async (value: any) => value,
    );
    mockProvider.verifySignature.mockResolvedValue({
      status: "verified",
      externalVerificationId: "cert-1",
      nextCheckAt: new Date(Date.now() + 60_000),
      metadata: { providerMode: "stub" },
    });

    await service.processJob("job-1");

    expect(mockProvider.verifySignature).toHaveBeenCalledWith(signature);
    expect(documentSignatureRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        verificationStatus: "verified",
        verificationAttempts: 1,
        externalVerificationId: "cert-1",
      }),
    );
    expect(verificationJobRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
      }),
    );
    expect(verificationJobRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        jobKind: "recheck",
        subjectId: "signature-1",
      }),
    );
  });

  it("should mark callback-driven revocation on a user identity", async () => {
    const identity = Object.assign(new UserIdentity(), {
      id: "identity-1",
      tenantId: mockTenantId,
      userId: mockUserId,
      provider: "bankid_nbu",
      status: "verified",
      externalSubjectId: "subject-1",
      metadata: {},
    });
    const callbackJob = Object.assign(new TrustVerificationJob(), {
      id: "job-2",
      tenantId: mockTenantId,
      subjectType: "user_identity",
      subjectId: "identity-1",
      provider: "bankid_nbu",
      jobKind: "callback",
      status: "queued",
      attemptCount: 0,
      maxAttempts: 3,
      nextAttemptAt: new Date(),
      payload: {
        event: "revoked",
        reason: "provider revoked identity",
      },
    });

    verificationJobRepository.findOne.mockResolvedValue(callbackJob);
    userIdentityRepository.findOne.mockResolvedValue(identity);
    verificationJobRepository.save.mockImplementation(
      async (value: any) => value,
    );
    userIdentityRepository.save.mockImplementation(async (value: any) => value);
    mockProvider.handleCallback.mockResolvedValue({
      status: "revoked",
      reason: "provider revoked identity",
      metadata: { callback: true },
    });

    await service.processJob("job-2");

    expect(mockProvider.handleCallback).toHaveBeenCalled();
    expect(userIdentityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "revoked",
        lastError: "provider revoked identity",
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "UserIdentity",
        action: "revoke",
      }),
    );
  });

  it("should validate signed provider callbacks before queueing a callback job", async () => {
    const identity = Object.assign(new UserIdentity(), {
      id: "identity-3",
      tenantId: mockTenantId,
      userId: mockUserId,
      provider: "diia",
      status: "pending",
    });
    userIdentityRepository.findOne.mockResolvedValue(identity);
    verificationJobRepository.create.mockImplementation(
      (value) => ({ id: "job-callback-1", ...value }) as any,
    );

    await service.handleProviderCallback(
      {
        provider: "diia",
        subjectType: "user_identity",
        subjectId: "identity-3",
        event: "verified",
        externalVerificationId: "provider-ref-1",
      },
      {
        signature: "signature",
        timestamp: "1710000000",
        nonce: "nonce-1",
      },
    );

    expect(
      trustCallbackAuthService.assertAuthenticCallback,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "diia",
        signature: "signature",
        nonce: "nonce-1",
      }),
    );
    expect(verificationJobRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        jobKind: "callback",
        provider: "diia",
      }),
    );
  });

  it("should retry failed verification jobs while attempts remain", async () => {
    const identity = Object.assign(new UserIdentity(), {
      id: "identity-2",
      tenantId: mockTenantId,
      userId: mockUserId,
      provider: "diia",
      status: "pending",
      externalSubjectId: "subject-2",
      metadata: {},
    });
    const job = Object.assign(new TrustVerificationJob(), {
      id: "job-3",
      tenantId: mockTenantId,
      subjectType: "user_identity",
      subjectId: "identity-2",
      provider: "diia",
      jobKind: "verify",
      status: "queued",
      attemptCount: 0,
      maxAttempts: 3,
      nextAttemptAt: new Date(),
      payload: null,
    });

    verificationJobRepository.findOne.mockResolvedValue(job);
    userIdentityRepository.findOne.mockResolvedValue(identity);
    verificationJobRepository.save.mockImplementation(
      async (value: any) => value,
    );
    userIdentityRepository.save.mockImplementation(async (value: any) => value);
    mockProvider.verifyIdentity.mockRejectedValue(
      new Error("provider timeout"),
    );

    await service.processJob("job-3");

    expect(verificationJobRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "retrying",
        lastError: "provider timeout",
      }),
    );
    expect(userIdentityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "pending",
        lastError: "provider timeout",
      }),
    );
  });
});
