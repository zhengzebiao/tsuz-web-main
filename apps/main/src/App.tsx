import { useEffect } from "react";
import { Layout } from "antd";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import AppFooter from "./components/AppFooter";
import AppHeaderV1 from "./components/AppHeader-v1";
import RequireAuth from "./components/RequireAuth";
import AppsPageV1 from "./pages/AppsPage-v1";
import LoginPageV1 from "./pages/LoginPage-v1";
import ProfilePageV1 from "./pages/ProfilePage-v1";

const { Content } = Layout;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPageV1 />} />
      <Route path="/login-v1" element={<LoginPageV1 />} />
      <Route
        element={
          <RequireAuth>
            <AuthenticatedShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/apps" replace />} />
        <Route path="apps" element={<AppsPageV1 />} />
        <Route path="profile" element={<ProfilePageV1 />} />
        <Route path="app/admin" element={<Navigate to="/app/admin/users" replace />} />
        <Route path="app/admin/*" element={<MicroAppOutlet />} />
        <Route path="app/jcc/*" element={<MicroAppOutlet />} />
        <Route path="apps/mfe-app/*" element={<MicroAppOutlet />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AuthenticatedShell() {
  return (
    <Layout className="app-shell">
      <AppHeaderV1 />
      <Content className="app-content">
        <Outlet />
      </Content>
      <AppFooter />
    </Layout>
  );
}

function AuthenticatedShellV1() {
  return (
    <Layout className="app-shell-v1">
      <AppHeaderV1 />
      <Content className="app-content-v1">
        <Outlet />
      </Content>
      <AppFooter />
    </Layout>
  );
}

function MicroAppOutlet() {
  useEffect(() => {
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  return <div id="subapp-container" className="subapp-container" />;
}
