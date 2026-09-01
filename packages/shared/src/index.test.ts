import { describe, expect, test } from "vitest";
import {
  ADMIN_APP_ROUTE,
  classNames,
  DEFAULT_ADMIN_APP_ENTRY,
  DEFAULT_API_BASE_URL,
  matchesActiveRoute,
  microAppMetas
} from "./index";

describe("shared micro frontend contracts", () => {
  test("exposes default route and API constants", () => {
    expect(DEFAULT_API_BASE_URL).toBe("/api");
    expect(DEFAULT_ADMIN_APP_ENTRY).toBe("//127.0.0.1:7201/");
    expect(ADMIN_APP_ROUTE).toBe("/app/admin");
    expect(microAppMetas[0].name).toBe("admin");
    expect(microAppMetas[0].activeRule).toBe("/app/admin");
  });

  test("matches active routes without prefix collisions", () => {
    expect(matchesActiveRoute("/app/admin", "/app/admin")).toBe(true);
    expect(matchesActiveRoute("/app/admin", "/app/admin/users")).toBe(true);
    expect(matchesActiveRoute("/app/admin", "/app/admin-legacy")).toBe(false);
  });

  test("joins class names from strings and dictionaries", () => {
    expect(classNames("base", { active: true, hidden: false }, undefined, "rounded")).toBe("base active rounded");
  });
});
