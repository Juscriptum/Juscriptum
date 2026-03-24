"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _common = require("@nestjs/common");
const _crypto = require("crypto");
const _trustcallbackauthservice = require("./trust-callback-auth.service");
describe("TrustCallbackAuthService", ()=>{
    afterEach(()=>{
        jest.useRealTimers();
    });
    it("accepts provider-signed callbacks once and rejects nonce replay", async ()=>{
        jest.useFakeTimers().setSystemTime(new Date("2026-03-10T12:00:00.000Z"));
        const service = new _trustcallbackauthservice.TrustCallbackAuthService(createConfigService({
            DIIA_CALLBACK_SECRET: "diia-secret",
            REDIS_ENABLED: "false"
        }));
        const body = {
            provider: "diia",
            subjectType: "user_identity",
            subjectId: "550e8400-e29b-41d4-a716-446655440000",
            event: "verified"
        };
        const timestamp = String(Math.floor(new Date("2026-03-10T12:00:00.000Z").getTime() / 1000));
        const nonce = "nonce-1";
        const signature = signPayload("diia", timestamp, nonce, body, "diia-secret");
        await service.assertAuthenticCallback({
            provider: "diia",
            body,
            signature,
            timestamp,
            nonce
        });
        await expect(service.assertAuthenticCallback({
            provider: "diia",
            body,
            signature,
            timestamp,
            nonce
        })).rejects.toBeInstanceOf(_common.UnauthorizedException);
    });
    it("rejects stale signed callbacks", async ()=>{
        jest.useFakeTimers().setSystemTime(new Date("2026-03-10T12:00:00.000Z"));
        const service = new _trustcallbackauthservice.TrustCallbackAuthService(createConfigService({
            DIIA_CALLBACK_SECRET: "diia-secret",
            REDIS_ENABLED: "false",
            TRUST_PROVIDER_CALLBACK_TOLERANCE_SECONDS: "60"
        }));
        const body = {
            provider: "diia",
            subjectType: "user_identity",
            subjectId: "550e8400-e29b-41d4-a716-446655440000",
            event: "verified"
        };
        const timestamp = String(Math.floor(new Date("2026-03-10T11:58:00.000Z").getTime() / 1000));
        await expect(service.assertAuthenticCallback({
            provider: "diia",
            body,
            signature: signPayload("diia", timestamp, "nonce-2", body, "diia-secret"),
            timestamp,
            nonce: "nonce-2"
        })).rejects.toBeInstanceOf(_common.UnauthorizedException);
    });
    it("falls back to legacy shared-secret validation when provider secret is absent", async ()=>{
        const service = new _trustcallbackauthservice.TrustCallbackAuthService(createConfigService({
            TRUST_PROVIDER_WEBHOOK_SECRET: "legacy-secret",
            REDIS_ENABLED: "false"
        }));
        await service.assertAuthenticCallback({
            provider: "manual",
            body: {
                provider: "manual"
            },
            legacySecret: "legacy-secret"
        });
    });
});
function createConfigService(values) {
    return {
        get: jest.fn((key, defaultValue)=>key in values ? values[key] : defaultValue)
    };
}
function signPayload(provider, timestamp, nonce, body, secret) {
    const payload = `${provider}.${timestamp}.${nonce}.${canonicalizeJson(body)}`;
    return (0, _crypto.createHmac)("sha256", secret).update(payload).digest("hex");
}
function canonicalizeJson(value) {
    if (value === null || value === undefined) {
        return "null";
    }
    if (Array.isArray(value)) {
        return `[${value.map((item)=>canonicalizeJson(item)).join(",")}]`;
    }
    if (typeof value === "object") {
        const entries = Object.entries(value).sort(([left], [right])=>left.localeCompare(right));
        return `{${entries.map(([key, item])=>`${JSON.stringify(key)}:${canonicalizeJson(item)}`).join(",")}}`;
    }
    return JSON.stringify(value);
}

//# sourceMappingURL=trust-callback-auth.service.spec.js.map