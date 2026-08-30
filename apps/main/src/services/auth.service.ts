import type { ApiClient } from "@tsuz/api";
import type { AuthSession, CurrentUser, LoginCredentials } from "@tsuz/shared";
import { createMainApiClient } from "./api-client";
import { createAuthApi, type AuthApi, type TokenResponse, type UserResponse } from "./auth-api";
import { authSessionStorage, getExpiresAt, toStoredAuthSession } from "./auth-session";

export interface AuthService {
  loginWithEmail: (credentials: LoginCredentials) => Promise<AuthSession>;
  refreshSession: () => Promise<TokenResponse>;
  getCurrentUser: () => Promise<CurrentUser>;
  logoutSession: () => Promise<void>;
}

export function createAuthService(client?: ApiClient): AuthService {
  const api = createAuthApi(client ?? createAuthenticatedClient());

  return {
    loginWithEmail: (credentials) => loginWithEmailUsingApi(api, credentials),
    refreshSession: () => refreshSessionUsingApi(api),
    getCurrentUser: () => getCurrentUserUsingApi(api),
    logoutSession: () => logoutSessionUsingApi(api)
  };
}

const authService = createAuthService();

export async function loginWithEmail(credentials: LoginCredentials): Promise<AuthSession> {
  return authService.loginWithEmail(credentials);
}

export async function refreshSession(): Promise<TokenResponse> {
  return authService.refreshSession();
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return authService.getCurrentUser();
}

export async function logoutSession(): Promise<void> {
  return authService.logoutSession();
}

async function loginWithEmailUsingApi(api: AuthApi, credentials: LoginCredentials): Promise<AuthSession> {
  const email = credentials.email.trim();

  if (!email || !credentials.password) {
    throw new Error("Email and password are required.");
  }

  const token = await api.loginWithEmail({ email, password: credentials.password });
  const expiresAt = getExpiresAt(token.expires_in);

  authSessionStorage.write({
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt
  });

  try {
    const session = await buildSession(api, token);
    authSessionStorage.write(toStoredAuthSession(session));
    return session;
  } catch (error) {
    authSessionStorage.clear();
    throw error;
  }
}

async function getCurrentUserUsingApi(api: AuthApi): Promise<CurrentUser> {
  return mapCurrentUser(await api.getCurrentUser());
}

async function refreshSessionUsingApi(api: AuthApi): Promise<TokenResponse> {
  const storedSession = authSessionStorage.read();

  if (!storedSession?.refreshToken) {
    throw new Error("Refresh token is unavailable.");
  }

  const token = await api.refresh({ refresh_token: storedSession.refreshToken });
  authSessionStorage.write({
    ...storedSession,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: getExpiresAt(token.expires_in)
  });
  return token;
}

async function logoutSessionUsingApi(api: AuthApi): Promise<void> {
  try {
    if (authSessionStorage.read()?.accessToken) {
      await api.logout();
    }
  } finally {
    authSessionStorage.clear();
  }
}

async function buildSession(api: AuthApi, token: TokenResponse): Promise<AuthSession> {
  const currentUser = await api.getCurrentUser();
  const user = mapCurrentUser(currentUser);

  const currentSession = authSessionStorage.read();

  return {
    accessToken: currentSession?.accessToken ?? token.access_token,
    refreshToken: currentSession?.refreshToken ?? token.refresh_token,
    expiresAt: currentSession?.expiresAt ?? getExpiresAt(token.expires_in),
    user
  };
}

function createAuthenticatedClient() {
  const refreshClient = createMainApiClient();
  const refreshApi = createAuthApi(refreshClient);

  return createMainApiClient({
    refreshAccessToken: async () => {
      await refreshSessionUsingApi(refreshApi);
    },
    onUnauthorized: () => {
      authSessionStorage.clear();
    }
  });
}

function mapCurrentUser(user: UserResponse): CurrentUser {
  return {
    id: user.id,
    name: user.username,
    username: user.username,
    roles: user.roles ?? [],
    permissions: []
  };
}

export { mapCurrentUser };
