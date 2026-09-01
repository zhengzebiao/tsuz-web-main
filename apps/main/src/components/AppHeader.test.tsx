import { App as AntApp } from "antd";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
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

function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

describe("AppHeader", () => {
  test("navigates to the admin app, profile, and logout from the header", async () => {
    const user = userEvent.setup();
    const logout = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ logout });

    render(
      <MemoryRouter initialEntries={["/apps"]}>
        <AntApp>
          <AppHeader />
          <LocationProbe />
        </AntApp>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "管理员入口" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/app/admin");

    await user.click(screen.getByRole("button", { name: "打开admin用户菜单" }));
    await user.click(screen.getByText("个人中心"));
    expect(screen.getByRole("link", { name: "返回应用中心" })).toHaveAttribute("href", "/apps");

    await user.click(screen.getByRole("button", { name: "打开admin用户菜单" }));
    await user.click(screen.getByText("退出登录"));
    expect(logout).toHaveBeenCalledOnce();
  });
});
