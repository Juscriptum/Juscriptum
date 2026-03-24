const normalizeBaseUrl = (value?: string): string => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return "/api";
  }

  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

const BASE_URL = `${normalizeBaseUrl(import.meta.env.VITE_API_URL)}/platform-admin`;

export interface PlatformAdminProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  mfaEnabled: boolean;
  status: string;
  lastLoginAt?: string;
}

export interface PlatformAdminBootstrapStatus {
  bootstrapRequired: boolean;
  bootstrapEnabled: boolean;
  hasPlatformAdmins: boolean;
}

export interface PlatformAdminAuthResponse {
  mfaRequired: boolean;
  mfaToken?: string;
  mfaTokenExpiresIn?: number;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  admin?: PlatformAdminProfile;
}

export interface PlatformAdminMfaSetupResponse {
  issuer: string;
  label: string;
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export interface PlatformAdminDashboardAlert {
  id: string;
  type: string;
  severity: "medium" | "high" | "critical";
  message: string;
  organizationId?: string;
  organizationName?: string;
  createdAt: string;
}

export interface PlatformAdminDashboardSummary {
  generatedAt: string;
  organizations: {
    total: number;
    active: number;
    suspended: number;
    provisioning: number;
    trialing: number;
    pastDue: number;
  };
  users: {
    total: number;
    active: number;
    locked: number;
    organizationsWithoutOwnerMfa: number;
  };
  storageBytes: number;
  pendingMalwareScans: number;
  infectedDocuments: number;
  monitoring: {
    readinessStatus: string;
    databaseStatus: string;
    redisStatus: string;
    authStatus: string;
    billingStatus: string;
    trustVerificationStatus: string;
    malwareScanningStatus: string;
    outboxStatus: string;
    trustVerificationDue: number;
    trustVerificationFailed: number;
    malwareScanningDue: number;
    malwareScanningFailed: number;
    infectedLast24h: number;
    outboxPending: number;
    outboxDeadLetterRisk: number;
  };
  alerts: PlatformAdminDashboardAlert[];
}

export interface PlatformAdminOrganizationOwner {
  id?: string;
  fullName: string;
  emailMasked?: string | null;
  mfaEnabled: boolean;
  lastLoginAt?: string | null;
}

export interface PlatformAdminOrganizationSummary {
  id: string;
  name: string;
  status: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  owner: PlatformAdminOrganizationOwner;
  usersCount: number;
  activeUsersCount: number;
  storageBytes: number;
  lastActivityAt?: string | null;
  riskFlags: string[];
  createdAt: string;
}

export interface PlatformAdminOrganizationListResponse {
  items: PlatformAdminOrganizationSummary[];
  page: number;
  limit: number;
  total: number;
}

export interface PlatformAdminOrganizationDetail {
  id: string;
  name: string;
  status: string;
  legalForm: string;
  city?: string | null;
  region?: string | null;
  country: string;
  customDomain?: string | null;
  organizationEmailMasked?: string | null;
  maxUsers: number;
  auditRetentionDays: number;
  owner: PlatformAdminOrganizationOwner;
  billing: {
    subscriptionPlan: string;
    subscriptionStatus: string;
    provider?: string | null;
    amountCents?: number | null;
    currency?: string | null;
    trialEndAt?: string | null;
    currentPeriodEndAt?: string | null;
    cancelAtPeriodEnd: boolean;
    lastSyncedAt?: string | null;
  };
  security: {
    organizationMfaRequired: boolean;
    ownerMfaEnabled: boolean;
    ownersWithoutMfa: number;
    mfaEnabledUsersCount: number;
    lockedUsersCount: number;
    suspendedUsersCount: number;
  };
  ops: {
    documentsCount: number;
    storageBytes: number;
    pendingMalwareScans: number;
    infectedDocuments: number;
    auditEntriesLast30d: number;
    lastActivityAt?: string | null;
  };
  riskFlags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlatformAdminOrganizationUser {
  id: string;
  fullName: string;
  emailMasked?: string | null;
  role: string;
  status: string;
  mfaEnabled: boolean;
  emailVerified: boolean;
  lastLoginAt?: string | null;
  lockedUntil?: string | null;
}

export class PlatformAdminApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = "PlatformAdminApiError";
  }
}

const resolveErrorMessage = (payload: unknown, fallback: string): string => {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as { message?: unknown }).message === "string"
  ) {
    return (payload as { message: string }).message;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    Array.isArray((payload as { message?: unknown }).message)
  ) {
    return (payload as { message: string[] }).message.join(", ");
  }

  return fallback;
};

async function request<T>(
  path: string,
  init?: RequestInit & { token?: string },
): Promise<T> {
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  if (init?.token) {
    headers.set("Authorization", `Bearer ${init.token}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : undefined;

  if (!response.ok) {
    throw new PlatformAdminApiError(
      resolveErrorMessage(payload, "Platform admin request failed"),
      response.status,
      payload,
    );
  }

  return payload as T;
}

export const platformAdminApi = {
  getBootstrapStatus(): Promise<PlatformAdminBootstrapStatus> {
    return request<PlatformAdminBootstrapStatus>("/auth/bootstrap-status");
  },

  bootstrap(payload: {
    bootstrapToken: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<PlatformAdminAuthResponse> {
    return request<PlatformAdminAuthResponse>("/auth/bootstrap", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  login(payload: {
    email: string;
    password: string;
  }): Promise<PlatformAdminAuthResponse> {
    return request<PlatformAdminAuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  verifyMfa(payload: {
    mfaToken: string;
    code: string;
  }): Promise<PlatformAdminAuthResponse> {
    return request<PlatformAdminAuthResponse>("/auth/verify-mfa", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getMe(token: string): Promise<PlatformAdminProfile> {
    return request<PlatformAdminProfile>("/auth/me", {
      method: "GET",
      token,
    });
  },

  setupMfa(token: string): Promise<PlatformAdminMfaSetupResponse> {
    return request<PlatformAdminMfaSetupResponse>("/auth/mfa/setup", {
      method: "POST",
      token,
    });
  },

  confirmMfa(
    token: string,
    payload: { code: string },
  ): Promise<PlatformAdminAuthResponse> {
    return request<PlatformAdminAuthResponse>("/auth/mfa/confirm", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },

  logout(
    token: string,
    payload?: { refreshToken?: string; mfaReason?: string },
  ): Promise<void> {
    return request<void>("/auth/logout", {
      method: "POST",
      token,
      body: payload ? JSON.stringify(payload) : undefined,
    });
  },

  getDashboardSummary(token: string): Promise<PlatformAdminDashboardSummary> {
    return request<PlatformAdminDashboardSummary>("/dashboard/summary", {
      method: "GET",
      token,
    });
  },

  getOrganizations(
    token: string,
    query?: {
      q?: string;
      status?: string;
      plan?: string;
      subscriptionStatus?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PlatformAdminOrganizationListResponse> {
    const params = new URLSearchParams();

    if (query?.q) {
      params.set("q", query.q);
    }

    if (query?.status) {
      params.set("status", query.status);
    }

    if (query?.plan) {
      params.set("plan", query.plan);
    }

    if (query?.subscriptionStatus) {
      params.set("subscriptionStatus", query.subscriptionStatus);
    }

    if (typeof query?.page === "number") {
      params.set("page", String(query.page));
    }

    if (typeof query?.limit === "number") {
      params.set("limit", String(query.limit));
    }

    const suffix = params.size > 0 ? `?${params.toString()}` : "";

    return request<PlatformAdminOrganizationListResponse>(
      `/organizations${suffix}`,
      {
        method: "GET",
        token,
      },
    );
  },

  getOrganizationDetail(
    token: string,
    organizationId: string,
  ): Promise<PlatformAdminOrganizationDetail> {
    return request<PlatformAdminOrganizationDetail>(
      `/organizations/${organizationId}`,
      {
        method: "GET",
        token,
      },
    );
  },

  getOrganizationUsers(
    token: string,
    organizationId: string,
  ): Promise<PlatformAdminOrganizationUser[]> {
    return request<PlatformAdminOrganizationUser[]>(
      `/organizations/${organizationId}/users`,
      {
        method: "GET",
        token,
      },
    );
  },
};
