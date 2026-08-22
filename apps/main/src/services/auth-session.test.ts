import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { authSessionStorage, getExpiresAt, isAuthSessionExpired } from "./auth-session";

const user = {
  id: "user-1",
  name: "admin@example.com",
  username: "admin@example.com",
  roles: ["admin"],
  permissions: []
};

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

  test("persists and clears a session without changing its user data", () => {
    const session = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: getExpiresAt(3600),
      user
    };

    authSessionStorage.write(session);

    expect(authSessionStorage.read()).toEqual(session);

    authSessionStorage.clear();

    expect(authSessionStorage.read()).toBeUndefined();
  });
});
