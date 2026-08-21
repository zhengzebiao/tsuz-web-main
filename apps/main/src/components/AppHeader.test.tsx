import { App as AntApp } from "antd";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import AppHeader from "./AppHeader";
import { useAuthStore } from "../stores/auth.store";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  useAuthStore.setState({
    status: "authenticated",
    user: {
      id: "user-1",
      name: "Demo Admin",
      username: "admin",
      roles: ["admin"],
      permissions: []
    },
    accessToken: "demo-token",
    error: undefined
  });
});

describe("AppHeader", () => {
  test("navigates to profile and logs out from the user menu", async () => {
    const user = userEvent.setup();
    const logout = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ logout });

    render(
      <MemoryRouter initialEntries={["/apps"]}>
        <AntApp>
          <AppHeader />
        </AntApp>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "打开admin用户菜单" }));
    await user.click(screen.getByText("个人中心"));
    expect(screen.getByRole("link", { name: "返回应用中心" })).toHaveAttribute("href", "/apps");

    await user.click(screen.getByRole("button", { name: "打开admin用户菜单" }));
    await user.click(screen.getByText("退出登录"));
    expect(logout).toHaveBeenCalledOnce();
  });
});
