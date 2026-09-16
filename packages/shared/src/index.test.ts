import { describe, expect, test } from "vitest";
import {
  ADMIN_APP_ROUTE,
  classNames,
  DEFAULT_ADMIN_APP_ENTRY,
  DEFAULT_API_BASE_URL,
  DEFAULT_JCC_APP_ENTRY,
  JCC_APP_ROUTE,
  matchesActiveRoute,
  microAppMetas
} from "./index";

describe("shared micro frontend contracts", () => {
  test("exposes default routes and application metadata", () => {
    expect(DEFAULT_API_BASE_URL).toBe("/api");
    expect(DEFAULT_ADMIN_APP_ENTRY).toBe("//127.0.0.1:7201/");
    expect(DEFAULT_JCC_APP_ENTRY).toBe("//127.0.0.1:7202/");
    expect(ADMIN_APP_ROUTE).toBe("/app/admin");
    expect(JCC_APP_ROUTE).toBe("/app/jcc");
    expect(microAppMetas).toEqual([
      expect.objectContaining({ name: "admin", activeRule: "/app/admin", basename: "/app/admin", port: 7201 }),
      expect.objectContaining({ name: "jcc", activeRule: "/app/jcc", basename: "/app/jcc", port: 7202 })
    ]);
  });

  test("matches active routes without prefix collisions", () => {
    expect(matchesActiveRoute("/app/admin", "/app/admin")).toBe(true);
    expect(matchesActiveRoute("/app/admin", "/app/admin/users")).toBe(true);
    expect(matchesActiveRoute("/app/admin", "/app/administrator")).toBe(false);
    expect(matchesActiveRoute("/app/jcc", "/app/jcc")).toBe(true);
    expect(matchesActiveRoute("/app/jcc", "/app/jcc/lineup")).toBe(true);
    expect(matchesActiveRoute("/app/jcc", "/app/jcc-legacy")).toBe(false);
  });

  test("joins class names from strings and dictionaries", () => {
    expect(classNames("base", { active: true, hidden: false }, undefined, "rounded")).toBe("base active rounded");
  });
});
