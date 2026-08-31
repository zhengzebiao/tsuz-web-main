import { LockOutlined, MailOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Alert, App, Button, Form, Input, Segmented, Typography } from "antd";
import type { FormInstance } from "antd";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { EmailRegistrationRequest } from "../services/auth-api";
import type { LoginCredentials } from "@tsuz/shared";
import { sendEmailRegistrationCode } from "../services/auth.service";
import { useAuthStore } from "../stores/auth.store";

interface RedirectState {
  from?: {
    pathname?: string;
  };
}

type AuthMode = "login" | "register";

interface RegisterFormValues {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const [mode, setMode] = useState<AuthMode>("login");
  const [challengeId, setChallengeId] = useState<string>();
  const [countdown, setCountdown] = useState(0);
  const [codeLoading, setCodeLoading] = useState(false);
  const [registerForm] = Form.useForm<RegisterFormValues>();
  const registerFormRef = useRef<FormInstance<RegisterFormValues> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const redirectTo = getRedirectPath(location.state);

  useEffect(() => clearCountdownTimer, []);

  function clearCountdownTimer() {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = undefined;
    }
  }

  function resetRegistrationState() {
    setChallengeId(undefined);
    setCountdown(0);
    setCodeLoading(false);
    registerForm.resetFields();
    clearCountdownTimer();
  }

  function invalidateChallenge() {
    setChallengeId(undefined);
    setCountdown(0);
    clearCountdownTimer();
  }

  function handleModeChange(nextMode: AuthMode) {
    setMode(nextMode);
    useAuthStore.setState({ error: undefined });
    invalidateChallenge();

    if (nextMode === "login") {
      resetRegistrationState();
    }
  }

  async function handleLogin(values: LoginCredentials) {
    try {
      await login(values);
      message.success("登录成功");
      navigate(redirectTo, { replace: true });
    } catch {
      // The store exposes the service error for the Alert below.
    }
  }

  async function handleSendCode() {
    try {
      await registerFormRef.current?.validateFields(["email"]);
    } catch {
      return;
    }

    const email = registerFormRef.current?.getFieldValue("email");

    if (!email || codeLoading || countdown > 0) {
      return;
    }

    setCodeLoading(true);

    try {
      const challenge = await sendEmailRegistrationCode(email);
      setChallengeId(challenge.challenge_id);
      registerForm.setFieldsValue({ code: undefined });
      startCountdown(challenge.resend_after);
      message.success("验证码已发送，请查收邮件");
    } catch (error) {
      message.error(getErrorMessage(error, "验证码发送失败，请稍后重试"));
    } finally {
      setCodeLoading(false);
    }
  }

  async function handleRegister(values: RegisterFormValues) {
    if (!challengeId) {
      message.warning("请先获取验证码");
      return;
    }

    try {
      const request: EmailRegistrationRequest = {
        email: values.email.trim(),
        challenge_id: challengeId,
        code: values.code.trim(),
        password: values.password
      };
      await register(request);
      message.success("注册成功");
      navigate(redirectTo, { replace: true });
    } catch {
      // The store exposes the service error for the Alert below.
    }
  }

  function startCountdown(seconds: number) {
    const duration = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    setCountdown(duration);

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = undefined;
    }

    if (duration === 0) {
      return;
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = undefined;
          }
          return 0;
        }

        return current - 1;
      });
    }, 1000);
  }

  function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-header">
          <div className="login-brand-mark" aria-hidden="true">
            A
          </div>
          <span className="login-brand-name">Tsuz.online</span>
        </div>
        <div className="login-brand-copy">
          <Typography.Title level={1}>统一的子应用管理平台</Typography.Title>
          <Typography.Paragraph>
            集中管理你的所有业务子应用，一处登录，随处可用。
          </Typography.Paragraph>
        </div>
        <Typography.Text className="login-copyright">© 2026 Tsuz.online</Typography.Text>
      </section>

      <section className="login-form-panel">
        <div className="login-form-container">
          <div className="login-heading">
            <div className="login-mobile-mark" aria-hidden="true">
              A
            </div>
            <Typography.Title level={2}>{mode === "login" ? "欢迎登录" : "创建账号"}</Typography.Title>
            <Typography.Text type="secondary">
              {mode === "login" ? "请使用邮箱登录管理后台" : "使用邮箱创建你的管理账号"}
            </Typography.Text>
            <Segmented
              aria-label="认证模式"
              className="login-mode-switch"
              block
              options={[
                { label: "登录", value: "login" },
                { label: "注册", value: "register" }
              ]}
              value={mode}
              onChange={(value) => handleModeChange(value as AuthMode)}
            />
          </div>

          {error ? <Alert className="login-error-alert" message={error} type="error" showIcon /> : null}

          {mode === "login" ? (
            <Form<LoginCredentials>
              key="login"
              className="login-auth-form"
              layout="horizontal"
              labelCol={{ flex: "72px" }}
              wrapperCol={{ flex: "1" }}
              requiredMark={false}
              size="large"
              initialValues={{ email: "admin@example.com", password: "password123" }}
              onFinish={handleLogin}
            >
              <Form.Item
                label="邮箱"
                name="email"
                rules={[{ required: true, message: "请输入邮箱" }, { type: "email", message: "请输入有效邮箱" }]}
              >
                <Input prefix={<MailOutlined />} autoComplete="username" placeholder="请输入邮箱" />
              </Form.Item>
              <Form.Item
                label="密码"
                name="password"
                rules={[{ required: true, message: "请输入密码" }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  autoComplete="current-password"
                  placeholder="请输入密码"
                />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={status === "authenticating"}>
                登录
              </Button>
            </Form>
          ) : (
            <Form<RegisterFormValues>
              key="register"
              className="login-auth-form"
              layout="horizontal"
              labelCol={{ flex: "72px" }}
              wrapperCol={{ flex: "1" }}
              requiredMark={false}
              size="large"
              form={registerForm}
              ref={registerFormRef}
              onFinish={handleRegister}
            >
              <Form.Item
                label="邮箱"
                name="email"
                rules={[{ required: true, message: "请输入邮箱" }, { type: "email", message: "请输入有效邮箱" }]}
              >
                <Input prefix={<MailOutlined />} autoComplete="email" placeholder="请输入邮箱" />
              </Form.Item>
              <div className="register-code-row">
                <Form.Item
                  className="register-code-field"
                  label="验证码"
                  name="code"
                  rules={[{ required: true, message: "请输入验证码" }]}
                >
                  <Input
                    prefix={<SafetyCertificateOutlined />}
                    autoComplete="one-time-code"
                    placeholder="请输入验证码"
                  />
                </Form.Item>
                <Button
                  className="register-code-button"
                  htmlType="button"
                  loading={codeLoading}
                  disabled={codeLoading || countdown > 0}
                  onClick={handleSendCode}
                >
                  {countdown > 0 ? `${countdown} 秒后重试` : "获取验证码"}
                </Button>
              </div>
              <Form.Item
                label="设置密码"
                name="password"
                rules={[{ required: true, message: "请输入密码" }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  autoComplete="new-password"
                  placeholder="请输入密码"
                />
              </Form.Item>
              <Form.Item
                dependencies={["password"]}
                label="确认密码"
                name="confirmPassword"
                rules={[
                  { required: true, message: "请再次输入密码" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }

                      return Promise.reject(new Error("两次输入的密码不一致"));
                    }
                  })
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  autoComplete="new-password"
                  placeholder="请再次输入密码"
                />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={status === "authenticating"}>
                注册
              </Button>
            </Form>
          )}

          <Typography.Paragraph className="login-switch-prompt">
            {mode === "login" ? "还没有账号？" : "已有账号？"}
            <button
              className="login-switch-link"
              type="button"
              onClick={() => handleModeChange(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "立即注册" : "返回登录"}
            </button>
          </Typography.Paragraph>

          <Typography.Paragraph className="login-terms">
            {mode === "login" ? "登录" : "注册"}即代表同意 <a href="#terms">服务条款</a> 与{" "}
            <a href="#privacy">隐私政策</a>
          </Typography.Paragraph>
        </div>
      </section>
    </main>
  );
}

function getRedirectPath(state: unknown) {
  if (isRedirectState(state) && state.from?.pathname) {
    return state.from.pathname;
  }

  return "/apps";
}

function isRedirectState(value: unknown): value is RedirectState {
  return typeof value === "object" && value !== null && "from" in value;
}
