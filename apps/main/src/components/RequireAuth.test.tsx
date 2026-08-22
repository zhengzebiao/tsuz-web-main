import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import RequireAuth from "./RequireAuth";
import { useAuthStore } from "../stores/auth.store";

beforeEach(() => {
  useAuthStore.setState({ status: "anonymous", user: undefined, accessToken: undefined, error: undefined });
});

afterEach(() => {
  cleanup();
});

describe("RequireAuth", () => {
  test("waits during session restoration instead of redirecting to login", () => {
    useAuthStore.setState({ status: "authenticating" });

    render(
      <MemoryRouter initialEntries={["/apps"]}>
        <RequireAuth>
          <div>Protected content</div>
        </RequireAuth>
      </MemoryRouter>
    );

    expect(screen.getByText("正在恢复登录状态...")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  test("renders protected content after session restoration", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: {
        id: "user-1",
        name: "admin@example.com",
        username: "admin@example.com",
        roles: [],
        permissions: []
      },
      accessToken: "access-token"
    });

    render(
      <MemoryRouter initialEntries={["/apps"]}>
        <RequireAuth>
          <div>Protected content</div>
        </RequireAuth>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
