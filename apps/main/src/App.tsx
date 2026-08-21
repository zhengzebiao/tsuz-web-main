import { useEffect } from "react";
import { Button, Card, Layout, Result, Typography } from "antd";
import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { EmptyState, ErrorState } from "@tsuz/ui";
import { MFE_APP_ROUTE } from "@tsuz/shared";
import AppHeader from "./components/AppHeader";
import RequireAuth from "./components/RequireAuth";
import AppsPage from "./pages/AppsPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";

const { Content } = Layout;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AuthenticatedShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/apps" replace />} />
        <Route path="apps" element={<AppsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="apps/mfe-app/*" element={<MicroAppOutlet />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AuthenticatedShell() {
  return (
    <Layout className="app-shell">
      <AppHeader />
      <Content className="app-content">
        <Outlet />
      </Content>
    </Layout>
  );
}

function AdminPage() {
  const navigate = useNavigate();

  return (
    <main className="app-page">
      <section className="app-page-main app-page-main-narrow">
        <Result
          status="info"
          title="管理员控制台"
          subTitle="此处用于系统配置、用户与权限管理等管理员功能。"
          extra={
            <Button type="primary" onClick={() => navigate("/apps")}>
              返回应用中心
            </Button>
          }
        />
      </section>
    </main>
  );
}

function MicroAppOutlet() {
  useEffect(() => {
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  return (
    <main className="app-page">
      <section className="app-page-main">
        <header className="subapp-page-heading">
          <Typography.Title level={2}>业务子应用</Typography.Title>
          <Typography.Paragraph type="secondary">
            qiankun 将在此处挂载已配置的远程业务应用。
          </Typography.Paragraph>
        </header>
        <Card>
          <Typography.Paragraph>
            主应用会向子应用传递 <code>apiBaseUrl</code>、<code>getAccessToken</code>、
            <code>getCurrentUser</code> 和 <code>logout</code> 共享能力。
          </Typography.Paragraph>
          <div id="subapp-container" className="subapp-container">
            <EmptyState
              title="Waiting for mfe-app"
              description="Start an mfe-app project on port 7201 to mount it in this container."
            />
          </div>
          <ErrorState
            className="integration-note"
            title="Integration fallback"
            description={`If the remote entry fails to load, check VITE_MFE_APP_ENTRY and the sub app dev server for ${MFE_APP_ROUTE}.`}
          />
        </Card>
      </section>
    </main>
  );
}
