import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  AUTH_SESSION_STORAGE_KEY,
  authSessionStorage,
  getExpiresAt,
  isAuthSessionExpired
} from "./auth-session";

beforeEach(() => {
  authSessionStorage.clear();
});

afterEach(() => {
  authSessionStorage.clear();
});

describe("auth session storage", () => {
  test("identifies future and expired sessions", () => {
    const now = Date.parse("2026-08-22T00:00:00.000Z");

    expect(isAuthSessionExpired({ expiresAt: "2026-08-22T00:01:00.000Z" }, now)).toBe(false);
    expect(isAuthSessionExpired({ expiresAt: "2026-08-21T23:59:00.000Z" }, now)).toBe(true);
    expect(isAuthSessionExpired({ expiresAt: "2026-08-22T00:00:00.000Z" }, now)).toBe(true);
  });

  test("treats an invalid expiration as expired", () => {
    expect(isAuthSessionExpired({ expiresAt: "not-a-date" }, Date.now())).toBe(true);
  });

  test("persists only token data and clears the session", () => {
    const session = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: getExpiresAt(3600)
    };

    authSessionStorage.write(session);

    expect(authSessionStorage.read()).toEqual(session);
    expect(window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBe(JSON.stringify(session));
    expect(window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)).not.toContain("user");

    authSessionStorage.clear();

    expect(authSessionStorage.read()).toBeUndefined();
  });

  test("normalizes legacy sessions by removing the persisted user", () => {
    window.sessionStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresAt: getExpiresAt(3600),
        user: { id: "legacy-user" }
      })
    );

    expect(authSessionStorage.read()).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: expect.any(String)
    });
    expect(window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)).not.toContain("user");
  });
});
