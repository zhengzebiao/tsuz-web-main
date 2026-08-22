import type { AuthSession, CurrentUser } from "@tsuz/shared";

const SESSION_STORAGE_KEY = "tsuz.auth.session";

export interface StoredAuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user?: CurrentUser;
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
      const value: unknown = JSON.parse(storage.getItem(SESSION_STORAGE_KEY) ?? "null");
      return isStoredAuthSession(value) ? value : memorySession;
    } catch {
      return memorySession;
    }
  },
  write: (session) => {
    memorySession = session;

    try {
      getSessionStorage()?.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Session persistence is best effort; the in-memory auth store remains authoritative.
    }
    notifyListeners();
  },
  clear: () => {
    memorySession = undefined;

    try {
      getSessionStorage()?.removeItem(SESSION_STORAGE_KEY);
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
    expiresAt: session.expiresAt,
    user: session.user
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

function isStoredAuthSession(value: unknown): value is StoredAuthSession {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const session = value as Partial<StoredAuthSession>;
  return (
    typeof session.accessToken === "string" &&
    typeof session.refreshToken === "string" &&
    typeof session.expiresAt === "string"
  );
}
