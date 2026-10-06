import {
  DownOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Avatar, Button, Dropdown, Grid, Layout, message } from "antd";
import type { MenuProps } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";

const { Header } = Layout;

export default function AppHeaderV1() {
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [messageApi, contextHolder] = message.useMessage();
  const isMobile = !screens.md;
  const username = user?.username ?? user?.name ?? "用户";
  const avatarLabel = username.charAt(0).toUpperCase() || "U";

  const menuItems: MenuProps["items"] = [
    { key: "profile", icon: <UserOutlined />, label: "个人中心" },
    { key: "about", icon: <InfoCircleOutlined />, label: "网站说明" },
    { key: "resume", icon: <FileTextOutlined />, label: "我的简历" },
    { type: "divider" },
    { key: "logout", icon: <LogoutOutlined />, label: "退出登录", danger: true }
  ];

  const handleMenuClick: MenuProps["onClick"] = async ({ key }) => {
    if (key === "profile") {
      navigate("/profile-v1");
      return;
    }

    if (key === "about" || key === "resume") {
      messageApi.info("功能开发中，敬请期待");
      return;
    }

    if (key === "logout") {
      try {
        await logout();
      } finally {
        navigate("/login-v1", { replace: true });
      }
    }
  };

  return (
    <>
      {contextHolder}
      <Header className="app-header-v1">
      <Link className="app-brand-v1" to="/apps-v1" aria-label="返回应用中心">
        <span className="app-brand-mark-v1" aria-hidden="true">
          A
        </span>
        <span className="app-brand-name-v1">Tusz.online</span>
      </Link>

      <div className="app-header-actions-v1">
        <Button
          className="admin-entry-button-v1"
          icon={<SettingOutlined />}
          onClick={() => navigate("/app/admin")}
          aria-label="管理员入口"
        >
          <span className={isMobile ? "app-admin-label-v1 app-admin-label-hidden-v1" : "app-admin-label-v1"}>
            管理员入口
          </span>
        </Button>
        <Dropdown
          menu={{ items: menuItems, onClick: handleMenuClick }}
          placement="bottomRight"
          trigger={["click"]}
        >
          <button className="user-menu-trigger-v1" type="button" aria-label={`打开${username}用户菜单`}>
            <Avatar className="user-avatar-v1" size={32}>
              {avatarLabel}
            </Avatar>
            {!isMobile ? <span className="user-menu-name-v1">{username}</span> : null}
            {!isMobile ? <DownOutlined className="user-menu-arrow-v1" /> : null}
          </button>
        </Dropdown>
      </div>
      </Header>
    </>
  );
}
