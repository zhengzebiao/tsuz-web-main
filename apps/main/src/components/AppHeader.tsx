import {
  DownOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Avatar, Button, Dropdown, Grid, Layout } from "antd";
import type { MenuProps } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";

const { Header } = Layout;

export default function AppHeader() {
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isMobile = !screens.md;
  const username = user?.username ?? user?.name ?? "用户";
  const avatarLabel = username.charAt(0).toUpperCase() || "U";

  const menuItems: MenuProps["items"] = [
    { key: "profile", icon: <UserOutlined />, label: "个人中心" },
    { type: "divider" },
    { key: "logout", icon: <LogoutOutlined />, label: "退出登录", danger: true }
  ];

  const handleMenuClick: MenuProps["onClick"] = async ({ key }) => {
    if (key === "profile") {
      navigate("/profile");
      return;
    }

    if (key === "logout") {
      try {
        await logout();
      } finally {
        navigate("/login", { replace: true });
      }
    }
  };

  return (
    <Header className="app-header">
      <Link className="app-brand" to="/apps" aria-label="返回应用中心">
        <span className="app-brand-mark" aria-hidden="true">
          A
        </span>
        <span className="app-brand-name">Tusz.online</span>
      </Link>

      <div className="app-header-actions">
        <Button
          className="admin-entry-button"
          icon={<SettingOutlined />}
          onClick={() => navigate("/admin")}
          aria-label="管理员入口"
        >
          <span className={isMobile ? "app-admin-label app-admin-label-hidden" : "app-admin-label"}>
            管理员入口
          </span>
        </Button>
        <Dropdown
          menu={{ items: menuItems, onClick: handleMenuClick }}
          placement="bottomRight"
          trigger={["click"]}
        >
          <button className="user-menu-trigger" type="button" aria-label={`打开${username}用户菜单`}>
            <Avatar className="user-avatar" size={32}>
              {avatarLabel}
            </Avatar>
            {!isMobile ? <span className="user-menu-name">{username}</span> : null}
            {!isMobile ? <DownOutlined className="user-menu-arrow" /> : null}
          </button>
        </Dropdown>
      </div>
    </Header>
  );
}
