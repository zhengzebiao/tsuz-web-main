import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { CurrentUser } from "@tsuz/shared";
import ProfilePage from "./ProfilePage";
import { getCurrentUser } from "../services/auth.service";

vi.mock("../services/auth.service", () => ({
  getCurrentUser: vi.fn()
}));

const mockedGetCurrentUser = vi.mocked(getCurrentUser);

const apiUser: CurrentUser = {
  id: "api-user-1",
  name: "API Admin",
  username: "api-admin",
  roles: ["admin", "operator"],
  permissions: []
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  mockedGetCurrentUser.mockResolvedValue(apiUser);
});

describe("ProfilePage", () => {
  test("loads and renders the profile returned by /auth/me", async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    expect(mockedGetCurrentUser).toHaveBeenCalledOnce();
    expect(screen.getByText("正在加载个人资料...")).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText("API Admin")).toBeInTheDocument());
    expect(screen.getAllByText("api-admin").length).toBeGreaterThan(0);
    expect(screen.getAllByText("admin、operator").length).toBeGreaterThan(0);
    expect(screen.getByText("api-user-1")).toBeInTheDocument();
  });

  test("renders an error when the profile request fails", async () => {
    mockedGetCurrentUser.mockRejectedValueOnce(new Error("Unauthorized"));

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("个人资料加载失败")).toBeInTheDocument());
    expect(screen.getByText("Unauthorized")).toBeInTheDocument();
  });
});
