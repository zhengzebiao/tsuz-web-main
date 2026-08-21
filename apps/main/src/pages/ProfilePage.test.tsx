import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import ProfilePage from "./ProfilePage";
import { useAuthStore } from "../stores/auth.store";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  useAuthStore.setState({
    status: "authenticated",
    user: {
      id: "user-1",
      name: "Demo Admin",
      username: "admin",
      roles: ["admin", "operator"],
      permissions: ["mfe:read"]
    },
    accessToken: "demo-token",
    error: undefined
  });
});

describe("ProfilePage", () => {
  test("renders the authenticated user's profile details", () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "个人中心" })).toBeInTheDocument();
    expect(screen.getByText("Demo Admin")).toBeInTheDocument();
    expect(screen.getAllByText("admin").length).toBeGreaterThan(0);
    expect(screen.getAllByText("admin、operator").length).toBeGreaterThan(0);
    expect(screen.getByText("user-1")).toBeInTheDocument();
  });
});
