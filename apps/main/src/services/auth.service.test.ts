import { describe, expect, test } from "vitest";
import { loginWithPassword } from "./auth.service";

describe("auth service", () => {
  test("returns a demo session for valid credentials", async () => {
    const session = await loginWithPassword({ username: "admin", password: "password123" });

    expect(session.accessToken).toBe("demo-token-admin");
    expect(session.user.username).toBe("admin");
    expect(session.user.roles).toContain("admin");
  });

  test("rejects empty credentials", async () => {
    await expect(loginWithPassword({ username: "", password: "password123" })).rejects.toThrow(
      "Username and password are required."
    );
  });

  test("rejects invalid demo credentials", async () => {
    await expect(loginWithPassword({ username: "admin", password: "wrong" })).rejects.toThrow(
      "Invalid demo credentials."
    );
  });
});
