import { create } from "zustand";
import type { AuthBridge, AuthSession, AuthStatus, CurrentUser, LoginCredentials } from "@tsuz/shared";
import { authSessionStorage, isAuthSessionExpired } from "../services/auth-session";
import {
  getCurrentUser,
  loginWithEmail,
  logoutSession,
  refreshSession,
  registerWithEmail
} from "../services/auth.service";
import type { EmailRegistrationRequest } from "../services/auth-api";

interface AuthState {
  status: AuthStatus;
  user?: CurrentUser;
  accessToken?: string;
  error?: string;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  register: (request: EmailRegistrationRequest) => Promise<AuthSession>;
  logout: () => Promise<void>;
  getAccessToken: () => string | undefined;
  getCurrentUser: () => CurrentUser | undefined;
}

const storedSession = authSessionStorage.read();

export const useAuthStore = create<AuthState>((set, get) => ({
  status: storedSession ? "authenticating" : "anonymous",
  user: undefined,
  accessToken: storedSession?.accessToken,
  error: undefined,
  async login(credentials) {
    set({ status: "authenticating", error: undefined });

    try {
      const session = await loginWithEmail(credentials);

      set({
        status: "authenticated",
        user: session.user,
        accessToken: session.accessToken,
        error: undefined
      });

      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed.";

      authSessionStorage.clear();
      set({
        status: "anonymous",
        user: undefined,
        accessToken: undefined,
        error: message
      });

      throw error;
    }
  },
  async register(request) {
    set({ status: "authenticating", error: undefined });

    try {
      const session = await registerWithEmail(request);

      set({
        status: "authenticated",
        user: session.user,
        accessToken: session.accessToken,
        error: undefined
      });

      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed.";

      authSessionStorage.clear();
      set({
        status: "anonymous",
        user: undefined,
        accessToken: undefined,
        error: message
      });

      throw error;
    }
  },
  async logout() {
    await logoutSession();
    set({ status: "anonymous", user: undefined, accessToken: undefined, error: undefined });
  },
  getAccessToken: () => get().accessToken,
  getCurrentUser: () => get().user
}));

export const authBridge: AuthBridge = {
  getAccessToken: () => useAuthStore.getState().getAccessToken(),
  getCurrentUser: () => useAuthStore.getState().getCurrentUser(),
  logout: () => {
    void useAuthStore.getState().logout();
  }
};

authSessionStorage.subscribe(() => {
  const session = authSessionStorage.read();

  if (!session) {
    useAuthStore.setState({ status: "anonymous", user: undefined, accessToken: undefined, error: undefined });
    return;
  }

  const currentUser = useAuthStore.getState().user;

  useAuthStore.setState({
    status: currentUser ? "authenticated" : "authenticating",
    user: currentUser,
    accessToken: session.accessToken,
    error: undefined
  });
});

export async function restoreAuthSession(
  refresh = refreshSession,
  fetchCurrentUser = getCurrentUser
) {
  const session = authSessionStorage.read();

  if (!session) {
    useAuthStore.setState({ status: "anonymous", user: undefined, accessToken: undefined, error: undefined });
    return false;
  }

  useAuthStore.setState({ status: "authenticating", user: undefined, accessToken: session.accessToken, error: undefined });

  try {
    if (isAuthSessionExpired(session)) {
      if (!session.refreshToken) {
        throw new Error("Refresh token is unavailable.");
      }

      await refresh();
    }

    const currentSession = authSessionStorage.read();

    if (!currentSession) {
      throw new Error("Authentication session is unavailable.");
    }

    const user = await fetchCurrentUser();

    useAuthStore.setState({
      status: "authenticated",
      user,
      accessToken: currentSession.accessToken,
      error: undefined
    });
    return true;
  } catch {
    authSessionStorage.clear();
    useAuthStore.setState({ status: "anonymous", user: undefined, accessToken: undefined, error: undefined });
    return false;
  }
}
