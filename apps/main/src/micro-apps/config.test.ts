import { describe, expect, test } from "vitest";
import { createMicroApps, matchesActiveRoute, resolveApiBaseUrl, resolveMicroAppEntry } from "./config";

const authBridge = {
  getAccessToken: () => "demo-token",
  getCurrentUser: () => ({
    id: "user-1",
    name: "Demo Admin",
    username: "admin",
    roles: ["admin"],
    permissions: ["mfe:read"]
  }),
  logout: () => {
    window.dispatchEvent(new Event("test-logout"));
  }
};

describe("micro app config", () => {
  test("matches active rules without prefix collisions", () => {
    expect(matchesActiveRoute("/app/admin", "/app/admin")).toBe(true);
    expect(matchesActiveRoute("/app/admin", "/app/admin/users")).toBe(true);
    expect(matchesActiveRoute("/app/admin", "/app/administrator")).toBe(false);
  });

  test("resolves entries and api base urls from environment overrides", () => {
    expect(resolveApiBaseUrl({})).toBe("/api");
    expect(resolveApiBaseUrl({ VITE_API_BASE_URL: "https://api.example.test" })).toBe("https://api.example.test");
    expect(resolveMicroAppEntry(undefined, {}, "localhost")).toBe("//127.0.0.1:7201/");
    expect(
      resolveMicroAppEntry(undefined, { VITE_ADMIN_APP_ENTRY: "https://test.example.test/subapps/admin/" }, "localhost")
    ).toBe("https://test.example.test/subapps/admin/");
  });

  test("creates qiankun registrations with auth props", () => {
    const [app] = createMicroApps(authBridge, {
      env: { VITE_API_BASE_URL: "https://api.example.test" },
      hostname: "localhost",
      isAuthenticated: () => true,
      isContainerReady: () => true
    });

    expect(app.name).toBe("admin");
    expect(app.entry).toBe("//127.0.0.1:7201/");
    expect(app.container).toBe("#subapp-container");
    expect(app.activeRule({ pathname: "/app/admin" } as Location)).toBe(true);
    expect(app.activeRule({ pathname: "/app/administrator" } as Location)).toBe(false);
    expect(app.props.apiBaseUrl).toBe("https://api.example.test");
    expect(app.props.getAccessToken()).toBe("demo-token");
    expect(app.props.getCurrentUser()?.username).toBe("admin");
    expect(typeof app.props.logout).toBe("function");
  });
});
