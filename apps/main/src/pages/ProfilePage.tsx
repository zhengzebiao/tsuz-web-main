import { IdcardOutlined, SafetyCertificateOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Card, Descriptions, Tag } from "antd";
import { useAuthStore } from "../stores/auth.store";

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const displayName = user?.name || user?.username || "用户";
  const username = user?.username || displayName;
  const roles = user?.roles.length ? user.roles.join("、") : "暂无角色";
  const avatarLabel = username.charAt(0).toUpperCase() || "U";

  return (
    <main className="app-page">
      <section className="app-page-main app-page-main-narrow">
        <header className="app-page-heading">
          <h1>个人中心</h1>
        </header>

        <Card className="profile-card" variant="borderless">
          <div className="profile-summary">
            <Avatar className="profile-avatar" size={72}>
              {avatarLabel}
            </Avatar>
            <div>
              <h2>{displayName}</h2>
              <Tag color="geekblue">{roles}</Tag>
            </div>
          </div>

          <Descriptions
            className="profile-details"
            column={1}
            colon={false}
            items={[
              {
                key: "id",
                label: (
                  <span className="profile-detail-label">
                    <IdcardOutlined /> 用户 ID
                  </span>
                ),
                children: <strong>{user?.id ?? "-"}</strong>
              },
              {
                key: "username",
                label: (
                  <span className="profile-detail-label">
                    <UserOutlined /> 用户名
                  </span>
                ),
                children: <strong>{username}</strong>
              },
              {
                key: "role",
                label: (
                  <span className="profile-detail-label">
                    <SafetyCertificateOutlined /> 角色身份
                  </span>
                ),
                children: <strong>{roles}</strong>
              }
            ]}
          />
        </Card>
      </section>
    </main>
  );
}
