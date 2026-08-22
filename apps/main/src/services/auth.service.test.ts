import { afterEach, describe, expect, test, vi } from "vitest";
import type { ApiClient } from "@tsuz/api";
import { createAuthService } from "./auth.service";
import { authSessionStorage } from "./auth-session";

const tokenResponse = {
  access_token: "access-token",
  refresh_token: "refresh-token",
  token_type: "Bearer",
  expires_in: 3600
};

function createClient(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    request: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    ...overrides
  };
}

afterEach(() => {
  authSessionStorage.clear();
  vi.restoreAllMocks();
});

describe("auth service", () => {
  test("logs in with email, stores tokens and loads the current user", async () => {
    const client = createClient({
      post: vi.fn().mockResolvedValue(tokenResponse),
      get: vi.fn().mockResolvedValue({ id: "user-1", username: "admin@example.com", roles: ["admin"] })
    });
    const service = createAuthService(client);

    const session = await service.loginWithEmail({ email: " admin@example.com ", password: "password123" });

    expect(session.user.username).toBe("admin@example.com");
    expect(session.refreshToken).toBe("refresh-token");
    expect(client.post).toHaveBeenCalledWith(
      "/auth/email/login",
      {
        email: "admin@example.com",
        password: "password123"
      },
      { skipAuthRefresh: true }
    );
    expect(client.get).toHaveBeenCalledWith("/auth/me");
    expect(authSessionStorage.read()?.accessToken).toBe("access-token");
  });

  test("rejects empty email or password before making a request", async () => {
    const client = createClient();
    const service = createAuthService(client);

    await expect(service.loginWithEmail({ email: "", password: "password123" })).rejects.toThrow(
      "Email and password are required."
    );
    expect(client.post).not.toHaveBeenCalled();
  });

  test("refreshes with the stored refresh token and rotates the session tokens", async () => {
    authSessionStorage.write({
      accessToken: "old-access",
      refreshToken: "old-refresh",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      user: {
        id: "user-1",
        name: "admin@example.com",
        username: "admin@example.com",
        roles: ["admin"],
        permissions: []
      }
    });
    const client = createClient({ post: vi.fn().mockResolvedValue(tokenResponse) });
    const service = createAuthService(client);

    await service.refreshSession();

    expect(client.post).toHaveBeenCalledWith(
      "/auth/refresh",
      { refresh_token: "old-refresh" },
      { skipAuthRefresh: true }
    );
    expect(authSessionStorage.read()).toMatchObject({
      accessToken: "access-token",
      refreshToken: "refresh-token"
    });
  });

  test("clears local session even when backend logout fails", async () => {
    authSessionStorage.write({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    });
    const client = createClient({ post: vi.fn().mockRejectedValue(new Error("offline")) });
    const service = createAuthService(client);

    await expect(service.logoutSession()).rejects.toThrow("offline");
    expect(authSessionStorage.read()).toBeUndefined();
  });
});
