import { create } from "zustand";
import type { AuthBridge, AuthSession, AuthStatus, CurrentUser, LoginCredentials } from "@tsuz/shared";
import { loginWithPassword, logoutSession } from "../services/auth.service";

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

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "anonymous",
  user: undefined,
  accessToken: undefined,
  error: undefined,
  async login(credentials) {
    set({ status: "authenticating", error: undefined });

    try {
      const session = await loginWithPassword(credentials);

      set({
        status: "authenticated",
        user: session.user,
        accessToken: session.accessToken,
        error: undefined
      });

      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed.";

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
