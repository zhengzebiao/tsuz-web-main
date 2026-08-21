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
  test("renders demo credentials and prefilled fields", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AntApp>
          <LoginPage />
        </AntApp>
      </MemoryRouter>
    );

    expect(screen.getByText("演示账号")).toBeInTheDocument();
    expect(screen.getByText("用户名：admin / 密码：password123")).toBeInTheDocument();
    expect(screen.getByLabelText("用户名")).toHaveValue("admin");
    expect(screen.getByLabelText("密码")).toHaveValue("password123");
    expect(screen.getByRole("button", { name: /登\s*录/ })).toBeEnabled();

    await user.clear(screen.getByLabelText("用户名"));
    await user.type(screen.getByLabelText("用户名"), "operator");

    expect(screen.getByLabelText("用户名")).toHaveValue("operator");
  });
});
