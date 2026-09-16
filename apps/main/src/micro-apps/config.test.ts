import { describe, expect, test } from "vitest";
import { adminAppMeta, jccAppMeta } from "@tsuz/shared";
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
    expect(matchesActiveRoute("/app/jcc", "/app/jcc")).toBe(true);
    expect(matchesActiveRoute("/app/jcc", "/app/jcc/lineup")).toBe(true);
    expect(matchesActiveRoute("/app/jcc", "/app/jcc-legacy")).toBe(false);
  });

  test("resolves entries and api base urls from environment overrides", () => {
    expect(resolveApiBaseUrl({})).toBe("/api");
    expect(resolveApiBaseUrl({ VITE_API_BASE_URL: "https://api.example.test" })).toBe("https://api.example.test");
    expect(resolveMicroAppEntry(adminAppMeta, {})).toBe("//127.0.0.1:7201/");
    expect(resolveMicroAppEntry(jccAppMeta, {})).toBe("//127.0.0.1:7202/");
    expect(
      resolveMicroAppEntry(adminAppMeta, {
        VITE_ADMIN_APP_ENTRY: "https://test.example.test/subapps/admin/"
      })
    ).toBe("https://test.example.test/subapps/admin/");
    expect(resolveMicroAppEntry(jccAppMeta, { VITE_JCC_APP_ENTRY: "https://test.example.test/subapps/jcc/" })).toBe(
      "https://test.example.test/subapps/jcc/"
    );
  });

  test("creates qiankun registrations with independent routes and auth props", () => {
    const [adminApp, jccApp] = createMicroApps(authBridge, {
      env: { VITE_API_BASE_URL: "https://api.example.test" },
      hostname: "localhost",
      isAuthenticated: () => true,
      isContainerReady: () => true
    });

    expect(adminApp.name).toBe("admin");
    expect(adminApp.entry).toBe("//127.0.0.1:7201/");
    expect(adminApp.container).toBe("#subapp-container");
    expect(adminApp.activeRule({ pathname: "/app/admin" } as Location)).toBe(true);
    expect(adminApp.activeRule({ pathname: "/app/jcc" } as Location)).toBe(false);
    expect(adminApp.activeRule({ pathname: "/app/administrator" } as Location)).toBe(false);
    expect(adminApp.props.basename).toBe("/app/admin");

    expect(jccApp.name).toBe("jcc");
    expect(jccApp.entry).toBe("//127.0.0.1:7202/");
    expect(jccApp.container).toBe("#subapp-container");
    expect(jccApp.activeRule({ pathname: "/app/jcc" } as Location)).toBe(true);
    expect(jccApp.activeRule({ pathname: "/app/admin" } as Location)).toBe(false);
    expect(jccApp.activeRule({ pathname: "/app/jcc-legacy" } as Location)).toBe(false);
    expect(jccApp.props.appName).toBe("jcc");
    expect(jccApp.props.basename).toBe("/app/jcc");
    expect(jccApp.props.apiBaseUrl).toBe("https://api.example.test");
    expect(jccApp.props.getAccessToken()).toBe("demo-token");
    expect(jccApp.props.getCurrentUser()?.username).toBe("admin");
    expect(typeof jccApp.props.logout).toBe("function");
  });

  test("keeps active rules closed when authentication or the container is unavailable", () => {
    const [, unauthenticatedJccApp] = createMicroApps(authBridge, {
      env: {},
      isAuthenticated: () => false,
      isContainerReady: () => true
    });
    const [, containerlessJccApp] = createMicroApps(authBridge, {
      env: {},
      isAuthenticated: () => true,
      isContainerReady: () => false
    });

    expect(unauthenticatedJccApp.activeRule({ pathname: "/app/jcc" } as Location)).toBe(false);
    expect(containerlessJccApp.activeRule({ pathname: "/app/jcc" } as Location)).toBe(false);
  });
});
