import { describe, expect, test, vi } from "vitest";
import type { ApiClient } from "@tsuz/api";
import { createAuthApi } from "./auth-api";

function createClient(): ApiClient {
  return {
    request: vi.fn(),
    get: vi.fn().mockResolvedValue({ id: "user-1", username: "admin@example.com", roles: ["admin"] }),
    post: vi.fn().mockImplementation(async (_path, body) => body),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  };
}

describe("auth API", () => {
  test("maps all supported auth endpoints without exposing /auth/login", async () => {
    const client = createClient();
    const api = createAuthApi(client);

    await api.sendEmailRegistrationCode({ email: "admin@example.com" });
    await api.registerWithEmail({
      email: "admin@example.com",
      challenge_id: "challenge-1",
      code: "123456",
      password: "password123"
    });
    await api.loginWithEmail({ email: "admin@example.com", password: "password123" });
    await api.sendPasswordResetCode({ email: "admin@example.com" });
    await api.resetPassword({
      email: "admin@example.com",
      challenge_id: "challenge-1",
      code: "123456",
      new_password: "new-password"
    });
    await api.refresh({ refresh_token: "refresh-token" });
    await api.logout();
    await api.getCurrentUser();

    expect(client.post).toHaveBeenNthCalledWith(
      1,
      "/auth/email/register/code",
      { email: "admin@example.com" },
      { skipAuthRefresh: true }
    );
    expect(client.post).toHaveBeenNthCalledWith(
      2,
      "/auth/email/register",
      {
        email: "admin@example.com",
        challenge_id: "challenge-1",
        code: "123456",
        password: "password123"
      },
      { skipAuthRefresh: true }
    );
    expect(client.post).toHaveBeenNthCalledWith(
      3,
      "/auth/email/login",
      { email: "admin@example.com", password: "password123" },
      { skipAuthRefresh: true }
    );
    expect(client.post).toHaveBeenNthCalledWith(
      4,
      "/auth/password/forgot/code",
      { email: "admin@example.com" },
      { skipAuthRefresh: true }
    );
    expect(client.post).toHaveBeenNthCalledWith(
      5,
      "/auth/password/reset",
      {
        email: "admin@example.com",
        challenge_id: "challenge-1",
        code: "123456",
        new_password: "new-password"
      },
      { skipAuthRefresh: true }
    );
    expect(client.post).toHaveBeenNthCalledWith(
      6,
      "/auth/refresh",
      { refresh_token: "refresh-token" },
      { skipAuthRefresh: true }
    );
    expect(client.post).toHaveBeenNthCalledWith(7, "/auth/logout");
    expect(client.get).toHaveBeenCalledWith("/auth/me");
    expect(client.post).not.toHaveBeenCalledWith("/auth/login", expect.anything(), expect.anything());
  });
});
