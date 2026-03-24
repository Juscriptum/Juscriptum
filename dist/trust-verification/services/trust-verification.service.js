"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TrustVerificationService", {
    enumerable: true,
    get: function() {
        return TrustVerificationService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _auditservice = require("../../auth/services/audit.service");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
const _DocumentSignatureentity = require("../../database/entities/DocumentSignature.entity");
const _UserIdentityentity = require("../../database/entities/UserIdentity.entity");
const _TrustVerificationJobentity = require("../../database/entities/TrustVerificationJob.entity");
const _trustproviderregistry = require("./trust-provider.registry");
const _trustcallbackauthservice = require("./trust-callback-auth.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let TrustVerificationService = class TrustVerificationService {
    async requestIdentityVerification(tenantId, userId, dto) {
        let identity = await this.userIdentityRepository.findOne({
            where: {
                tenantId,
                userId,
                provider: dto.provider
            }
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
                nextCheckAt: new Date()
            });
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
                    ...identity.metadata || {},
                    ...dto.metadata || {}
                },
                lastCheckedAt: null,
                verifiedAt: null,
                lastError: null,
                nextCheckAt: new Date()
            });
        }
        const savedIdentity = await this.userIdentityRepository.save(identity);
        await this.enqueueJob(savedIdentity.tenantId, {
            jobKind: "verify",
            provider: savedIdentity.provider,
            subjectType: "user_identity",
            subjectId: savedIdentity.id,
            payload: {
                requestedByUserId: userId
            }
        });
        await this.auditService.log({
            tenantId,
            userId,
            action: _subscriptionenum.AuditAction.VERIFY,
            entityType: "UserIdentity",
            entityId: savedIdentity.id,
            metadata: {
                event: "identity_verification_requested",
                provider: savedIdentity.provider
            }
        });
        return savedIdentity;
    }
    async listUserIdentities(tenantId, userId) {
        return this.userIdentityRepository.find({
            where: {
                tenantId,
                userId
            },
            order: {
                createdAt: "DESC"
            }
        });
    }
    async queueSignatureVerification(signature) {
        await this.enqueueJob(signature.tenantId, {
            jobKind: "verify",
            provider: signature.provider,
            subjectType: "document_signature",
            subjectId: signature.id,
            payload: null
        });
        await this.auditService.log({
            tenantId: signature.tenantId,
            userId: signature.userId,
            action: _subscriptionenum.AuditAction.VERIFY,
            entityType: "DocumentSignature",
            entityId: signature.id,
            metadata: {
                event: "signature_verification_requested",
                provider: signature.provider,
                documentId: signature.documentId
            }
        });
    }
    async listDocumentSignatures(tenantId, documentId) {
        return this.documentSignatureRepository.find({
            where: {
                tenantId,
                documentId
            },
            order: {
                createdAt: "DESC"
            }
        });
    }
    async handleProviderCallback(dto, auth) {
        await this.trustCallbackAuthService.assertAuthenticCallback({
            provider: dto.provider,
            body: dto,
            legacySecret: auth?.legacySecret,
            signature: auth?.signature,
            timestamp: auth?.timestamp,
            nonce: auth?.nonce
        });
        const subject = await this.loadSubjectById(dto.subjectType, dto.subjectId);
        if (subject.provider !== dto.provider) {
            throw new _common.BadRequestException("Provider callback does not match subject");
        }
        await this.enqueueJob(subject.tenantId, {
            jobKind: "callback",
            provider: dto.provider,
            subjectType: dto.subjectType,
            subjectId: dto.subjectId,
            payload: dto
        });
        await this.auditService.log({
            tenantId: subject.tenantId,
            userId: "userId" in subject ? subject.userId : undefined,
            action: dto.event === "revoked" ? _subscriptionenum.AuditAction.REVOKE : _subscriptionenum.AuditAction.VERIFY,
            entityType: dto.subjectType === "document_signature" ? "DocumentSignature" : "UserIdentity",
            entityId: dto.subjectId,
            metadata: {
                event: "provider_callback_received",
                provider: dto.provider,
                subjectType: dto.subjectType,
                callbackEvent: dto.event,
                callbackNonce: auth?.nonce
            }
        });
    }
    async processDueJobs(limit = 20) {
        const jobs = await this.verificationJobRepository.find({
            where: [
                {
                    status: "queued",
                    nextAttemptAt: (0, _typeorm1.LessThanOrEqual)(new Date())
                },
                {
                    status: "retrying",
                    nextAttemptAt: (0, _typeorm1.LessThanOrEqual)(new Date())
                }
            ],
            order: {
                nextAttemptAt: "ASC"
            },
            take: limit
        });
        for (const job of jobs){
            await this.processJob(job.id);
        }
        return jobs.length;
    }
    async processJob(jobId) {
        const job = await this.verificationJobRepository.findOne({
            where: {
                id: jobId
            }
        });
        if (!job) {
            throw new _common.NotFoundException("Trust verification job not found");
        }
        const subject = await this.loadSubject(job.subjectType, job.subjectId, job.tenantId);
        const provider = this.providerRegistry.getProvider(job.provider);
        job.status = "processing";
        job.attemptCount += 1;
        job.lastError = null;
        await this.verificationJobRepository.save(job);
        try {
            const outcome = await this.runOutcome(provider, job.jobKind, subject, job.payload);
            await this.applyOutcome(job, subject, outcome);
        } catch (error) {
            await this.handleFailure(job, subject, error);
        }
    }
    async runOutcome(provider, jobKind, subject, payload) {
        if (jobKind === "callback") {
            return provider.handleCallback(payload || {}, this.getCurrentStatus(subject));
        }
        if (subject instanceof _DocumentSignatureentity.DocumentSignature) {
            return provider.verifySignature(subject);
        }
        return provider.verifyIdentity(subject);
    }
    async applyOutcome(job, subject, outcome) {
        const now = new Date();
        const entityType = job.subjectType === "document_signature" ? "DocumentSignature" : "UserIdentity";
        if (outcome.status === "retry") {
            const hasAttemptsLeft = job.attemptCount < job.maxAttempts;
            job.status = hasAttemptsLeft ? "retrying" : "failed";
            job.nextAttemptAt = new Date(Date.now() + Math.min(job.attemptCount, job.maxAttempts) * 60 * 1000);
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
                metadataPatch: outcome.metadata
            });
            await this.auditService.log({
                tenantId: job.tenantId,
                userId: "userId" in subject ? subject.userId : undefined,
                action: _subscriptionenum.AuditAction.UPDATE,
                entityType,
                entityId: subject.id,
                metadata: {
                    event: hasAttemptsLeft ? "trust_verification_retry_scheduled" : "trust_verification_retry_exhausted",
                    provider: job.provider,
                    reason: outcome.reason,
                    attemptCount: job.attemptCount
                }
            });
            return;
        }
        const finalStatus = this.mapOutcomeStatus(subject, outcome.status);
        job.status = "completed";
        job.completedAt = now;
        job.result = {
            status: outcome.status,
            ...outcome.metadata || {}
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
            metadataPatch: outcome.metadata
        });
        if (outcome.status === "verified" && outcome.nextCheckAt) {
            await this.enqueueJob(job.tenantId, {
                jobKind: "recheck",
                provider: job.provider,
                subjectType: job.subjectType,
                subjectId: job.subjectId,
                payload: null,
                nextAttemptAt: outcome.nextCheckAt
            });
        }
        await this.auditService.log({
            tenantId: job.tenantId,
            userId: "userId" in subject ? subject.userId : undefined,
            action: outcome.status === "revoked" ? _subscriptionenum.AuditAction.REVOKE : _subscriptionenum.AuditAction.VERIFY,
            entityType,
            entityId: subject.id,
            metadata: {
                event: "trust_verification_completed",
                provider: job.provider,
                result: outcome.status,
                reason: outcome.reason,
                scheduledRecheckAt: outcome.nextCheckAt?.toISOString()
            }
        });
    }
    async handleFailure(job, subject, error) {
        const hasAttemptsLeft = job.attemptCount < job.maxAttempts;
        const message = error instanceof Error ? error.message : String(error);
        const now = new Date();
        job.status = hasAttemptsLeft ? "retrying" : "failed";
        job.lastError = message;
        job.nextAttemptAt = new Date(Date.now() + Math.min(job.attemptCount, job.maxAttempts) * 60 * 1000);
        await this.verificationJobRepository.save(job);
        await this.updateSubjectState(subject, {
            status: this.pendingStatusForSubject(subject),
            lastCheckedAt: now,
            verificationAttempts: job.attemptCount,
            lastError: message,
            nextCheckAt: hasAttemptsLeft ? job.nextAttemptAt : null,
            verifiedAt: null
        });
        await this.auditService.log({
            tenantId: job.tenantId,
            userId: "userId" in subject ? subject.userId : undefined,
            action: _subscriptionenum.AuditAction.UPDATE,
            entityType: job.subjectType === "document_signature" ? "DocumentSignature" : "UserIdentity",
            entityId: subject.id,
            metadata: {
                event: hasAttemptsLeft ? "trust_verification_job_retrying" : "trust_verification_job_failed",
                provider: job.provider,
                reason: message,
                attemptCount: job.attemptCount
            }
        });
        this.logger.error(`Trust verification job ${job.id} failed`, message);
    }
    async enqueueJob(tenantId, data) {
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
            completedAt: null
        });
        return this.verificationJobRepository.save(job);
    }
    async loadSubject(subjectType, subjectId, tenantId) {
        if (subjectType === "document_signature") {
            const signature = await this.documentSignatureRepository.findOne({
                where: {
                    id: subjectId,
                    tenantId
                }
            });
            if (!signature) {
                throw new _common.NotFoundException("Document signature not found");
            }
            return signature;
        }
        const identity = await this.userIdentityRepository.findOne({
            where: {
                id: subjectId,
                tenantId
            }
        });
        if (!identity) {
            throw new _common.NotFoundException("User identity not found");
        }
        return identity;
    }
    async loadSubjectById(subjectType, subjectId) {
        if (subjectType === "document_signature") {
            const signature = await this.documentSignatureRepository.findOne({
                where: {
                    id: subjectId
                }
            });
            if (!signature) {
                throw new _common.NotFoundException("Document signature not found");
            }
            return signature;
        }
        const identity = await this.userIdentityRepository.findOne({
            where: {
                id: subjectId
            }
        });
        if (!identity) {
            throw new _common.NotFoundException("User identity not found");
        }
        return identity;
    }
    mapOutcomeStatus(subject, status) {
        if (subject instanceof _DocumentSignatureentity.DocumentSignature) {
            return status;
        }
        if (status === "failed") {
            return "rejected";
        }
        return status;
    }
    pendingStatusForSubject(subject) {
        if (subject instanceof _DocumentSignatureentity.DocumentSignature) {
            return "pending";
        }
        return "pending";
    }
    getCurrentStatus(subject) {
        if (subject instanceof _DocumentSignatureentity.DocumentSignature) {
            return subject.verificationStatus;
        }
        return subject.status;
    }
    async updateSubjectState(subject, data) {
        if (subject instanceof _DocumentSignatureentity.DocumentSignature) {
            subject.verificationStatus = data.status;
            subject.lastCheckedAt = data.lastCheckedAt;
            subject.verificationAttempts = data.verificationAttempts;
            subject.lastError = data.lastError;
            subject.nextCheckAt = data.nextCheckAt;
            subject.externalVerificationId = data.externalVerificationId || subject.externalVerificationId;
            subject.metadata = {
                ...subject.metadata || {},
                ...data.metadataPatch || {}
            };
            if (data.verifiedAt) {
                subject.verifiedAt = data.verifiedAt;
            }
            await this.documentSignatureRepository.save(subject);
            return;
        }
        subject.status = data.status;
        subject.lastCheckedAt = data.lastCheckedAt;
        subject.verificationAttempts = data.verificationAttempts;
        subject.lastError = data.lastError;
        subject.nextCheckAt = data.nextCheckAt;
        subject.externalVerificationId = data.externalVerificationId || subject.externalVerificationId;
        subject.metadata = {
            ...subject.metadata || {},
            ...data.metadataPatch || {}
        };
        subject.verifiedAt = data.status === "verified" && data.verifiedAt ? data.verifiedAt : subject.verifiedAt;
        await this.userIdentityRepository.save(subject);
    }
    constructor(userIdentityRepository, documentSignatureRepository, verificationJobRepository, providerRegistry, auditService, trustCallbackAuthService){
        this.userIdentityRepository = userIdentityRepository;
        this.documentSignatureRepository = documentSignatureRepository;
        this.verificationJobRepository = verificationJobRepository;
        this.providerRegistry = providerRegistry;
        this.auditService = auditService;
        this.trustCallbackAuthService = trustCallbackAuthService;
        this.logger = new _common.Logger(TrustVerificationService.name);
    }
};
TrustVerificationService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_UserIdentityentity.UserIdentity)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_DocumentSignatureentity.DocumentSignature)),
    _ts_param(2, (0, _typeorm.InjectRepository)(_TrustVerificationJobentity.TrustVerificationJob)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _trustproviderregistry.TrustProviderRegistry === "undefined" ? Object : _trustproviderregistry.TrustProviderRegistry,
        typeof _auditservice.AuditService === "undefined" ? Object : _auditservice.AuditService,
        typeof _trustcallbackauthservice.TrustCallbackAuthService === "undefined" ? Object : _trustcallbackauthservice.TrustCallbackAuthService
    ])
], TrustVerificationService);

//# sourceMappingURL=trust-verification.service.js.map