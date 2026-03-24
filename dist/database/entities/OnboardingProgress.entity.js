"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OnboardingProgress", {
    enumerable: true,
    get: function() {
        return OnboardingProgress;
    }
});
const _typeorm = require("typeorm");
const _subscriptionenum = require("./enums/subscription.enum");
const _Userentity = require("./User.entity");
const _Organizationentity = require("./Organization.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let OnboardingProgress = class OnboardingProgress {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)("uuid"),
    _ts_metadata("design:type", String)
], OnboardingProgress.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "tenant_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], OnboardingProgress.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "user_id",
        type: "uuid"
    }),
    _ts_metadata("design:type", String)
], OnboardingProgress.prototype, "userId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "varchar"
    }),
    _ts_metadata("design:type", typeof _subscriptionenum.OnboardingStep === "undefined" ? Object : _subscriptionenum.OnboardingStep)
], OnboardingProgress.prototype, "step", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "boolean",
        default: false
    }),
    _ts_metadata("design:type", Boolean)
], OnboardingProgress.prototype, "completed", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: "completed_at",
        type: "datetime",
        nullable: true
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], OnboardingProgress.prototype, "completedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "int",
        default: 0
    }),
    _ts_metadata("design:type", Number)
], OnboardingProgress.prototype, "percentage", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: "json"
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], OnboardingProgress.prototype, "data", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: "created_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], OnboardingProgress.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: "updated_at",
        type: "datetime"
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], OnboardingProgress.prototype, "updatedAt", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_Organizationentity.Organization, {
        onDelete: "CASCADE"
    }),
    (0, _typeorm.JoinColumn)({
        name: "tenant_id"
    }),
    _ts_metadata("design:type", typeof _Organizationentity.Organization === "undefined" ? Object : _Organizationentity.Organization)
], OnboardingProgress.prototype, "organization", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_Userentity.User),
    (0, _typeorm.JoinColumn)({
        name: "user_id"
    }),
    _ts_metadata("design:type", typeof _Userentity.User === "undefined" ? Object : _Userentity.User)
], OnboardingProgress.prototype, "user", void 0);
OnboardingProgress = _ts_decorate([
    (0, _typeorm.Entity)("onboarding_progress"),
    (0, _typeorm.Index)("idx_onboarding_progress_tenant_id", [
        "tenantId"
    ]),
    (0, _typeorm.Index)("idx_onboarding_progress_user_id", [
        "userId"
    ]),
    (0, _typeorm.Index)("idx_onboarding_progress_step", [
        "step"
    ]),
    (0, _typeorm.Index)("idx_onboarding_progress_completed", [
        "completed"
    ])
], OnboardingProgress);

//# sourceMappingURL=OnboardingProgress.entity.js.map