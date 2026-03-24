import type {
  PlatformAdminAuthResponse,
  PlatformAdminProfile,
} from "./platformAdminApi";

const SESSION_STORAGE_KEY = "law-organizer.platform-admin.session";

export interface PlatformAdminStoredSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  admin: PlatformAdminProfile;
}

const isStoredSession = (
  value: unknown,
): value is PlatformAdminStoredSession => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.accessToken === "string" &&
    typeof candidate.refreshToken === "string" &&
    typeof candidate.expiresIn === "number" &&
    typeof candidate.admin === "object" &&
    candidate.admin !== null
  );
};

export const platformAdminSessionStorage = {
  load(): PlatformAdminStoredSession | null {
    try {
      const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as unknown;
      return isStoredSession(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },

  saveFromAuthResponse(
    payload: PlatformAdminAuthResponse,
  ): PlatformAdminStoredSession {
    if (
      !payload.accessToken ||
      !payload.refreshToken ||
      !payload.expiresIn ||
      !payload.admin
    ) {
      throw new Error(
        "Platform admin auth response does not contain a full session",
      );
    }

    const session: PlatformAdminStoredSession = {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      expiresIn: payload.expiresIn,
      admin: payload.admin,
    };

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    return session;
  },

  save(session: PlatformAdminStoredSession): void {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  },

  clear(): void {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  },
};
