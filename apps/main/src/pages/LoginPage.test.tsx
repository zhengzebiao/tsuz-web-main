import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App as AntApp } from "antd";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import LoginPage from "./LoginPage";
import { sendEmailRegistrationCode } from "../services/auth.service";
import { useAuthStore } from "../stores/auth.store";

vi.mock("../services/auth.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/auth.service")>();
  return {
    ...actual,
    sendEmailRegistrationCode: vi.fn()
  };
});

const mockedSendEmailRegistrationCode = vi.mocked(sendEmailRegistrationCode);

beforeEach(() => {
  useAuthStore.setState({ status: "anonymous", user: undefined, accessToken: undefined, error: undefined });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("LoginPage", () => {
  function renderLoginPage() {
    return render(
      <MemoryRouter>
        <AntApp>
          <LoginPage />
        </AntApp>
      </MemoryRouter>
    );
  }

  test("renders the email login form with the test account prefilled", async () => {
    const user = userEvent.setup({ delay: null });

    renderLoginPage();

    expect(screen.queryByText("演示账号")).not.toBeInTheDocument();
    expect(screen.getByLabelText("邮箱")).toHaveValue("admin@example.com");
    expect(screen.getByLabelText("密码")).toHaveValue("password123");
    expect(screen.getByRole("button", { name: /登\s*录/ })).toBeEnabled();

    await user.clear(screen.getByLabelText("邮箱"));
    await user.type(screen.getByLabelText("邮箱"), "operator@example.com");

    expect(screen.getByLabelText("邮箱")).toHaveValue("operator@example.com");
  });

  test("switches to the registration form without submitting login", async () => {
    const user = userEvent.setup({ delay: null });
    const login = vi.spyOn(useAuthStore.getState(), "login");

    renderLoginPage();
    await user.click(screen.getByText("注册", { selector: ".ant-segmented-item-label" }));

    expect(screen.getByRole("heading", { name: "创建账号" })).toBeInTheDocument();
    expect(screen.getByLabelText("邮箱")).toHaveValue("");
    expect(screen.getByLabelText("验证码")).toBeInTheDocument();
    expect(screen.getByLabelText("设置密码")).toBeInTheDocument();
    expect(screen.getByLabelText("确认密码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "获取验证码" })).toBeEnabled();
    expect(screen.getByRole("button", { name: /注\s*册/ })).toBeEnabled();
    expect(login).not.toHaveBeenCalled();
  });

  test("sends a registration code and respects the resend countdown", async () => {
    const user = userEvent.setup({ delay: null });
    mockedSendEmailRegistrationCode.mockResolvedValue({
      challenge_id: "challenge-1",
      expires_in: 300,
      resend_after: 2
    });

    renderLoginPage();
    await user.click(screen.getByText("注册", { selector: ".ant-segmented-item-label" }));
    await user.type(screen.getByLabelText("邮箱"), "operator@example.com");
    await user.click(screen.getByRole("button", { name: "获取验证码" }));

    await waitFor(() => expect(mockedSendEmailRegistrationCode).toHaveBeenCalledWith("operator@example.com"));
    expect(screen.getByRole("button", { name: "2 秒后重试" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "2 秒后重试" }));
    expect(mockedSendEmailRegistrationCode).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(screen.getByRole("button", { name: "获取验证码" })).toBeEnabled(), { timeout: 2500 });
  });

  test("does not send a code for an invalid email", async () => {
    const user = userEvent.setup({ delay: null });

    renderLoginPage();
    await user.click(screen.getByText("注册", { selector: ".ant-segmented-item-label" }));
    await user.type(screen.getByLabelText("邮箱"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "获取验证码" }));

    expect(await screen.findByText("请输入有效邮箱")).toBeInTheDocument();
    expect(mockedSendEmailRegistrationCode).not.toHaveBeenCalled();
  });

  test("requires a verification code before registration", async () => {
    const user = userEvent.setup({ delay: null });
    const register = vi.spyOn(useAuthStore.getState(), "register");

    renderLoginPage();
    await user.click(screen.getByText("注册", { selector: ".ant-segmented-item-label" }));
    await user.type(screen.getByLabelText("邮箱"), "operator@example.com");
    await user.type(screen.getByLabelText("验证码"), "123456");
    await user.type(screen.getByLabelText("设置密码"), "password123");
    await user.type(screen.getByLabelText("确认密码"), "password123");
    await user.click(screen.getByRole("button", { name: /注\s*册/ }));

    expect(await screen.findByText("请先获取验证码")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  test("validates that registration passwords match", async () => {
    const user = userEvent.setup({ delay: null });

    renderLoginPage();
    await user.click(screen.getByText("注册", { selector: ".ant-segmented-item-label" }));
    await user.type(screen.getByLabelText("邮箱"), "operator@example.com");
    await user.type(screen.getByLabelText("验证码"), "123456");
    await user.type(screen.getByLabelText("设置密码"), "password123");
    await user.type(screen.getByLabelText("确认密码"), "different-password");
    await user.click(screen.getByRole("button", { name: /注\s*册/ }));

    expect(await screen.findByText("两次输入的密码不一致")).toBeInTheDocument();
    expect(screen.queryByText("注册接口尚未接入")).not.toBeInTheDocument();
  });

  test("registers with the challenge and navigates after success", async () => {
    const user = userEvent.setup({ delay: null });
    const register = vi.spyOn(useAuthStore.getState(), "register").mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      user: {
        id: "user-1",
        name: "operator@example.com",
        username: "operator@example.com",
        roles: [],
        permissions: []
      }
    });
    mockedSendEmailRegistrationCode.mockResolvedValue({
      challenge_id: "challenge-1",
      expires_in: 300,
      resend_after: 60
    });

    render(
      <MemoryRouter initialEntries={[{ pathname: "/login", state: { from: { pathname: "/profile" } } }]}>
        <AntApp>
          <LoginPage />
        </AntApp>
      </MemoryRouter>
    );
    await user.click(screen.getByText("注册", { selector: ".ant-segmented-item-label" }));
    await user.type(screen.getByLabelText("邮箱"), "operator@example.com");
    await user.click(screen.getByRole("button", { name: "获取验证码" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /60 秒后重试/ })).toBeDisabled());
    await user.type(screen.getByLabelText("验证码"), "123456");
    await user.type(screen.getByLabelText("设置密码"), "password123");
    await user.type(screen.getByLabelText("确认密码"), "password123");
    await user.click(screen.getByRole("button", { name: /注\s*册/ }));

    await waitFor(() => expect(register).toHaveBeenCalledWith({
      email: "operator@example.com",
      challenge_id: "challenge-1",
      code: "123456",
      password: "password123"
    }));
  });

  test("switches back to login and restores its own form", async () => {
    const user = userEvent.setup({ delay: null });

    renderLoginPage();
    await user.click(screen.getByText("注册", { selector: ".ant-segmented-item-label" }));
    await user.click(screen.getByText("返回登录"));

    expect(screen.getByRole("heading", { name: "欢迎登录" })).toBeInTheDocument();
    expect(screen.getByLabelText("邮箱")).toHaveValue("admin@example.com");
    expect(screen.getByLabelText("密码")).toHaveValue("password123");
  });
});
