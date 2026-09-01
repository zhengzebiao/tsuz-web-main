import { useEffect } from "react";
import { Button, Layout, Result } from "antd";
import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
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

  return <div id="subapp-container" className="subapp-container" />;
}
