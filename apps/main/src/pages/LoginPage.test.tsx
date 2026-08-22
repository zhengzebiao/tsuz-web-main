import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App as AntApp } from "antd";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import LoginPage from "./LoginPage";
import { useAuthStore } from "../stores/auth.store";

beforeEach(() => {
  useAuthStore.setState({ status: "anonymous", user: undefined, accessToken: undefined, error: undefined });
});

afterEach(() => {
  cleanup();
});

describe("LoginPage", () => {
  test("renders the email login form with the test account prefilled", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <MemoryRouter>
        <AntApp>
          <LoginPage />
        </AntApp>
      </MemoryRouter>
    );

    expect(screen.queryByText("演示账号")).not.toBeInTheDocument();
    expect(screen.getByLabelText("邮箱")).toHaveValue("admin@example.com");
    expect(screen.getByLabelText("密码")).toHaveValue("password123");
    expect(screen.getByRole("button", { name: /登\s*录/ })).toBeEnabled();

    await user.clear(screen.getByLabelText("邮箱"));
    await user.type(screen.getByLabelText("邮箱"), "operator@example.com");

    expect(screen.getByLabelText("邮箱")).toHaveValue("operator@example.com");
  });
});
