import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, App, Button, Form, Input, Typography } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import type { LoginCredentials } from "@tsuz/shared";
import { useAuthStore } from "../stores/auth.store";

interface RedirectState {
  from?: {
    pathname?: string;
  };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const login = useAuthStore((state) => state.login);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const redirectTo = getRedirectPath(location.state);

  async function handleFinish(values: LoginCredentials) {
    try {
      await login(values);
      message.success("登录成功");
      navigate(redirectTo, { replace: true });
    } catch {
      // The store exposes the service error for the Alert below.
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-header">
          <div className="login-brand-mark" aria-hidden="true">
            A
          </div>
          <span className="login-brand-name">Admin Console</span>
        </div>
        <div className="login-brand-copy">
          <Typography.Title level={1}>统一的子应用管理平台</Typography.Title>
          <Typography.Paragraph>
            集中管理你的所有业务子应用，一处登录，随处可用。
          </Typography.Paragraph>
        </div>
        <Typography.Text className="login-copyright">© 2026 Admin Console</Typography.Text>
      </section>

      <section className="login-form-panel">
        <div className="login-form-container">
          <div className="login-heading">
            <div className="login-mobile-mark" aria-hidden="true">
              A
            </div>
            <Typography.Title level={2}>欢迎登录</Typography.Title>
            <Typography.Text type="secondary">请使用用户名登录管理后台</Typography.Text>
          </div>

          <Alert
            className="login-demo-alert"
            message="演示账号"
            description="用户名：admin / 密码：password123"
            type="info"
            showIcon
          />
          {error ? <Alert className="login-error-alert" message={error} type="error" showIcon /> : null}

          <Form<LoginCredentials>
            layout="vertical"
            requiredMark={false}
            size="large"
            initialValues={{ username: "admin", password: "password123" }}
            onFinish={handleFinish}
          >
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: "请输入用户名" }]}
            >
              <Input prefix={<UserOutlined />} autoComplete="username" placeholder="请输入用户名" />
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

          <Typography.Paragraph className="login-terms">
            登录即代表同意 <a href="#terms">服务条款</a> 与 <a href="#privacy">隐私政策</a>
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

export { getRedirectPath };
