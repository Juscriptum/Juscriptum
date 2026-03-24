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
    get AcskTrustProviderAdapter () {
        return AcskTrustProviderAdapter;
    },
    get BankIdNbuTrustProviderAdapter () {
        return BankIdNbuTrustProviderAdapter;
    },
    get DiiaTrustProviderAdapter () {
        return DiiaTrustProviderAdapter;
    },
    get ManualTrustProviderAdapter () {
        return ManualTrustProviderAdapter;
    }
});
const _common = require("@nestjs/common");
const _axios = /*#__PURE__*/ _interop_require_default(require("axios"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function providerMetadata(provider, mode = "stub") {
    return {
        providerMode: mode,
        liveIntegration: mode === "live",
        provider
    };
}
let BaseTrustProviderAdapter = class BaseTrustProviderAdapter {
    async handleCallback(payload, currentStatus) {
        if (this.isLiveMode() && this.getProviderConfig().statusUrl) {
            const resolved = await this.resolveCallbackStatus(payload);
            if (resolved) {
                return resolved;
            }
        }
        return mapCallbackPayload(this.provider, payload, this.getProviderConfig().mode, currentStatus);
    }
    isLiveMode() {
        return this.getProviderConfig().mode === "live";
    }
    async resolveCallbackStatus(payload) {
        const config = this.getProviderConfig();
        const statusReference = getString(payload.externalVerificationId) || getString(payload.metadata?.externalVerificationId) || getString(payload.metadata?.statusReference) || getString(payload.metadata?.requestId) || getString(payload.metadata?.authorizationCode);
        if (!statusReference || !config.statusUrl) {
            return null;
        }
        const auth = await this.buildAuthHeaders();
        const { outcome } = await this.sendProviderRequest({
            provider: this.provider,
            endpoint: config.statusUrl,
            payload: {
                reference: statusReference,
                callbackEvent: payload.event,
                currentMetadata: payload.metadata || null
            },
            auth
        });
        return outcome;
    }
    async buildAuthHeaders() {
        const config = this.getProviderConfig();
        if (config.clientId && config.clientSecret && config.tokenUrl) {
            const token = await this.fetchClientCredentialsToken();
            return {
                bearerToken: token,
                headers: this.buildStaticHeaders()
            };
        }
        if (config.clientId && config.clientSecret && !config.tokenUrl) {
            return {
                basicAuth: {
                    username: config.clientId,
                    password: config.clientSecret
                },
                headers: this.buildStaticHeaders()
            };
        }
        return {
            headers: this.buildStaticHeaders()
        };
    }
    buildStaticHeaders() {
        const config = this.getProviderConfig();
        return {
            ...config.apiKey ? {
                "x-api-key": config.apiKey
            } : {}
        };
    }
    async fetchClientCredentialsToken() {
        const config = this.getProviderConfig();
        if (!config.tokenUrl || !config.clientId || !config.clientSecret) {
            throw new Error(`${this.provider} token exchange is not configured`);
        }
        const response = await _axios.default.post(config.tokenUrl, {
            grant_type: "client_credentials",
            client_id: config.clientId,
            client_secret: config.clientSecret,
            ...config.scope ? {
                scope: config.scope
            } : {},
            ...config.audience ? {
                audience: config.audience
            } : {}
        }, {
            timeout: config.requestTimeoutMs
        });
        const token = getString(response.data?.access_token) || getString(response.data?.token) || getString(response.data?.id_token);
        if (!token) {
            throw new Error(`${this.provider} token response did not include a token`);
        }
        return token;
    }
    async sendProviderRequest(request) {
        const config = this.getProviderConfig();
        const axiosConfig = {
            timeout: config.requestTimeoutMs,
            headers: {
                "Content-Type": "application/json",
                ...request.auth?.headers || {},
                ...request.auth?.bearerToken ? {
                    Authorization: `Bearer ${request.auth.bearerToken}`
                } : {}
            },
            auth: request.auth?.basicAuth
        };
        const response = await _axios.default.post(request.endpoint, request.payload, axiosConfig);
        const raw = normalizeProviderResponse(response.data);
        return {
            raw,
            outcome: mapRemoteOutcome(this.provider, raw, config.mode)
        };
    }
    async executeOcspAndCrlChecks(certificateSerialNumber, certificateIssuer) {
        const config = this.getProviderConfig();
        let ocspChecked = false;
        let crlChecked = false;
        let revocationReason;
        if (config.ocspUrl) {
            const auth = await this.buildAuthHeaders();
            const { outcome } = await this.sendProviderRequest({
                provider: this.provider,
                endpoint: config.ocspUrl,
                payload: {
                    certificateSerialNumber,
                    certificateIssuer
                },
                auth
            });
            ocspChecked = true;
            if (outcome.status === "revoked" || outcome.status === "failed") {
                revocationReason = outcome.reason || "Certificate failed OCSP validation";
            }
        }
        if (!revocationReason && config.crlUrl) {
            const auth = await this.buildAuthHeaders();
            const { outcome } = await this.sendProviderRequest({
                provider: this.provider,
                endpoint: config.crlUrl,
                payload: {
                    certificateSerialNumber,
                    certificateIssuer
                },
                auth
            });
            crlChecked = true;
            if (outcome.status === "revoked" || outcome.status === "failed") {
                revocationReason = outcome.reason || "Certificate is present in CRL";
            }
        }
        return {
            ocspChecked,
            crlChecked,
            revocationReason
        };
    }
    constructor(configService){
        this.configService = configService;
    }
};
let AcskTrustProviderAdapter = class AcskTrustProviderAdapter extends BaseTrustProviderAdapter {
    getCapabilities() {
        return {
            liveProviderIntegration: this.isLiveMode(),
            supportsCallbacks: true,
            supportsPeriodicRecheck: true,
            supportsOcsp: true,
            supportsCrl: true
        };
    }
    getProviderConfig() {
        return {
            mode: getMode(this.configService, "ACSK_TRUST_MODE"),
            verifySignatureUrl: this.configService.get("ACSK_TRUST_VERIFY_SIGNATURE_URL"),
            verifyIdentityUrl: this.configService.get("ACSK_TRUST_VERIFY_IDENTITY_URL"),
            statusUrl: this.configService.get("ACSK_TRUST_STATUS_URL"),
            ocspUrl: this.configService.get("ACSK_TRUST_OCSP_URL"),
            crlUrl: this.configService.get("ACSK_TRUST_CRL_URL"),
            apiKey: this.configService.get("ACSK_TRUST_API_KEY"),
            callbackSecret: this.configService.get("ACSK_TRUST_CALLBACK_SECRET"),
            callbackAuthScheme: "hmac",
            recheckHours: Number(this.configService.get("ACSK_TRUST_RECHECK_HOURS", "24")),
            requestTimeoutMs: Number(this.configService.get("TRUST_PROVIDER_TIMEOUT_MS", "10000"))
        };
    }
    async verifySignature(signature) {
        if (!signature.certificateSerialNumber || !signature.certificateIssuer || !signature.signatureHash || !signature.signedPayloadHash) {
            return {
                status: "failed",
                reason: "ACSK verification requires certificate serial, issuer, signature hash, and signed payload hash",
                metadata: {
                    ...providerMetadata(this.provider),
                    ocspChecked: false,
                    crlChecked: false
                }
            };
        }
        if (!this.isLiveMode()) {
            return {
                status: "verified",
                nextCheckAt: new Date(Date.now() + this.getProviderConfig().recheckHours * 60 * 60 * 1000),
                metadata: {
                    ...providerMetadata(this.provider),
                    ocspChecked: false,
                    crlChecked: false
                },
                externalVerificationId: signature.certificateSerialNumber
            };
        }
        const config = this.getProviderConfig();
        if (!config.verifySignatureUrl) {
            throw new Error("ACSK live signature verification URL is not configured");
        }
        const auth = await this.buildAuthHeaders();
        const verification = await this.sendProviderRequest({
            provider: this.provider,
            endpoint: config.verifySignatureUrl,
            payload: {
                certificateSerialNumber: signature.certificateSerialNumber,
                certificateIssuer: signature.certificateIssuer,
                signatureHash: signature.signatureHash,
                signatureAlgorithm: signature.signatureAlgorithm,
                signedPayloadHash: signature.signedPayloadHash,
                signatureTime: signature.signatureTime?.toISOString() || null,
                externalVerificationId: signature.externalVerificationId
            },
            auth
        });
        const revocation = await this.executeOcspAndCrlChecks(signature.certificateSerialNumber, signature.certificateIssuer);
        if (revocation.revocationReason) {
            return {
                status: "revoked",
                reason: revocation.revocationReason,
                metadata: {
                    ...providerMetadata(this.provider, "live"),
                    ocspChecked: revocation.ocspChecked,
                    crlChecked: revocation.crlChecked,
                    providerResponse: verification.raw
                },
                externalVerificationId: verification.outcome.externalVerificationId || signature.certificateSerialNumber
            };
        }
        return {
            ...verification.outcome,
            nextCheckAt: verification.outcome.nextCheckAt || new Date(Date.now() + config.recheckHours * 60 * 60 * 1000),
            metadata: {
                ...verification.outcome.metadata || {},
                ocspChecked: revocation.ocspChecked,
                crlChecked: revocation.crlChecked,
                providerResponse: verification.raw
            },
            externalVerificationId: verification.outcome.externalVerificationId || signature.certificateSerialNumber
        };
    }
    async verifyIdentity(identity) {
        if (!identity.externalSubjectId || !identity.certificateSerialNumber || !identity.certificateIssuer) {
            return {
                status: "failed",
                reason: "ACSK identity verification requires subject, certificate serial, and issuer",
                metadata: providerMetadata(this.provider)
            };
        }
        if (!this.isLiveMode()) {
            return {
                status: "verified",
                nextCheckAt: new Date(Date.now() + this.getProviderConfig().recheckHours * 60 * 60 * 1000),
                metadata: {
                    ...providerMetadata(this.provider),
                    ocspChecked: false,
                    crlChecked: false
                },
                externalVerificationId: identity.certificateSerialNumber
            };
        }
        const config = this.getProviderConfig();
        if (!config.verifyIdentityUrl) {
            throw new Error("ACSK live identity verification URL is not configured");
        }
        const auth = await this.buildAuthHeaders();
        const verification = await this.sendProviderRequest({
            provider: this.provider,
            endpoint: config.verifyIdentityUrl,
            payload: {
                externalSubjectId: identity.externalSubjectId,
                displayName: identity.displayName,
                certificateSerialNumber: identity.certificateSerialNumber,
                certificateIssuer: identity.certificateIssuer,
                taxIdHash: identity.taxIdHash
            },
            auth
        });
        const revocation = await this.executeOcspAndCrlChecks(identity.certificateSerialNumber, identity.certificateIssuer);
        if (revocation.revocationReason) {
            return {
                status: "revoked",
                reason: revocation.revocationReason,
                metadata: {
                    ...providerMetadata(this.provider, "live"),
                    ocspChecked: revocation.ocspChecked,
                    crlChecked: revocation.crlChecked,
                    providerResponse: verification.raw
                },
                externalVerificationId: verification.outcome.externalVerificationId || identity.certificateSerialNumber
            };
        }
        return {
            ...verification.outcome,
            nextCheckAt: verification.outcome.nextCheckAt || new Date(Date.now() + config.recheckHours * 60 * 60 * 1000),
            metadata: {
                ...verification.outcome.metadata || {},
                ocspChecked: revocation.ocspChecked,
                crlChecked: revocation.crlChecked,
                providerResponse: verification.raw
            },
            externalVerificationId: verification.outcome.externalVerificationId || identity.certificateSerialNumber
        };
    }
    constructor(...args){
        super(...args), this.provider = "acsk";
    }
};
AcskTrustProviderAdapter = _ts_decorate([
    (0, _common.Injectable)()
], AcskTrustProviderAdapter);
let DiiaTrustProviderAdapter = class DiiaTrustProviderAdapter extends BaseTrustProviderAdapter {
    getCapabilities() {
        return {
            liveProviderIntegration: this.isLiveMode(),
            supportsCallbacks: true,
            supportsPeriodicRecheck: false,
            supportsOcsp: false,
            supportsCrl: false
        };
    }
    getProviderConfig() {
        return {
            mode: getMode(this.configService, "DIIA_TRUST_MODE"),
            baseUrl: this.configService.get("DIIA_BASE_URL"),
            tokenUrl: this.configService.get("DIIA_TOKEN_URL"),
            verifySignatureUrl: this.configService.get("DIIA_SIGN_VERIFY_URL") || joinUrl(this.configService.get("DIIA_BASE_URL"), "/v1/signatures/verify"),
            verifyIdentityUrl: this.configService.get("DIIA_IDENTITY_VERIFY_URL") || joinUrl(this.configService.get("DIIA_BASE_URL"), "/v1/identities/verify"),
            statusUrl: this.configService.get("DIIA_STATUS_URL") || joinUrl(this.configService.get("DIIA_BASE_URL"), "/v1/status"),
            clientId: this.configService.get("DIIA_CLIENT_ID"),
            clientSecret: this.configService.get("DIIA_CLIENT_SECRET"),
            audience: this.configService.get("DIIA_AUDIENCE"),
            scope: this.configService.get("DIIA_SCOPE"),
            callbackSecret: this.configService.get("DIIA_CALLBACK_SECRET"),
            callbackAuthScheme: "hmac",
            requestTimeoutMs: Number(this.configService.get("TRUST_PROVIDER_TIMEOUT_MS", "10000"))
        };
    }
    async verifySignature(signature) {
        if (!signature.signatureHash || !signature.signedPayloadHash) {
            return {
                status: "failed",
                reason: "Diia signature verification requires payload and signature hash",
                metadata: providerMetadata(this.provider)
            };
        }
        if (!this.isLiveMode()) {
            return {
                status: "verified",
                nextCheckAt: null,
                metadata: providerMetadata(this.provider),
                externalVerificationId: getString(signature.metadata?.diiaRequestId) || signature.signatureHash
            };
        }
        const endpoint = this.getProviderConfig().verifySignatureUrl;
        if (!endpoint) {
            throw new Error("Diia live signature verification URL is not configured");
        }
        const auth = await this.buildAuthHeaders();
        const verification = await this.sendProviderRequest({
            provider: this.provider,
            endpoint,
            payload: {
                signatureHash: signature.signatureHash,
                signedPayloadHash: signature.signedPayloadHash,
                signatureAlgorithm: signature.signatureAlgorithm,
                requestId: signature.metadata?.diiaRequestId || null
            },
            auth
        });
        return {
            ...verification.outcome,
            metadata: {
                ...verification.outcome.metadata || {},
                providerResponse: verification.raw
            },
            externalVerificationId: verification.outcome.externalVerificationId || getString(signature.metadata?.diiaRequestId) || signature.signatureHash
        };
    }
    async verifyIdentity(identity) {
        if (!identity.externalSubjectId) {
            return {
                status: "failed",
                reason: "Diia identity verification requires external subject id",
                metadata: providerMetadata(this.provider)
            };
        }
        if (!this.isLiveMode()) {
            return {
                status: "verified",
                nextCheckAt: null,
                metadata: providerMetadata(this.provider),
                externalVerificationId: identity.externalSubjectId
            };
        }
        const endpoint = this.getProviderConfig().verifyIdentityUrl;
        if (!endpoint) {
            throw new Error("Diia live identity verification URL is not configured");
        }
        const auth = await this.buildAuthHeaders();
        const verification = await this.sendProviderRequest({
            provider: this.provider,
            endpoint,
            payload: {
                externalSubjectId: identity.externalSubjectId,
                displayName: identity.displayName,
                metadata: identity.metadata || null
            },
            auth
        });
        return {
            ...verification.outcome,
            metadata: {
                ...verification.outcome.metadata || {},
                providerResponse: verification.raw
            },
            externalVerificationId: verification.outcome.externalVerificationId || identity.externalSubjectId
        };
    }
    constructor(...args){
        super(...args), this.provider = "diia";
    }
};
DiiaTrustProviderAdapter = _ts_decorate([
    (0, _common.Injectable)()
], DiiaTrustProviderAdapter);
let BankIdNbuTrustProviderAdapter = class BankIdNbuTrustProviderAdapter extends BaseTrustProviderAdapter {
    getCapabilities() {
        return {
            liveProviderIntegration: this.isLiveMode(),
            supportsCallbacks: true,
            supportsPeriodicRecheck: true,
            supportsOcsp: false,
            supportsCrl: false
        };
    }
    getProviderConfig() {
        return {
            mode: getMode(this.configService, "BANKID_NBU_MODE"),
            tokenUrl: this.configService.get("BANKID_NBU_TOKEN_URL"),
            verifyIdentityUrl: this.configService.get("BANKID_NBU_IDENTITY_URL") || this.configService.get("BANKID_NBU_VERIFY_IDENTITY_URL"),
            statusUrl: this.configService.get("BANKID_NBU_STATUS_URL"),
            clientId: this.configService.get("BANKID_CLIENT_ID"),
            clientSecret: this.configService.get("BANKID_CLIENT_SECRET"),
            scope: this.configService.get("BANKID_NBU_SCOPE"),
            callbackSecret: this.configService.get("BANKID_NBU_CALLBACK_SECRET"),
            callbackAuthScheme: "hmac",
            recheckHours: Number(this.configService.get("BANKID_NBU_RECHECK_HOURS", "168")),
            requestTimeoutMs: Number(this.configService.get("TRUST_PROVIDER_TIMEOUT_MS", "10000"))
        };
    }
    async verifySignature() {
        return {
            status: "failed",
            reason: "BankID NBU is supported for identity verification but not document signature verification",
            metadata: providerMetadata(this.provider)
        };
    }
    async verifyIdentity(identity) {
        if (!identity.externalSubjectId || !identity.assuranceLevel) {
            return {
                status: "failed",
                reason: "BankID NBU identity verification requires subject id and assurance level",
                metadata: providerMetadata(this.provider)
            };
        }
        if (!this.isLiveMode()) {
            return {
                status: "verified",
                nextCheckAt: new Date(Date.now() + this.getProviderConfig().recheckHours * 60 * 60 * 1000),
                metadata: providerMetadata(this.provider),
                externalVerificationId: identity.externalSubjectId
            };
        }
        const endpoint = this.getProviderConfig().verifyIdentityUrl;
        if (!endpoint) {
            throw new Error("BankID NBU live identity URL is not configured");
        }
        const auth = await this.buildAuthHeaders();
        const verification = await this.sendProviderRequest({
            provider: this.provider,
            endpoint,
            payload: {
                externalSubjectId: identity.externalSubjectId,
                assuranceLevel: identity.assuranceLevel,
                taxIdHash: identity.taxIdHash,
                metadata: identity.metadata || null
            },
            auth
        });
        return {
            ...verification.outcome,
            nextCheckAt: verification.outcome.nextCheckAt || new Date(Date.now() + this.getProviderConfig().recheckHours * 60 * 60 * 1000),
            metadata: {
                ...verification.outcome.metadata || {},
                providerResponse: verification.raw
            },
            externalVerificationId: verification.outcome.externalVerificationId || identity.externalSubjectId
        };
    }
    constructor(...args){
        super(...args), this.provider = "bankid_nbu";
    }
};
BankIdNbuTrustProviderAdapter = _ts_decorate([
    (0, _common.Injectable)()
], BankIdNbuTrustProviderAdapter);
let ManualTrustProviderAdapter = class ManualTrustProviderAdapter extends BaseTrustProviderAdapter {
    getCapabilities() {
        return {
            liveProviderIntegration: false,
            supportsCallbacks: false,
            supportsPeriodicRecheck: false,
            supportsOcsp: false,
            supportsCrl: false
        };
    }
    getProviderConfig() {
        return {
            mode: "stub",
            requestTimeoutMs: Number(this.configService.get("TRUST_PROVIDER_TIMEOUT_MS", "10000"))
        };
    }
    async verifySignature(signature) {
        if (!signature.signatureHash) {
            return {
                status: "failed",
                reason: "Manual verification requires a signature hash",
                metadata: providerMetadata(this.provider)
            };
        }
        return {
            status: "verified",
            metadata: providerMetadata(this.provider),
            externalVerificationId: signature.signatureHash
        };
    }
    async verifyIdentity() {
        return {
            status: "failed",
            reason: "Manual provider is not supported for identity verification",
            metadata: providerMetadata(this.provider)
        };
    }
    constructor(...args){
        super(...args), this.provider = "manual";
    }
};
ManualTrustProviderAdapter = _ts_decorate([
    (0, _common.Injectable)()
], ManualTrustProviderAdapter);
function getMode(configService, configKey) {
    return configService.get(configKey, "stub") === "live" ? "live" : "stub";
}
function joinUrl(baseUrl, path) {
    if (!baseUrl || !path) {
        return undefined;
    }
    return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
function normalizeProviderResponse(data) {
    if (data && typeof data === "object" && !Array.isArray(data)) {
        return data;
    }
    return {
        value: data
    };
}
function mapRemoteOutcome(provider, payload, mode) {
    const status = normalizeOutcomeStatus(getString(payload.status) || getString(payload.result) || getString(payload.verificationStatus) || getString(payload.state) || getString(payload.code));
    return {
        status,
        reason: getString(payload.reason) || getString(payload.message) || getString(payload.error_description) || getString(payload.error),
        externalVerificationId: getString(payload.externalVerificationId) || getString(payload.verificationId) || getString(payload.requestId) || getString(payload.reference),
        nextCheckAt: parseDate(payload.nextCheckAt || payload.next_check_at || payload.recheckAt),
        metadata: {
            ...providerMetadata(provider, mode),
            upstreamStatus: getString(payload.status) || getString(payload.result) || getString(payload.verificationStatus) || null,
            assuranceLevel: getString(payload.assuranceLevel) || getString(payload.assurance_level) || null
        }
    };
}
function normalizeOutcomeStatus(status) {
    const value = (status || "").toLowerCase();
    if ([
        "verified",
        "success",
        "succeeded",
        "valid",
        "approved",
        "ok",
        "active",
        "completed"
    ].includes(value)) {
        return "verified";
    }
    if ([
        "revoked",
        "invalid",
        "expired",
        "blocked"
    ].includes(value)) {
        return "revoked";
    }
    if ([
        "pending",
        "queued",
        "processing",
        "in_progress",
        "retry"
    ].includes(value)) {
        return "retry";
    }
    return "failed";
}
function parseDate(value) {
    if (!value || typeof value !== "string") {
        return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function getString(value) {
    return typeof value === "string" && value.trim() ? value : undefined;
}
function mapCallbackPayload(provider, payload, mode, currentStatus) {
    const event = getString(payload.event) || getString(payload.status) || getString(payload.result) || "failed";
    const outcome = normalizeOutcomeStatus(event);
    const reason = getString(payload.reason) || getString(payload.message) || (outcome === "revoked" && currentStatus === "revoked" ? "Provider confirmed existing revocation" : undefined);
    return {
        status: outcome,
        reason: reason || (outcome === "retry" ? "Provider requested retry" : outcome === "revoked" ? "Provider reported revocation" : outcome === "verified" ? undefined : "Provider reported verification failure"),
        metadata: {
            ...providerMetadata(provider, mode),
            callback: true,
            previousStatus: currentStatus,
            ...payload.metadata || {}
        },
        externalVerificationId: getString(payload.externalVerificationId) || getString(payload.metadata?.externalVerificationId),
        nextCheckAt: parseDate(payload.nextCheckAt || payload.next_check_at)
    };
}

//# sourceMappingURL=trust-provider.adapters.js.map