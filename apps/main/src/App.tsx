import { useEffect } from "react";
import { Card, Layout, Typography } from "antd";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { EmptyState, ErrorState } from "@tsuz/ui";
import { ADMIN_APP_ROUTE } from "@tsuz/shared";
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
        <Route path="app/admin/*" element={<MicroAppOutlet />} />
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

function MicroAppOutlet() {
  useEffect(() => {
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  return (
    <main className="app-page">
      <section className="app-page-main">
        <header className="subapp-page-heading">
          <Typography.Title level={2}>管理员控制台</Typography.Title>
          <Typography.Paragraph type="secondary">
            qiankun 将在此处挂载管理员子应用。
          </Typography.Paragraph>
        </header>
        <Card>
          <Typography.Paragraph>
            主应用会向管理员子应用传递 <code>apiBaseUrl</code>、<code>getAccessToken</code>、
            <code>getCurrentUser</code> 和 <code>logout</code> 共享能力。
          </Typography.Paragraph>
          <div id="subapp-container" className="subapp-container">
            <EmptyState
              title="Waiting for admin app"
              description="Start the admin app on port 7201 to mount it in this container."
            />
          </div>
          <ErrorState
            className="integration-note"
            title="Integration fallback"
            description={`If the remote entry fails to load, check VITE_ADMIN_APP_ENTRY and the admin app dev server for ${ADMIN_APP_ROUTE}.`}
          />
        </Card>
      </section>
    </main>
  );
}
