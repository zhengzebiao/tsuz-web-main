import { create } from "zustand";
import type { AuthBridge, AuthSession, AuthStatus, CurrentUser, LoginCredentials } from "@tsuz/shared";
import { authSessionStorage, isAuthSessionExpired } from "../services/auth-session";
import { loginWithEmail, logoutSession, refreshSession } from "../services/auth.service";

interface AuthState {
  status: AuthStatus;
  user?: CurrentUser;
  accessToken?: string;
  error?: string;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  logout: () => Promise<void>;
  getAccessToken: () => string | undefined;
  getCurrentUser: () => CurrentUser | undefined;
}

const storedSession = authSessionStorage.read();

export const useAuthStore = create<AuthState>((set, get) => ({
  status: storedSession?.user
    ? isAuthSessionExpired(storedSession)
      ? "authenticating"
      : "authenticated"
    : "anonymous",
  user: storedSession?.user,
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

  const nextState: Pick<AuthState, "accessToken"> & Partial<Pick<AuthState, "status" | "user" | "error">> = {
    accessToken: session.accessToken
  };

  if (session.user) {
    nextState.status = "authenticated";
    nextState.user = session.user;
    nextState.error = undefined;
  }

  useAuthStore.setState(nextState);
});

export async function restoreAuthSession(refresh = refreshSession) {
  const session = authSessionStorage.read();

  if (!session) {
    useAuthStore.setState({ status: "anonymous", user: undefined, accessToken: undefined, error: undefined });
    return false;
  }

  if (!isAuthSessionExpired(session)) {
    useAuthStore.setState({
      status: session.user ? "authenticated" : "anonymous",
      user: session.user,
      accessToken: session.accessToken,
      error: undefined
    });
    return Boolean(session.user);
  }

  if (!session.refreshToken) {
    authSessionStorage.clear();
    useAuthStore.setState({ status: "anonymous", user: undefined, accessToken: undefined, error: undefined });
    return false;
  }

  useAuthStore.setState({ status: "authenticating", error: undefined });

  try {
    const token = await refresh();
    const refreshedSession = authSessionStorage.read();

    useAuthStore.setState({
      status: refreshedSession?.user ? "authenticated" : "anonymous",
      user: refreshedSession?.user,
      accessToken: token.access_token,
      error: undefined
    });
    return Boolean(refreshedSession?.user);
  } catch {
    authSessionStorage.clear();
    useAuthStore.setState({ status: "anonymous", user: undefined, accessToken: undefined, error: undefined });
    return false;
  }
}
