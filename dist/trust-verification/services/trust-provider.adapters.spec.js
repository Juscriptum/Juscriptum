"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _axios = /*#__PURE__*/ _interop_require_default(require("axios"));
const _DocumentSignatureentity = require("../../database/entities/DocumentSignature.entity");
const _UserIdentityentity = require("../../database/entities/UserIdentity.entity");
const _trustprovideradapters = require("./trust-provider.adapters");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
jest.mock("axios");
const mockedAxios = _axios.default;
describe("TrustProviderAdapters", ()=>{
    afterEach(()=>{
        jest.clearAllMocks();
    });
    it("runs ACSK live verification and appends OCSP/CRL metadata", async ()=>{
        const configService = createConfigService({
            ACSK_TRUST_MODE: "live",
            ACSK_TRUST_VERIFY_SIGNATURE_URL: "https://acsk.example/verify-signature",
            ACSK_TRUST_OCSP_URL: "https://acsk.example/ocsp",
            ACSK_TRUST_CRL_URL: "https://acsk.example/crl",
            TRUST_PROVIDER_TIMEOUT_MS: "5000"
        });
        const adapter = new _trustprovideradapters.AcskTrustProviderAdapter(configService);
        const signature = Object.assign(new _DocumentSignatureentity.DocumentSignature(), {
            certificateSerialNumber: "cert-1",
            certificateIssuer: "issuer-1",
            signatureHash: "sig-1",
            signedPayloadHash: "payload-1",
            signatureAlgorithm: "SHA256"
        });
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                status: "verified",
                verificationId: "upstream-1"
            }
        }).mockResolvedValueOnce({
            data: {
                status: "verified"
            }
        }).mockResolvedValueOnce({
            data: {
                status: "verified"
            }
        });
        const outcome = await adapter.verifySignature(signature);
        expect(outcome.status).toBe("verified");
        expect(outcome.externalVerificationId).toBe("upstream-1");
        expect(outcome.metadata).toEqual(expect.objectContaining({
            providerMode: "live",
            ocspChecked: true,
            crlChecked: true
        }));
        expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });
    it("uses Diia live token exchange before identity verification", async ()=>{
        const configService = createConfigService({
            DIIA_TRUST_MODE: "live",
            DIIA_TOKEN_URL: "https://diia.example/oauth/token",
            DIIA_IDENTITY_VERIFY_URL: "https://diia.example/identities/verify",
            DIIA_CLIENT_ID: "client-id",
            DIIA_CLIENT_SECRET: "client-secret",
            TRUST_PROVIDER_TIMEOUT_MS: "5000"
        });
        const adapter = new _trustprovideradapters.DiiaTrustProviderAdapter(configService);
        const identity = Object.assign(new _UserIdentityentity.UserIdentity(), {
            externalSubjectId: "subject-1",
            metadata: {}
        });
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                access_token: "diia-token"
            }
        }).mockResolvedValueOnce({
            data: {
                status: "verified",
                requestId: "diia-request-1"
            }
        });
        const outcome = await adapter.verifyIdentity(identity);
        expect(outcome.status).toBe("verified");
        expect(outcome.externalVerificationId).toBe("diia-request-1");
        expect(mockedAxios.post).toHaveBeenNthCalledWith(2, "https://diia.example/identities/verify", expect.any(Object), expect.objectContaining({
            headers: expect.objectContaining({
                Authorization: "Bearer diia-token"
            })
        }));
    });
    it("maps BankID live pending responses into retry outcomes", async ()=>{
        const configService = createConfigService({
            BANKID_NBU_MODE: "live",
            BANKID_NBU_TOKEN_URL: "https://bankid.example/oauth/token",
            BANKID_NBU_IDENTITY_URL: "https://bankid.example/identities/verify",
            BANKID_CLIENT_ID: "bankid-client",
            BANKID_CLIENT_SECRET: "bankid-secret",
            TRUST_PROVIDER_TIMEOUT_MS: "5000"
        });
        const adapter = new _trustprovideradapters.BankIdNbuTrustProviderAdapter(configService);
        const identity = Object.assign(new _UserIdentityentity.UserIdentity(), {
            externalSubjectId: "bank-subject-1",
            assuranceLevel: "substantial",
            metadata: {}
        });
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                access_token: "bank-token"
            }
        }).mockResolvedValueOnce({
            data: {
                status: "pending",
                reference: "bank-ref-1"
            }
        });
        const outcome = await adapter.verifyIdentity(identity);
        expect(outcome.status).toBe("retry");
        expect(outcome.externalVerificationId).toBe("bank-ref-1");
    });
});
function createConfigService(values) {
    return {
        get: jest.fn((key, defaultValue)=>key in values ? values[key] : defaultValue)
    };
}

//# sourceMappingURL=trust-provider.adapters.spec.js.map