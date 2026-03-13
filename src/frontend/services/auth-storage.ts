import { AuthResponse, Organization, User } from "../types/auth.types";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "auth_user";
const ORGANIZATION_KEY = "auth_organization";
const REMEMBER_ME_KEY = "auth_remember_me";
const TAB_ID_KEY = "auth_tab_id";
const ACTIVE_TAB_IDS_KEY = "auth_active_tab_ids";

type StorageKind = "persistent" | "session";

interface StoredSession {
  user: User;
  organization: Organization;
}

const getStorage = (kind: StorageKind): Storage => {
  return kind === "persistent" ? window.localStorage : window.sessionStorage;
};

const readActiveTabIds = (): string[] => {
  const raw = window.localStorage.getItem(ACTIVE_TAB_IDS_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    );
  } catch {
    return [];
  }
};

const writeActiveTabIds = (tabIds: string[]): void => {
  if (tabIds.length === 0) {
    window.localStorage.removeItem(ACTIVE_TAB_IDS_KEY);
    return;
  }

  window.localStorage.setItem(ACTIVE_TAB_IDS_KEY, JSON.stringify(tabIds));
};

const getOrCreateTabId = (): { id: string; isFreshTab: boolean } => {
  const existing = window.sessionStorage.getItem(TAB_ID_KEY);

  if (existing) {
    return { id: existing, isFreshTab: false };
  }

  const generated =
    window.crypto?.randomUUID?.() ||
    `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.sessionStorage.setItem(TAB_ID_KEY, generated);

  return { id: generated, isFreshTab: true };
};

const shouldRememberSession = (): boolean => {
  return window.localStorage.getItem(REMEMBER_ME_KEY) === "true";
};

const clearStorage = (storage: Storage): void => {
  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
  storage.removeItem(USER_KEY);
  storage.removeItem(ORGANIZATION_KEY);
};

const writeTokens = (
  storage: Storage,
  tokens: Pick<AuthResponse, "accessToken" | "refreshToken">,
): void => {
  storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
};

const writeSession = (storage: Storage, session: StoredSession): void => {
  storage.setItem(USER_KEY, JSON.stringify(session.user));
  storage.setItem(ORGANIZATION_KEY, JSON.stringify(session.organization));
};

const parseSession = (storage: Storage): StoredSession | null => {
  const userRaw = storage.getItem(USER_KEY);
  const organizationRaw = storage.getItem(ORGANIZATION_KEY);

  if (!userRaw || !organizationRaw) {
    return null;
  }

  try {
    return {
      user: JSON.parse(userRaw) as User,
      organization: JSON.parse(organizationRaw) as Organization,
    };
  } catch {
    clearStorage(storage);
    return null;
  }
};

const syncSessionStorage = (
  session: StoredSession,
  tokens: Pick<AuthResponse, "accessToken" | "refreshToken">,
  rememberMe: boolean,
): void => {
  clearStorage(window.sessionStorage);

  if (rememberMe) {
    return;
  }

  writeTokens(window.sessionStorage, tokens);
  writeSession(window.sessionStorage, session);
};

const unregisterCurrentTab = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  const tabId = window.sessionStorage.getItem(TAB_ID_KEY);

  if (!tabId) {
    return;
  }

  const nextTabIds = readActiveTabIds().filter((value) => value !== tabId);
  writeActiveTabIds(nextTabIds);

  if (!shouldRememberSession() && nextTabIds.length === 0) {
    clearStorage(window.localStorage);
    window.localStorage.removeItem(REMEMBER_ME_KEY);
  }
};

const bootstrapTabSession = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  const { id: tabId, isFreshTab } = getOrCreateTabId();
  const activeTabIds = readActiveTabIds();

  if (isFreshTab && !shouldRememberSession() && activeTabIds.length === 0) {
    clearStorage(window.localStorage);
    window.localStorage.removeItem(REMEMBER_ME_KEY);
  }

  if (!activeTabIds.includes(tabId)) {
    writeActiveTabIds([...activeTabIds, tabId]);
  }

  window.addEventListener("pagehide", unregisterCurrentTab);
};

bootstrapTabSession();

export const authStorage = {
  setSession(session: AuthResponse, rememberMe: boolean): void {
    if (typeof window === "undefined") {
      return;
    }

    const persistentStorage = getStorage("persistent");
    const storedSession: StoredSession = {
      user: session.user,
      organization: session.organization,
    };

    clearStorage(persistentStorage);
    writeTokens(persistentStorage, session);
    writeSession(persistentStorage, storedSession);
    syncSessionStorage(storedSession, session, rememberMe);

    window.localStorage.setItem(REMEMBER_ME_KEY, String(rememberMe));
  },

  setTokens(tokens: Pick<AuthResponse, "accessToken" | "refreshToken">): void {
    if (typeof window === "undefined") {
      return;
    }

    const rememberMe = shouldRememberSession();
    const storedSession = this.getStoredSession();

    writeTokens(window.localStorage, tokens);

    if (storedSession) {
      syncSessionStorage(storedSession, tokens, rememberMe);
      return;
    }

    clearStorage(window.sessionStorage);
    if (!rememberMe) {
      writeTokens(window.sessionStorage, tokens);
    }
  },

  getAccessToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }

    return (
      window.localStorage.getItem(ACCESS_TOKEN_KEY) ??
      window.sessionStorage.getItem(ACCESS_TOKEN_KEY)
    );
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }

    return (
      window.localStorage.getItem(REFRESH_TOKEN_KEY) ??
      window.sessionStorage.getItem(REFRESH_TOKEN_KEY)
    );
  },

  getStoredSession(): StoredSession | null {
    if (typeof window === "undefined") {
      return null;
    }

    return (
      parseSession(window.localStorage) ?? parseSession(window.sessionStorage)
    );
  },

  updateStoredSession(session: Partial<StoredSession>): void {
    if (typeof window === "undefined") {
      return;
    }

    const rememberMe = shouldRememberSession();
    const existing = this.getStoredSession();
    const tokens = {
      accessToken: this.getAccessToken(),
      refreshToken: this.getRefreshToken(),
    };

    if (!existing || !tokens.accessToken || !tokens.refreshToken) {
      return;
    }

    const nextSession: StoredSession = {
      user: session.user
        ? { ...existing.user, ...session.user }
        : existing.user,
      organization: session.organization
        ? { ...existing.organization, ...session.organization }
        : existing.organization,
    };

    writeSession(window.localStorage, nextSession);
    syncSessionStorage(
      nextSession,
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      rememberMe,
    );
  },

  clear(): void {
    if (typeof window === "undefined") {
      return;
    }

    clearStorage(window.localStorage);
    clearStorage(window.sessionStorage);
    window.localStorage.removeItem(REMEMBER_ME_KEY);
  },

  isAuthenticated(): boolean {
    return Boolean(this.getAccessToken());
  },
};
