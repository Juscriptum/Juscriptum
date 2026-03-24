"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get TRUST_VERIFICATION_JOB_KINDS () {
        return TRUST_VERIFICATION_JOB_KINDS;
    },
    get TRUST_VERIFICATION_JOB_STATUSES () {
        return TRUST_VERIFICATION_JOB_STATUSES;
    },
    get TRUST_VERIFICATION_SUBJECT_TYPES () {
        return TRUST_VERIFICATION_SUBJECT_TYPES;
    },
    get TrustVerificationJob () {
        return TrustVerificationJob;
    }
});
const _typeorm = require("typeorm");
const _UserIdentityentity = require("./UserIdentity.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
const TRUST_VERIFICATION_SUBJECT_TYPES = [
    "user_identity",
    "document_signature"
];
const TRUST_VERIFICATION_JOB_KINDS = [
    "verify",
    "recheck",
    "callback"
];
const TRUST_VERIFICATION_JOB_STATUSES = [
    "queued",
    "processing",
    "completed",
    "retrying",
    "failed"
];
let TrustVerificationJob = class TrustVerificationJob {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], TrustVerificationJob.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], TrustVerificationJob.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "subject_type",
        type: "varchar",
        length: 64
    }),
    _ts_metadata("design:type", typeof TrustVerificationSubjectType === "undefined" ? Object : TrustVerificationSubjectType)
], TrustVerificationJob.prototype, "subjectType", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "subject_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], TrustVerificationJob.prototype, "subjectId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 32
    }),
    _ts_metadata("design:type", typeof _UserIdentityentity.TrustProviderType === "undefined" ? Object : _UserIdentityentity.TrustProviderType)
], TrustVerificationJob.prototype, "provider", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "job_kind",
        type: "varchar",
        length: 32
    }),
    _ts_metadata("design:type", typeof TrustVerificationJobKind === "undefined" ? Object : TrustVerificationJobKind)
], TrustVerificationJob.prototype, "jobKind", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar",
        length: 32,
        default: "queued"
    }),
    _ts_metadata("design:type", typeof TrustVerificationJobStatus === "undefined" ? Object : TrustVerificationJobStatus)
], TrustVerificationJob.prototype, "status", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "attempt_count",
        type: "int",
        default: 0
    }),
    _ts_metadata("design:type", Number)
], TrustVerificationJob.prototype, "attemptCount", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "max_attempts",
        type: "int",
        default: 3
    }),
    _ts_metadata("design:type", Number)
], TrustVerificationJob.prototype, "maxAttempts", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "next_attempt_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], TrustVerificationJob.prototype, "nextAttemptAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "last_error",
        type: "text",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], TrustVerificationJob.prototype, "lastError", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], TrustVerificationJob.prototype, "payload", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], TrustVerificationJob.prototype, "result", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "completed_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], TrustVerificationJob.prototype, "completedAt", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], TrustVerificationJob.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], TrustVerificationJob.prototype, "updatedAt", void 0);
TrustVerificationJob = _ts_decorate([
    (0, _typeorm.Entity)("trust_verification_jobs"),
    (0, _typeorm.Index)("idx_trust_verification_jobs_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_trust_verification_jobs_subject", [
        "subjectType",
        "subjectId"
    ]),
    (0, _typeorm.Index)("idx_trust_verification_jobs_status_next_attempt", [
        "status",
        "nextAttemptAt"
    ]),
    (0, _typeorm.Index)("idx_trust_verification_jobs_provider", [
        "provider"
    ])
], TrustVerificationJob);

//# sourceMappingURL=TrustVerificationJob.entity.js.map