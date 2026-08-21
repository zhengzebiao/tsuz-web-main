import type { AuthSession, LoginCredentials } from "@tsuz/shared";

const demoUser = {
  id: "user-1",
  name: "Demo Admin",
  username: "admin",
  roles: ["admin"],
  permissions: ["mfe:read", "mfe:write"]
};

export async function loginWithPassword(credentials: LoginCredentials): Promise<AuthSession> {
  const username = credentials.username.trim();

  if (!username || !credentials.password) {
    throw new Error("Username and password are required.");
  }

  if (username !== demoUser.username || credentials.password !== "password123") {
    throw new Error("Invalid demo credentials. Use admin / password123.");
  }

  return {
    accessToken: "demo-token-" + username,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    user: demoUser
  };
}

export async function logoutSession(): Promise<void> {
  return Promise.resolve();
}
