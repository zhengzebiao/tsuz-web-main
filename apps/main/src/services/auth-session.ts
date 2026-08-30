import type { AuthSession } from "@tsuz/shared";

const LEGACY_SESSION_STORAGE_KEY = "tsuz.auth.session";
export const AUTH_SESSION_STORAGE_KEY = import.meta.env.VITE_MAIN_WEB_SESSION?.trim() || LEGACY_SESSION_STORAGE_KEY;

export interface StoredAuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface AuthSessionStorage {
  read: () => StoredAuthSession | undefined;
  write: (session: StoredAuthSession) => void;
  clear: () => void;
  subscribe: (listener: () => void) => () => void;
}

const listeners = new Set<() => void>();
let memorySession: StoredAuthSession | undefined;

export const authSessionStorage: AuthSessionStorage = {
  read: () => {
    const storage = getSessionStorage();

    if (!storage) {
      return memorySession;
    }

    try {
      const value: unknown = JSON.parse(storage.getItem(AUTH_SESSION_STORAGE_KEY) ?? "null");
      const session = normalizeStoredAuthSession(value);

      if (!session) {
        return memorySession;
      }

      if (JSON.stringify(value) !== JSON.stringify(session)) {
        storage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
      }

      return session;
    } catch {
      return memorySession;
    }
  },
  write: (session) => {
    memorySession = session;

    try {
      getSessionStorage()?.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Session persistence is best effort; the in-memory auth store remains authoritative.
    }
    notifyListeners();
  },
  clear: () => {
    memorySession = undefined;

    try {
      getSessionStorage()?.removeItem(AUTH_SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage failures while clearing local authentication state.
    }
    notifyListeners();
  },
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

export function toStoredAuthSession(session: AuthSession): StoredAuthSession {
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt
  };
}

export function getExpiresAt(expiresInSeconds: number, now = Date.now()) {
  return new Date(now + expiresInSeconds * 1000).toISOString();
}

export function isAuthSessionExpired(session: Pick<StoredAuthSession, "expiresAt">, now = Date.now()) {
  const expiresAt = Date.parse(session.expiresAt);
  return !Number.isFinite(expiresAt) || expiresAt <= now;
}

function getSessionStorage() {
  if (typeof globalThis.sessionStorage === "undefined") {
    return undefined;
  }

  return globalThis.sessionStorage;
}

function normalizeStoredAuthSession(value: unknown): StoredAuthSession | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const session = value as Partial<StoredAuthSession>;

  if (
    typeof session.accessToken !== "string" ||
    typeof session.refreshToken !== "string" ||
    typeof session.expiresAt !== "string"
  ) {
    return undefined;
  }

  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt
  };
}
