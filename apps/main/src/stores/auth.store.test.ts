import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { authSessionStorage, getExpiresAt, isAuthSessionExpired } from "../services/auth-session";
import { restoreAuthSession, useAuthStore } from "./auth.store";
import * as authService from "../services/auth.service";

vi.mock("../services/auth.service", () => ({
  getCurrentUser: vi.fn(),
  loginWithEmail: vi.fn(),
  logoutSession: vi.fn(),
  refreshSession: vi.fn(),
  registerWithEmail: vi.fn()
}));

const user = {
  id: "user-1",
  name: "admin@example.com",
  username: "admin@example.com",
  roles: ["admin"],
  permissions: []
};

const validSession = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  expiresAt: getExpiresAt(3600)
};

beforeEach(() => {
  authSessionStorage.clear();
  useAuthStore.setState({ status: "anonymous", user: undefined, accessToken: undefined, error: undefined });
});

afterEach(() => {
  authSessionStorage.clear();
  vi.restoreAllMocks();
});

describe("auth store registration", () => {
  test("registers and enters the authenticated state", async () => {
    authSessionStorage.write(validSession);
    vi.mocked(authService.registerWithEmail).mockResolvedValue({
      ...validSession,
      user
    });

    await expect(useAuthStore.getState().register({
      email: "admin@example.com",
      challenge_id: "challenge-1",
      code: "123456",
      password: "password123"
    })).resolves.toMatchObject({ user });

    expect(useAuthStore.getState()).toMatchObject({
      status: "authenticated",
      user,
      accessToken: "access-token",
      error: undefined
    });
    expect(authService.registerWithEmail).toHaveBeenCalledWith({
      email: "admin@example.com",
      challenge_id: "challenge-1",
      code: "123456",
      password: "password123"
    });
  });

  test("clears the session when registration fails", async () => {
    authSessionStorage.write(validSession);
    vi.mocked(authService.registerWithEmail).mockRejectedValueOnce(new Error("registration failed"));

    await expect(useAuthStore.getState().register({
      email: "admin@example.com",
      challenge_id: "challenge-1",
      code: "123456",
      password: "password123"
    })).rejects.toThrow("registration failed");

    expect(authSessionStorage.read()).toBeUndefined();
    expect(useAuthStore.getState()).toMatchObject({
      status: "anonymous",
      user: undefined,
      accessToken: undefined,
      error: "registration failed"
    });
  });
});

describe("restoreAuthSession", () => {
  test("restores a valid session without calling refresh", async () => {
    authSessionStorage.write(validSession);
    const refresh = vi.fn();
    const fetchCurrentUser = vi.fn().mockResolvedValue(user);

    await expect(restoreAuthSession(refresh, fetchCurrentUser)).resolves.toBe(true);

    expect(refresh).not.toHaveBeenCalled();
    expect(fetchCurrentUser).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({
      status: "authenticated",
      user,
      accessToken: "access-token"
    });
  });

  test("refreshes an expired session and keeps the current route eligible", async () => {
    const expiredSession = { ...validSession, expiresAt: new Date(Date.now() - 1_000).toISOString() };
    authSessionStorage.write(expiredSession);
    expect(authSessionStorage.read()).toEqual(expiredSession);
    expect(isAuthSessionExpired(expiredSession)).toBe(true);
    const refresh = vi.fn(async () => {
      authSessionStorage.write({
        ...expiredSession,
        accessToken: "refreshed-access-token",
        refreshToken: "refreshed-refresh-token",
        expiresAt: getExpiresAt(3600)
      });
      return {
        access_token: "refreshed-access-token",
        refresh_token: "refreshed-refresh-token",
        expires_in: 3600
      };
    });

    const fetchCurrentUser = vi.fn().mockResolvedValue(user);

    await expect(restoreAuthSession(refresh, fetchCurrentUser)).resolves.toBe(true);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchCurrentUser).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({
      status: "authenticated",
      user,
      accessToken: "refreshed-access-token"
    });
  });

  test("clears an expired session when refresh fails", async () => {
    authSessionStorage.write({ ...validSession, expiresAt: new Date(Date.now() - 1_000).toISOString() });
    const refresh = vi.fn().mockRejectedValue(new Error("refresh failed"));
    const fetchCurrentUser = vi.fn();

    await expect(restoreAuthSession(refresh, fetchCurrentUser)).resolves.toBe(false);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchCurrentUser).not.toHaveBeenCalled();
    expect(authSessionStorage.read()).toBeUndefined();
    expect(useAuthStore.getState()).toMatchObject({
      status: "anonymous",
      user: undefined,
      accessToken: undefined
    });
  });
});
