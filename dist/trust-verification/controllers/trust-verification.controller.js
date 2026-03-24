"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TrustVerificationController", {
    enumerable: true,
    get: function() {
        return TrustVerificationController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _guards = require("../../auth/guards");
const _providercallbackdto = require("../dto/provider-callback.dto");
const _requestidentityverificationdto = require("../dto/request-identity-verification.dto");
const _trustverificationservice = require("../services/trust-verification.service");
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
let TrustVerificationController = class TrustVerificationController {
    async requestIdentityVerification(req, dto) {
        return this.trustVerificationService.requestIdentityVerification(req.user?.tenant_id, req.user?.user_id, dto);
    }
    async listMyIdentities(req) {
        return this.trustVerificationService.listUserIdentities(req.user?.tenant_id, req.user?.user_id);
    }
    async providerCallback(dto, providerSecret, providerSignature, providerTimestamp, providerNonce) {
        await this.trustVerificationService.handleProviderCallback(dto, {
            legacySecret: providerSecret,
            signature: providerSignature,
            timestamp: providerTimestamp,
            nonce: providerNonce
        });
        return {
            accepted: true
        };
    }
    constructor(trustVerificationService){
        this.trustVerificationService = trustVerificationService;
    }
};
_ts_decorate([
    (0, _common.Post)("identities"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.TenantGuard),
    (0, _swagger.ApiBearerAuth)(),
    (0, _swagger.ApiOperation)({
        summary: "Request provider-backed identity verification"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "Identity verification requested"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        typeof _requestidentityverificationdto.RequestIdentityVerificationDto === "undefined" ? Object : _requestidentityverificationdto.RequestIdentityVerificationDto
    ]),
    _ts_metadata("design:returntype", Promise)
], TrustVerificationController.prototype, "requestIdentityVerification", null);
_ts_decorate([
    (0, _common.Get)("identities/me"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.TenantGuard),
    (0, _swagger.ApiBearerAuth)(),
    (0, _swagger.ApiOperation)({
        summary: "List current user trust identities"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Current identities returned"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TrustVerificationController.prototype, "listMyIdentities", null);
_ts_decorate([
    (0, _common.Post)("callbacks"),
    (0, _common.HttpCode)(_common.HttpStatus.ACCEPTED),
    (0, _swagger.ApiOperation)({
        summary: "Receive trust-provider verification callback"
    }),
    (0, _swagger.ApiResponse)({
        status: 202,
        description: "Callback accepted"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Headers)("x-trust-provider-secret")),
    _ts_param(2, (0, _common.Headers)("x-trust-provider-signature")),
    _ts_param(3, (0, _common.Headers)("x-trust-provider-timestamp")),
    _ts_param(4, (0, _common.Headers)("x-trust-provider-nonce")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _providercallbackdto.ProviderCallbackDto === "undefined" ? Object : _providercallbackdto.ProviderCallbackDto,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], TrustVerificationController.prototype, "providerCallback", null);
TrustVerificationController = _ts_decorate([
    (0, _swagger.ApiTags)("Trust Verification"),
    (0, _common.Controller)("trust-verifications"),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _trustverificationservice.TrustVerificationService === "undefined" ? Object : _trustverificationservice.TrustVerificationService
    ])
], TrustVerificationController);

//# sourceMappingURL=trust-verification.controller.js.map