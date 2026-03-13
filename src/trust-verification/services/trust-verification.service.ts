import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThanOrEqual, Repository } from "typeorm";
import { AuditService } from "../../auth/services/audit.service";
import { AuditAction } from "../../database/entities/enums/subscription.enum";
import {
  DocumentSignature,
  SignatureVerificationStatus,
} from "../../database/entities/DocumentSignature.entity";
import {
  TrustProviderType,
  TrustVerificationStatus,
  UserIdentity,
} from "../../database/entities/UserIdentity.entity";
import {
  TrustVerificationJob,
  TrustVerificationJobKind,
} from "../../database/entities/TrustVerificationJob.entity";
import { RequestIdentityVerificationDto } from "../dto/request-identity-verification.dto";
import { ProviderCallbackDto } from "../dto/provider-callback.dto";
import { TrustProviderRegistry } from "./trust-provider.registry";
import { TrustVerificationOutcome } from "./trust-provider.adapters";
import { TrustCallbackAuthService } from "./trust-callback-auth.service";

type VerificationSubject = DocumentSignature | UserIdentity;

@Injectable()
export class TrustVerificationService {
  private readonly logger = new Logger(TrustVerificationService.name);

  constructor(
    @InjectRepository(UserIdentity)
    private readonly userIdentityRepository: Repository<UserIdentity>,
    @InjectRepository(DocumentSignature)
    private readonly documentSignatureRepository: Repository<DocumentSignature>,
    @InjectRepository(TrustVerificationJob)
    private readonly verificationJobRepository: Repository<TrustVerificationJob>,
    private readonly providerRegistry: TrustProviderRegistry,
    private readonly auditService: AuditService,
    private readonly trustCallbackAuthService: TrustCallbackAuthService,
  ) {}

  async requestIdentityVerification(
    tenantId: string,
    userId: string,
    dto: RequestIdentityVerificationDto,
  ): Promise<UserIdentity> {
    let identity = await this.userIdentityRepository.findOne({
      where: {
        tenantId,
        userId,
        provider: dto.provider,
      },
    });

    if (!identity) {
      identity = this.userIdentityRepository.create({
        tenantId,
        userId,
        provider: dto.provider,
        status: "pending",
        externalSubjectId: dto.externalSubjectId,
        displayName: dto.displayName,
        certificateSerialNumber: dto.certificateSerialNumber,
        certificateIssuer: dto.certificateIssuer,
        taxIdHash: dto.taxIdHash,
        assuranceLevel: dto.assuranceLevel,
        metadata: dto.metadata || {},
        lastCheckedAt: null,
        verifiedAt: null,
        lastError: null,
        externalVerificationId: null,
        verificationAttempts: 0,
        nextCheckAt: new Date(),
      } as unknown as Partial<UserIdentity>);
    } else {
      Object.assign(identity, {
        status: "pending",
        externalSubjectId: dto.externalSubjectId,
        displayName: dto.displayName,
        certificateSerialNumber: dto.certificateSerialNumber,
        certificateIssuer: dto.certificateIssuer,
        taxIdHash: dto.taxIdHash,
        assuranceLevel: dto.assuranceLevel,
        metadata: {
          ...(identity.metadata || {}),
          ...(dto.metadata || {}),
        },
        lastCheckedAt: null,
        verifiedAt: null,
        lastError: null,
        nextCheckAt: new Date(),
      });
    }

    const savedIdentity = await this.userIdentityRepository.save(identity);

    await this.enqueueJob(savedIdentity.tenantId, {
      jobKind: "verify",
      provider: savedIdentity.provider,
      subjectType: "user_identity",
      subjectId: savedIdentity.id,
      payload: {
        requestedByUserId: userId,
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: AuditAction.VERIFY,
      entityType: "UserIdentity",
      entityId: savedIdentity.id,
      metadata: {
        event: "identity_verification_requested",
        provider: savedIdentity.provider,
      },
    });

    return savedIdentity;
  }

  async listUserIdentities(
    tenantId: string,
    userId: string,
  ): Promise<UserIdentity[]> {
    return this.userIdentityRepository.find({
      where: {
        tenantId,
        userId,
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  async queueSignatureVerification(
    signature: DocumentSignature,
  ): Promise<void> {
    await this.enqueueJob(signature.tenantId, {
      jobKind: "verify",
      provider: signature.provider,
      subjectType: "document_signature",
      subjectId: signature.id,
      payload: null,
    });

    await this.auditService.log({
      tenantId: signature.tenantId,
      userId: signature.userId,
      action: AuditAction.VERIFY,
      entityType: "DocumentSignature",
      entityId: signature.id,
      metadata: {
        event: "signature_verification_requested",
        provider: signature.provider,
        documentId: signature.documentId,
      },
    });
  }

  async listDocumentSignatures(
    tenantId: string,
    documentId: string,
  ): Promise<DocumentSignature[]> {
    return this.documentSignatureRepository.find({
      where: {
        tenantId,
        documentId,
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  async handleProviderCallback(
    dto: ProviderCallbackDto,
    auth?: {
      legacySecret?: string;
      signature?: string;
      timestamp?: string;
      nonce?: string;
    },
  ): Promise<void> {
    await this.trustCallbackAuthService.assertAuthenticCallback({
      provider: dto.provider,
      body: dto,
      legacySecret: auth?.legacySecret,
      signature: auth?.signature,
      timestamp: auth?.timestamp,
      nonce: auth?.nonce,
    });

    const subject = await this.loadSubjectById(dto.subjectType, dto.subjectId);
    if (subject.provider !== dto.provider) {
      throw new BadRequestException("Provider callback does not match subject");
    }

    await this.enqueueJob(subject.tenantId, {
      jobKind: "callback",
      provider: dto.provider,
      subjectType: dto.subjectType,
      subjectId: dto.subjectId,
      payload: dto,
    });

    await this.auditService.log({
      tenantId: subject.tenantId,
      userId: "userId" in subject ? subject.userId : undefined,
      action: dto.event === "revoked" ? AuditAction.REVOKE : AuditAction.VERIFY,
      entityType:
        dto.subjectType === "document_signature"
          ? "DocumentSignature"
          : "UserIdentity",
      entityId: dto.subjectId,
      metadata: {
        event: "provider_callback_received",
        provider: dto.provider,
        subjectType: dto.subjectType,
        callbackEvent: dto.event,
        callbackNonce: auth?.nonce,
      },
    });
  }

  async processDueJobs(limit: number = 20): Promise<number> {
    const jobs = await this.verificationJobRepository.find({
      where: [
        { status: "queued", nextAttemptAt: LessThanOrEqual(new Date()) },
        { status: "retrying", nextAttemptAt: LessThanOrEqual(new Date()) },
      ],
      order: {
        nextAttemptAt: "ASC",
      },
      take: limit,
    });

    for (const job of jobs) {
      await this.processJob(job.id);
    }

    return jobs.length;
  }

  async processJob(jobId: string): Promise<void> {
    const job = await this.verificationJobRepository.findOne({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException("Trust verification job not found");
    }

    const subject = await this.loadSubject(
      job.subjectType,
      job.subjectId,
      job.tenantId,
    );
    const provider = this.providerRegistry.getProvider(job.provider);

    job.status = "processing";
    job.attemptCount += 1;
    job.lastError = null;
    await this.verificationJobRepository.save(job);

    try {
      const outcome = await this.runOutcome(
        provider,
        job.jobKind,
        subject,
        job.payload,
      );
      await this.applyOutcome(job, subject, outcome);
    } catch (error) {
      await this.handleFailure(job, subject, error);
    }
  }

  private async runOutcome(
    provider: {
      verifySignature: (
        signature: DocumentSignature,
      ) => Promise<TrustVerificationOutcome>;
      verifyIdentity: (
        identity: UserIdentity,
      ) => Promise<TrustVerificationOutcome>;
      handleCallback: (
        payload: Record<string, any>,
        currentStatus?: SignatureVerificationStatus | TrustVerificationStatus,
      ) => Promise<TrustVerificationOutcome>;
    },
    jobKind: TrustVerificationJobKind,
    subject: VerificationSubject,
    payload: Record<string, any> | null,
  ): Promise<TrustVerificationOutcome> {
    if (jobKind === "callback") {
      return provider.handleCallback(
        payload || {},
        this.getCurrentStatus(subject),
      );
    }

    if (subject instanceof DocumentSignature) {
      return provider.verifySignature(subject);
    }

    return provider.verifyIdentity(subject);
  }

  private async applyOutcome(
    job: TrustVerificationJob,
    subject: VerificationSubject,
    outcome: TrustVerificationOutcome,
  ): Promise<void> {
    const now = new Date();
    const entityType =
      job.subjectType === "document_signature"
        ? "DocumentSignature"
        : "UserIdentity";

    if (outcome.status === "retry") {
      const hasAttemptsLeft = job.attemptCount < job.maxAttempts;
      job.status = hasAttemptsLeft ? "retrying" : "failed";
      job.nextAttemptAt = new Date(
        Date.now() + Math.min(job.attemptCount, job.maxAttempts) * 60 * 1000,
      );
      job.lastError = outcome.reason || "Retry requested by provider";
      job.result = outcome.metadata || null;
      await this.verificationJobRepository.save(job);

      await this.updateSubjectState(subject, {
        status: this.pendingStatusForSubject(subject),
        lastCheckedAt: now,
        verificationAttempts: job.attemptCount,
        lastError: job.lastError,
        nextCheckAt: hasAttemptsLeft ? job.nextAttemptAt : null,
        verifiedAt: null,
        externalVerificationId: outcome.externalVerificationId,
        metadataPatch: outcome.metadata,
      });

      await this.auditService.log({
        tenantId: job.tenantId,
        userId: "userId" in subject ? subject.userId : undefined,
        action: AuditAction.UPDATE,
        entityType,
        entityId: subject.id,
        metadata: {
          event: hasAttemptsLeft
            ? "trust_verification_retry_scheduled"
            : "trust_verification_retry_exhausted",
          provider: job.provider,
          reason: outcome.reason,
          attemptCount: job.attemptCount,
        },
      });

      return;
    }

    const finalStatus = this.mapOutcomeStatus(subject, outcome.status);
    job.status = "completed";
    job.completedAt = now;
    job.result = {
      status: outcome.status,
      ...(outcome.metadata || {}),
    };
    job.lastError = outcome.reason || null;
    await this.verificationJobRepository.save(job);

    await this.updateSubjectState(subject, {
      status: finalStatus,
      lastCheckedAt: now,
      verificationAttempts: job.attemptCount,
      lastError: outcome.status === "verified" ? null : outcome.reason || null,
      nextCheckAt: outcome.nextCheckAt || null,
      verifiedAt: outcome.status === "verified" ? now : null,
      externalVerificationId: outcome.externalVerificationId,
      metadataPatch: outcome.metadata,
    });

    if (outcome.status === "verified" && outcome.nextCheckAt) {
      await this.enqueueJob(job.tenantId, {
        jobKind: "recheck",
        provider: job.provider,
        subjectType: job.subjectType,
        subjectId: job.subjectId,
        payload: null,
        nextAttemptAt: outcome.nextCheckAt,
      });
    }

    await this.auditService.log({
      tenantId: job.tenantId,
      userId: "userId" in subject ? subject.userId : undefined,
      action:
        outcome.status === "revoked" ? AuditAction.REVOKE : AuditAction.VERIFY,
      entityType,
      entityId: subject.id,
      metadata: {
        event: "trust_verification_completed",
        provider: job.provider,
        result: outcome.status,
        reason: outcome.reason,
        scheduledRecheckAt: outcome.nextCheckAt?.toISOString(),
      },
    });
  }

  private async handleFailure(
    job: TrustVerificationJob,
    subject: VerificationSubject,
    error: unknown,
  ): Promise<void> {
    const hasAttemptsLeft = job.attemptCount < job.maxAttempts;
    const message = error instanceof Error ? error.message : String(error);
    const now = new Date();

    job.status = hasAttemptsLeft ? "retrying" : "failed";
    job.lastError = message;
    job.nextAttemptAt = new Date(
      Date.now() + Math.min(job.attemptCount, job.maxAttempts) * 60 * 1000,
    );
    await this.verificationJobRepository.save(job);

    await this.updateSubjectState(subject, {
      status: this.pendingStatusForSubject(subject),
      lastCheckedAt: now,
      verificationAttempts: job.attemptCount,
      lastError: message,
      nextCheckAt: hasAttemptsLeft ? job.nextAttemptAt : null,
      verifiedAt: null,
    });

    await this.auditService.log({
      tenantId: job.tenantId,
      userId: "userId" in subject ? subject.userId : undefined,
      action: AuditAction.UPDATE,
      entityType:
        job.subjectType === "document_signature"
          ? "DocumentSignature"
          : "UserIdentity",
      entityId: subject.id,
      metadata: {
        event: hasAttemptsLeft
          ? "trust_verification_job_retrying"
          : "trust_verification_job_failed",
        provider: job.provider,
        reason: message,
        attemptCount: job.attemptCount,
      },
    });

    this.logger.error(`Trust verification job ${job.id} failed`, message);
  }

  private async enqueueJob(
    tenantId: string,
    data: {
      jobKind: TrustVerificationJobKind;
      provider: TrustProviderType;
      subjectType: "user_identity" | "document_signature";
      subjectId: string;
      payload: Record<string, any> | null;
      nextAttemptAt?: Date;
    },
  ): Promise<TrustVerificationJob> {
    const job = this.verificationJobRepository.create({
      tenantId,
      provider: data.provider,
      jobKind: data.jobKind,
      subjectType: data.subjectType,
      subjectId: data.subjectId,
      status: "queued",
      attemptCount: 0,
      maxAttempts: 3,
      nextAttemptAt: data.nextAttemptAt || new Date(),
      lastError: null,
      payload: data.payload,
      result: null,
      completedAt: null,
    } as unknown as Partial<TrustVerificationJob>);

    return this.verificationJobRepository.save(job);
  }

  private async loadSubject(
    subjectType: "user_identity" | "document_signature",
    subjectId: string,
    tenantId: string,
  ): Promise<VerificationSubject> {
    if (subjectType === "document_signature") {
      const signature = await this.documentSignatureRepository.findOne({
        where: {
          id: subjectId,
          tenantId,
        },
      });
      if (!signature) {
        throw new NotFoundException("Document signature not found");
      }
      return signature;
    }

    const identity = await this.userIdentityRepository.findOne({
      where: {
        id: subjectId,
        tenantId,
      },
    });
    if (!identity) {
      throw new NotFoundException("User identity not found");
    }
    return identity;
  }

  private async loadSubjectById(
    subjectType: "user_identity" | "document_signature",
    subjectId: string,
  ): Promise<VerificationSubject> {
    if (subjectType === "document_signature") {
      const signature = await this.documentSignatureRepository.findOne({
        where: {
          id: subjectId,
        },
      });
      if (!signature) {
        throw new NotFoundException("Document signature not found");
      }
      return signature;
    }

    const identity = await this.userIdentityRepository.findOne({
      where: {
        id: subjectId,
      },
    });
    if (!identity) {
      throw new NotFoundException("User identity not found");
    }
    return identity;
  }

  private mapOutcomeStatus(
    subject: VerificationSubject,
    status: "verified" | "failed" | "revoked",
  ): SignatureVerificationStatus | TrustVerificationStatus {
    if (subject instanceof DocumentSignature) {
      return status;
    }

    if (status === "failed") {
      return "rejected";
    }

    return status;
  }

  private pendingStatusForSubject(
    subject: VerificationSubject,
  ): SignatureVerificationStatus | TrustVerificationStatus {
    if (subject instanceof DocumentSignature) {
      return "pending";
    }

    return "pending";
  }

  private getCurrentStatus(
    subject: VerificationSubject,
  ): SignatureVerificationStatus | TrustVerificationStatus {
    if (subject instanceof DocumentSignature) {
      return subject.verificationStatus;
    }

    return subject.status;
  }

  private async updateSubjectState(
    subject: VerificationSubject,
    data: {
      status: SignatureVerificationStatus | TrustVerificationStatus;
      lastCheckedAt: Date;
      verificationAttempts: number;
      lastError: string | null;
      nextCheckAt: Date | null;
      verifiedAt: Date | null;
      externalVerificationId?: string;
      metadataPatch?: Record<string, any>;
    },
  ): Promise<void> {
    if (subject instanceof DocumentSignature) {
      subject.verificationStatus = data.status as SignatureVerificationStatus;
      subject.lastCheckedAt = data.lastCheckedAt;
      subject.verificationAttempts = data.verificationAttempts;
      subject.lastError = data.lastError;
      subject.nextCheckAt = data.nextCheckAt;
      subject.externalVerificationId =
        data.externalVerificationId || subject.externalVerificationId;
      subject.metadata = {
        ...(subject.metadata || {}),
        ...(data.metadataPatch || {}),
      };
      if (data.verifiedAt) {
        subject.verifiedAt = data.verifiedAt;
      }
      await this.documentSignatureRepository.save(subject);
      return;
    }

    subject.status = data.status as TrustVerificationStatus;
    subject.lastCheckedAt = data.lastCheckedAt;
    subject.verificationAttempts = data.verificationAttempts;
    subject.lastError = data.lastError;
    subject.nextCheckAt = data.nextCheckAt;
    subject.externalVerificationId =
      data.externalVerificationId || subject.externalVerificationId;
    subject.metadata = {
      ...(subject.metadata || {}),
      ...(data.metadataPatch || {}),
    };
    subject.verifiedAt =
      data.status === "verified" && data.verifiedAt
        ? data.verifiedAt
        : subject.verifiedAt;
    await this.userIdentityRepository.save(subject);
  }
}
