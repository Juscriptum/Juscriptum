import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosRequestConfig } from "axios";
import {
  DocumentSignature,
  SignatureVerificationStatus,
} from "../../database/entities/DocumentSignature.entity";
import {
  TrustProviderType,
  TrustVerificationStatus,
  UserIdentity,
} from "../../database/entities/UserIdentity.entity";

export type TrustVerificationOutcomeStatus =
  | "verified"
  | "failed"
  | "revoked"
  | "retry";

export interface TrustVerificationOutcome {
  status: TrustVerificationOutcomeStatus;
  reason?: string;
  metadata?: Record<string, any>;
  externalVerificationId?: string;
  nextCheckAt?: Date | null;
}

export interface TrustProviderCapabilities {
  liveProviderIntegration: boolean;
  supportsCallbacks: boolean;
  supportsPeriodicRecheck: boolean;
  supportsOcsp: boolean;
  supportsCrl: boolean;
}

export interface TrustProviderAdapter {
  readonly provider: TrustProviderType;
  getCapabilities(): TrustProviderCapabilities;
  verifySignature(
    signature: DocumentSignature,
  ): Promise<TrustVerificationOutcome>;
  verifyIdentity(identity: UserIdentity): Promise<TrustVerificationOutcome>;
  handleCallback(
    payload: Record<string, any>,
    currentStatus?: SignatureVerificationStatus | TrustVerificationStatus,
  ): Promise<TrustVerificationOutcome>;
}

type TrustProviderConfig = {
  mode: "stub" | "live";
  baseUrl?: string;
  tokenUrl?: string;
  verifySignatureUrl?: string;
  verifyIdentityUrl?: string;
  statusUrl?: string;
  ocspUrl?: string;
  crlUrl?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  audience?: string;
  scope?: string;
  callbackSecret?: string;
  callbackAuthScheme?: "hmac" | "shared-secret";
  recheckHours?: number;
  requestTimeoutMs: number;
};

type HttpVerificationRequest = {
  provider: TrustProviderType;
  endpoint: string;
  payload: Record<string, any>;
  auth?: {
    bearerToken?: string;
    basicAuth?: {
      username: string;
      password: string;
    };
    headers?: Record<string, string>;
  };
};

type HttpVerificationResponse = {
  outcome: TrustVerificationOutcome;
  raw: Record<string, any>;
};

function providerMetadata(
  provider: TrustProviderType,
  mode: "stub" | "live" = "stub",
): Record<string, any> {
  return {
    providerMode: mode,
    liveIntegration: mode === "live",
    provider,
  };
}

abstract class BaseTrustProviderAdapter implements TrustProviderAdapter {
  abstract readonly provider: TrustProviderType;

  constructor(protected readonly configService: ConfigService) {}

  abstract getCapabilities(): TrustProviderCapabilities;

  protected abstract getProviderConfig(): TrustProviderConfig;

  abstract verifySignature(
    signature: DocumentSignature,
  ): Promise<TrustVerificationOutcome>;

  abstract verifyIdentity(
    identity: UserIdentity,
  ): Promise<TrustVerificationOutcome>;

  async handleCallback(
    payload: Record<string, any>,
    currentStatus?: SignatureVerificationStatus | TrustVerificationStatus,
  ): Promise<TrustVerificationOutcome> {
    if (this.isLiveMode() && this.getProviderConfig().statusUrl) {
      const resolved = await this.resolveCallbackStatus(payload);
      if (resolved) {
        return resolved;
      }
    }

    return mapCallbackPayload(
      this.provider,
      payload,
      this.getProviderConfig().mode,
      currentStatus,
    );
  }

  protected isLiveMode(): boolean {
    return this.getProviderConfig().mode === "live";
  }

  protected async resolveCallbackStatus(
    payload: Record<string, any>,
  ): Promise<TrustVerificationOutcome | null> {
    const config = this.getProviderConfig();
    const statusReference =
      getString(payload.externalVerificationId) ||
      getString(payload.metadata?.externalVerificationId) ||
      getString(payload.metadata?.statusReference) ||
      getString(payload.metadata?.requestId) ||
      getString(payload.metadata?.authorizationCode);

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
        currentMetadata: payload.metadata || null,
      },
      auth,
    });

    return outcome;
  }

  protected async buildAuthHeaders(): Promise<HttpVerificationRequest["auth"]> {
    const config = this.getProviderConfig();

    if (config.clientId && config.clientSecret && config.tokenUrl) {
      const token = await this.fetchClientCredentialsToken();
      return {
        bearerToken: token,
        headers: this.buildStaticHeaders(),
      };
    }

    if (config.clientId && config.clientSecret && !config.tokenUrl) {
      return {
        basicAuth: {
          username: config.clientId,
          password: config.clientSecret,
        },
        headers: this.buildStaticHeaders(),
      };
    }

    return {
      headers: this.buildStaticHeaders(),
    };
  }

  protected buildStaticHeaders(): Record<string, string> {
    const config = this.getProviderConfig();
    return {
      ...(config.apiKey
        ? {
            "x-api-key": config.apiKey,
          }
        : {}),
    };
  }

  protected async fetchClientCredentialsToken(): Promise<string> {
    const config = this.getProviderConfig();
    if (!config.tokenUrl || !config.clientId || !config.clientSecret) {
      throw new Error(`${this.provider} token exchange is not configured`);
    }

    const response = await axios.post(
      config.tokenUrl,
      {
        grant_type: "client_credentials",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        ...(config.scope ? { scope: config.scope } : {}),
        ...(config.audience ? { audience: config.audience } : {}),
      },
      {
        timeout: config.requestTimeoutMs,
      },
    );

    const token =
      getString(response.data?.access_token) ||
      getString(response.data?.token) ||
      getString(response.data?.id_token);
    if (!token) {
      throw new Error(
        `${this.provider} token response did not include a token`,
      );
    }

    return token;
  }

  protected async sendProviderRequest(
    request: HttpVerificationRequest,
  ): Promise<HttpVerificationResponse> {
    const config = this.getProviderConfig();
    const axiosConfig: AxiosRequestConfig = {
      timeout: config.requestTimeoutMs,
      headers: {
        "Content-Type": "application/json",
        ...(request.auth?.headers || {}),
        ...(request.auth?.bearerToken
          ? { Authorization: `Bearer ${request.auth.bearerToken}` }
          : {}),
      },
      auth: request.auth?.basicAuth,
    };

    const response = await axios.post(
      request.endpoint,
      request.payload,
      axiosConfig,
    );

    const raw = normalizeProviderResponse(response.data);
    return {
      raw,
      outcome: mapRemoteOutcome(this.provider, raw, config.mode),
    };
  }

  protected async executeOcspAndCrlChecks(
    certificateSerialNumber: string,
    certificateIssuer: string,
  ): Promise<{
    ocspChecked: boolean;
    crlChecked: boolean;
    revocationReason?: string;
  }> {
    const config = this.getProviderConfig();
    let ocspChecked = false;
    let crlChecked = false;
    let revocationReason: string | undefined;

    if (config.ocspUrl) {
      const auth = await this.buildAuthHeaders();
      const { outcome } = await this.sendProviderRequest({
        provider: this.provider,
        endpoint: config.ocspUrl,
        payload: {
          certificateSerialNumber,
          certificateIssuer,
        },
        auth,
      });
      ocspChecked = true;
      if (outcome.status === "revoked" || outcome.status === "failed") {
        revocationReason =
          outcome.reason || "Certificate failed OCSP validation";
      }
    }

    if (!revocationReason && config.crlUrl) {
      const auth = await this.buildAuthHeaders();
      const { outcome } = await this.sendProviderRequest({
        provider: this.provider,
        endpoint: config.crlUrl,
        payload: {
          certificateSerialNumber,
          certificateIssuer,
        },
        auth,
      });
      crlChecked = true;
      if (outcome.status === "revoked" || outcome.status === "failed") {
        revocationReason = outcome.reason || "Certificate is present in CRL";
      }
    }

    return {
      ocspChecked,
      crlChecked,
      revocationReason,
    };
  }
}

@Injectable()
export class AcskTrustProviderAdapter
  extends BaseTrustProviderAdapter
  implements TrustProviderAdapter
{
  readonly provider = "acsk" as const;

  getCapabilities(): TrustProviderCapabilities {
    return {
      liveProviderIntegration: this.isLiveMode(),
      supportsCallbacks: true,
      supportsPeriodicRecheck: true,
      supportsOcsp: true,
      supportsCrl: true,
    };
  }

  protected getProviderConfig(): TrustProviderConfig {
    return {
      mode: getMode(this.configService, "ACSK_TRUST_MODE"),
      verifySignatureUrl: this.configService.get<string>(
        "ACSK_TRUST_VERIFY_SIGNATURE_URL",
      ),
      verifyIdentityUrl: this.configService.get<string>(
        "ACSK_TRUST_VERIFY_IDENTITY_URL",
      ),
      statusUrl: this.configService.get<string>("ACSK_TRUST_STATUS_URL"),
      ocspUrl: this.configService.get<string>("ACSK_TRUST_OCSP_URL"),
      crlUrl: this.configService.get<string>("ACSK_TRUST_CRL_URL"),
      apiKey: this.configService.get<string>("ACSK_TRUST_API_KEY"),
      callbackSecret: this.configService.get<string>(
        "ACSK_TRUST_CALLBACK_SECRET",
      ),
      callbackAuthScheme: "hmac",
      recheckHours: Number(
        this.configService.get<string>("ACSK_TRUST_RECHECK_HOURS", "24"),
      ),
      requestTimeoutMs: Number(
        this.configService.get<string>("TRUST_PROVIDER_TIMEOUT_MS", "10000"),
      ),
    };
  }

  async verifySignature(
    signature: DocumentSignature,
  ): Promise<TrustVerificationOutcome> {
    if (
      !signature.certificateSerialNumber ||
      !signature.certificateIssuer ||
      !signature.signatureHash ||
      !signature.signedPayloadHash
    ) {
      return {
        status: "failed",
        reason:
          "ACSK verification requires certificate serial, issuer, signature hash, and signed payload hash",
        metadata: {
          ...providerMetadata(this.provider),
          ocspChecked: false,
          crlChecked: false,
        },
      };
    }

    if (!this.isLiveMode()) {
      return {
        status: "verified",
        nextCheckAt: new Date(
          Date.now() + this.getProviderConfig().recheckHours! * 60 * 60 * 1000,
        ),
        metadata: {
          ...providerMetadata(this.provider),
          ocspChecked: false,
          crlChecked: false,
        },
        externalVerificationId: signature.certificateSerialNumber,
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
        externalVerificationId: signature.externalVerificationId,
      },
      auth,
    });

    const revocation = await this.executeOcspAndCrlChecks(
      signature.certificateSerialNumber,
      signature.certificateIssuer,
    );
    if (revocation.revocationReason) {
      return {
        status: "revoked",
        reason: revocation.revocationReason,
        metadata: {
          ...providerMetadata(this.provider, "live"),
          ocspChecked: revocation.ocspChecked,
          crlChecked: revocation.crlChecked,
          providerResponse: verification.raw,
        },
        externalVerificationId:
          verification.outcome.externalVerificationId ||
          signature.certificateSerialNumber,
      };
    }

    return {
      ...verification.outcome,
      nextCheckAt:
        verification.outcome.nextCheckAt ||
        new Date(Date.now() + config.recheckHours! * 60 * 60 * 1000),
      metadata: {
        ...(verification.outcome.metadata || {}),
        ocspChecked: revocation.ocspChecked,
        crlChecked: revocation.crlChecked,
        providerResponse: verification.raw,
      },
      externalVerificationId:
        verification.outcome.externalVerificationId ||
        signature.certificateSerialNumber,
    };
  }

  async verifyIdentity(
    identity: UserIdentity,
  ): Promise<TrustVerificationOutcome> {
    if (
      !identity.externalSubjectId ||
      !identity.certificateSerialNumber ||
      !identity.certificateIssuer
    ) {
      return {
        status: "failed",
        reason:
          "ACSK identity verification requires subject, certificate serial, and issuer",
        metadata: providerMetadata(this.provider),
      };
    }

    if (!this.isLiveMode()) {
      return {
        status: "verified",
        nextCheckAt: new Date(
          Date.now() + this.getProviderConfig().recheckHours! * 60 * 60 * 1000,
        ),
        metadata: {
          ...providerMetadata(this.provider),
          ocspChecked: false,
          crlChecked: false,
        },
        externalVerificationId: identity.certificateSerialNumber,
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
        taxIdHash: identity.taxIdHash,
      },
      auth,
    });

    const revocation = await this.executeOcspAndCrlChecks(
      identity.certificateSerialNumber,
      identity.certificateIssuer,
    );
    if (revocation.revocationReason) {
      return {
        status: "revoked",
        reason: revocation.revocationReason,
        metadata: {
          ...providerMetadata(this.provider, "live"),
          ocspChecked: revocation.ocspChecked,
          crlChecked: revocation.crlChecked,
          providerResponse: verification.raw,
        },
        externalVerificationId:
          verification.outcome.externalVerificationId ||
          identity.certificateSerialNumber,
      };
    }

    return {
      ...verification.outcome,
      nextCheckAt:
        verification.outcome.nextCheckAt ||
        new Date(Date.now() + config.recheckHours! * 60 * 60 * 1000),
      metadata: {
        ...(verification.outcome.metadata || {}),
        ocspChecked: revocation.ocspChecked,
        crlChecked: revocation.crlChecked,
        providerResponse: verification.raw,
      },
      externalVerificationId:
        verification.outcome.externalVerificationId ||
        identity.certificateSerialNumber,
    };
  }
}

@Injectable()
export class DiiaTrustProviderAdapter
  extends BaseTrustProviderAdapter
  implements TrustProviderAdapter
{
  readonly provider = "diia" as const;

  getCapabilities(): TrustProviderCapabilities {
    return {
      liveProviderIntegration: this.isLiveMode(),
      supportsCallbacks: true,
      supportsPeriodicRecheck: false,
      supportsOcsp: false,
      supportsCrl: false,
    };
  }

  protected getProviderConfig(): TrustProviderConfig {
    return {
      mode: getMode(this.configService, "DIIA_TRUST_MODE"),
      baseUrl: this.configService.get<string>("DIIA_BASE_URL"),
      tokenUrl: this.configService.get<string>("DIIA_TOKEN_URL"),
      verifySignatureUrl:
        this.configService.get<string>("DIIA_SIGN_VERIFY_URL") ||
        joinUrl(
          this.configService.get<string>("DIIA_BASE_URL"),
          "/v1/signatures/verify",
        ),
      verifyIdentityUrl:
        this.configService.get<string>("DIIA_IDENTITY_VERIFY_URL") ||
        joinUrl(
          this.configService.get<string>("DIIA_BASE_URL"),
          "/v1/identities/verify",
        ),
      statusUrl:
        this.configService.get<string>("DIIA_STATUS_URL") ||
        joinUrl(this.configService.get<string>("DIIA_BASE_URL"), "/v1/status"),
      clientId: this.configService.get<string>("DIIA_CLIENT_ID"),
      clientSecret: this.configService.get<string>("DIIA_CLIENT_SECRET"),
      audience: this.configService.get<string>("DIIA_AUDIENCE"),
      scope: this.configService.get<string>("DIIA_SCOPE"),
      callbackSecret: this.configService.get<string>("DIIA_CALLBACK_SECRET"),
      callbackAuthScheme: "hmac",
      requestTimeoutMs: Number(
        this.configService.get<string>("TRUST_PROVIDER_TIMEOUT_MS", "10000"),
      ),
    };
  }

  async verifySignature(
    signature: DocumentSignature,
  ): Promise<TrustVerificationOutcome> {
    if (!signature.signatureHash || !signature.signedPayloadHash) {
      return {
        status: "failed",
        reason:
          "Diia signature verification requires payload and signature hash",
        metadata: providerMetadata(this.provider),
      };
    }

    if (!this.isLiveMode()) {
      return {
        status: "verified",
        nextCheckAt: null,
        metadata: providerMetadata(this.provider),
        externalVerificationId:
          getString(signature.metadata?.diiaRequestId) ||
          signature.signatureHash,
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
        requestId: signature.metadata?.diiaRequestId || null,
      },
      auth,
    });

    return {
      ...verification.outcome,
      metadata: {
        ...(verification.outcome.metadata || {}),
        providerResponse: verification.raw,
      },
      externalVerificationId:
        verification.outcome.externalVerificationId ||
        getString(signature.metadata?.diiaRequestId) ||
        signature.signatureHash,
    };
  }

  async verifyIdentity(
    identity: UserIdentity,
  ): Promise<TrustVerificationOutcome> {
    if (!identity.externalSubjectId) {
      return {
        status: "failed",
        reason: "Diia identity verification requires external subject id",
        metadata: providerMetadata(this.provider),
      };
    }

    if (!this.isLiveMode()) {
      return {
        status: "verified",
        nextCheckAt: null,
        metadata: providerMetadata(this.provider),
        externalVerificationId: identity.externalSubjectId,
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
        metadata: identity.metadata || null,
      },
      auth,
    });

    return {
      ...verification.outcome,
      metadata: {
        ...(verification.outcome.metadata || {}),
        providerResponse: verification.raw,
      },
      externalVerificationId:
        verification.outcome.externalVerificationId ||
        identity.externalSubjectId,
    };
  }
}

@Injectable()
export class BankIdNbuTrustProviderAdapter
  extends BaseTrustProviderAdapter
  implements TrustProviderAdapter
{
  readonly provider = "bankid_nbu" as const;

  getCapabilities(): TrustProviderCapabilities {
    return {
      liveProviderIntegration: this.isLiveMode(),
      supportsCallbacks: true,
      supportsPeriodicRecheck: true,
      supportsOcsp: false,
      supportsCrl: false,
    };
  }

  protected getProviderConfig(): TrustProviderConfig {
    return {
      mode: getMode(this.configService, "BANKID_NBU_MODE"),
      tokenUrl: this.configService.get<string>("BANKID_NBU_TOKEN_URL"),
      verifyIdentityUrl:
        this.configService.get<string>("BANKID_NBU_IDENTITY_URL") ||
        this.configService.get<string>("BANKID_NBU_VERIFY_IDENTITY_URL"),
      statusUrl: this.configService.get<string>("BANKID_NBU_STATUS_URL"),
      clientId: this.configService.get<string>("BANKID_CLIENT_ID"),
      clientSecret: this.configService.get<string>("BANKID_CLIENT_SECRET"),
      scope: this.configService.get<string>("BANKID_NBU_SCOPE"),
      callbackSecret: this.configService.get<string>(
        "BANKID_NBU_CALLBACK_SECRET",
      ),
      callbackAuthScheme: "hmac",
      recheckHours: Number(
        this.configService.get<string>("BANKID_NBU_RECHECK_HOURS", "168"),
      ),
      requestTimeoutMs: Number(
        this.configService.get<string>("TRUST_PROVIDER_TIMEOUT_MS", "10000"),
      ),
    };
  }

  async verifySignature(): Promise<TrustVerificationOutcome> {
    return {
      status: "failed",
      reason:
        "BankID NBU is supported for identity verification but not document signature verification",
      metadata: providerMetadata(this.provider),
    };
  }

  async verifyIdentity(
    identity: UserIdentity,
  ): Promise<TrustVerificationOutcome> {
    if (!identity.externalSubjectId || !identity.assuranceLevel) {
      return {
        status: "failed",
        reason:
          "BankID NBU identity verification requires subject id and assurance level",
        metadata: providerMetadata(this.provider),
      };
    }

    if (!this.isLiveMode()) {
      return {
        status: "verified",
        nextCheckAt: new Date(
          Date.now() + this.getProviderConfig().recheckHours! * 60 * 60 * 1000,
        ),
        metadata: providerMetadata(this.provider),
        externalVerificationId: identity.externalSubjectId,
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
        metadata: identity.metadata || null,
      },
      auth,
    });

    return {
      ...verification.outcome,
      nextCheckAt:
        verification.outcome.nextCheckAt ||
        new Date(
          Date.now() + this.getProviderConfig().recheckHours! * 60 * 60 * 1000,
        ),
      metadata: {
        ...(verification.outcome.metadata || {}),
        providerResponse: verification.raw,
      },
      externalVerificationId:
        verification.outcome.externalVerificationId ||
        identity.externalSubjectId,
    };
  }
}

@Injectable()
export class ManualTrustProviderAdapter
  extends BaseTrustProviderAdapter
  implements TrustProviderAdapter
{
  readonly provider = "manual" as const;

  getCapabilities(): TrustProviderCapabilities {
    return {
      liveProviderIntegration: false,
      supportsCallbacks: false,
      supportsPeriodicRecheck: false,
      supportsOcsp: false,
      supportsCrl: false,
    };
  }

  protected getProviderConfig(): TrustProviderConfig {
    return {
      mode: "stub",
      requestTimeoutMs: Number(
        this.configService.get<string>("TRUST_PROVIDER_TIMEOUT_MS", "10000"),
      ),
    };
  }

  async verifySignature(
    signature: DocumentSignature,
  ): Promise<TrustVerificationOutcome> {
    if (!signature.signatureHash) {
      return {
        status: "failed",
        reason: "Manual verification requires a signature hash",
        metadata: providerMetadata(this.provider),
      };
    }

    return {
      status: "verified",
      metadata: providerMetadata(this.provider),
      externalVerificationId: signature.signatureHash,
    };
  }

  async verifyIdentity(): Promise<TrustVerificationOutcome> {
    return {
      status: "failed",
      reason: "Manual provider is not supported for identity verification",
      metadata: providerMetadata(this.provider),
    };
  }
}

function getMode(
  configService: ConfigService,
  configKey: string,
): "stub" | "live" {
  return configService.get<string>(configKey, "stub") === "live"
    ? "live"
    : "stub";
}

function joinUrl(baseUrl?: string, path?: string): string | undefined {
  if (!baseUrl || !path) {
    return undefined;
  }

  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function normalizeProviderResponse(data: any): Record<string, any> {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, any>;
  }

  return {
    value: data,
  };
}

function mapRemoteOutcome(
  provider: TrustProviderType,
  payload: Record<string, any>,
  mode: "stub" | "live",
): TrustVerificationOutcome {
  const status = normalizeOutcomeStatus(
    getString(payload.status) ||
      getString(payload.result) ||
      getString(payload.verificationStatus) ||
      getString(payload.state) ||
      getString(payload.code),
  );

  return {
    status,
    reason:
      getString(payload.reason) ||
      getString(payload.message) ||
      getString(payload.error_description) ||
      getString(payload.error),
    externalVerificationId:
      getString(payload.externalVerificationId) ||
      getString(payload.verificationId) ||
      getString(payload.requestId) ||
      getString(payload.reference),
    nextCheckAt: parseDate(
      payload.nextCheckAt || payload.next_check_at || payload.recheckAt,
    ),
    metadata: {
      ...providerMetadata(provider, mode),
      upstreamStatus:
        getString(payload.status) ||
        getString(payload.result) ||
        getString(payload.verificationStatus) ||
        null,
      assuranceLevel:
        getString(payload.assuranceLevel) ||
        getString(payload.assurance_level) ||
        null,
    },
  };
}

function normalizeOutcomeStatus(
  status?: string,
): TrustVerificationOutcomeStatus {
  const value = (status || "").toLowerCase();
  if (
    [
      "verified",
      "success",
      "succeeded",
      "valid",
      "approved",
      "ok",
      "active",
      "completed",
    ].includes(value)
  ) {
    return "verified";
  }

  if (["revoked", "invalid", "expired", "blocked"].includes(value)) {
    return "revoked";
  }

  if (
    ["pending", "queued", "processing", "in_progress", "retry"].includes(value)
  ) {
    return "retry";
  }

  return "failed";
}

function parseDate(value: unknown): Date | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function mapCallbackPayload(
  provider: TrustProviderType,
  payload: Record<string, any>,
  mode: "stub" | "live",
  currentStatus?: SignatureVerificationStatus | TrustVerificationStatus,
): TrustVerificationOutcome {
  const event =
    getString(payload.event) ||
    getString(payload.status) ||
    getString(payload.result) ||
    "failed";

  const outcome = normalizeOutcomeStatus(event);
  const reason =
    getString(payload.reason) ||
    getString(payload.message) ||
    (outcome === "revoked" && currentStatus === "revoked"
      ? "Provider confirmed existing revocation"
      : undefined);

  return {
    status: outcome,
    reason:
      reason ||
      (outcome === "retry"
        ? "Provider requested retry"
        : outcome === "revoked"
          ? "Provider reported revocation"
          : outcome === "verified"
            ? undefined
            : "Provider reported verification failure"),
    metadata: {
      ...providerMetadata(provider, mode),
      callback: true,
      previousStatus: currentStatus,
      ...(payload.metadata || {}),
    },
    externalVerificationId:
      getString(payload.externalVerificationId) ||
      getString(payload.metadata?.externalVerificationId),
    nextCheckAt: parseDate(payload.nextCheckAt || payload.next_check_at),
  };
}
