import { useEffect, useState } from "react";
import { IdcardOutlined, SafetyCertificateOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Avatar, Card, Descriptions, Spin, Tag } from "antd";
import type { CurrentUser } from "@tsuz/shared";
import { getCurrentUser } from "../services/auth.service";

export default function ProfilePageV1() {
  const [user, setUser] = useState<CurrentUser>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;

    void getCurrentUser()
      .then((currentUser) => {
        if (!active) {
          return;
        }

        setUser(currentUser);
        setError(undefined);
      })
      .catch((requestError) => {
        if (!active) {
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "无法加载个人资料。");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="app-page-v1">
      <section className="app-page-main-v1 app-page-main-narrow-v1">
        <header className="app-page-heading-v1">
          <h1>个人中心</h1>
        </header>

        {loading ? (
          <Spin tip="正在加载个人资料...">
            <div />
          </Spin>
        ) : null}
        {error ? <Alert message="个人资料加载失败" description={error} type="error" showIcon /> : null}
        {!loading && !error && user ? <ProfileDetails user={user} /> : null}
      </section>
    </main>
  );
}

function ProfileDetails({ user }: { user: CurrentUser }) {
  const displayName = user.name || user.username || "用户";
  const username = user.username || displayName;
  const roles = user.roles.length ? user.roles.join("、") : "暂无角色";
  const avatarLabel = username.charAt(0).toUpperCase() || "U";

  return (
    <Card className="profile-card-v1" variant="borderless">
      <div className="profile-summary-v1">
        <Avatar className="profile-avatar-v1" size={72}>
          {avatarLabel}
        </Avatar>
        <div>
          <h2>{displayName}</h2>
          <Tag color="geekblue">{roles}</Tag>
        </div>
      </div>

      <Descriptions
        className="profile-details-v1"
        column={1}
        colon={false}
        items={[
          {
            key: "id",
            label: (
              <span className="profile-detail-label-v1">
                <IdcardOutlined /> 用户 ID
              </span>
            ),
            children: <strong>{user.id}</strong>
          },
          {
            key: "username",
            label: (
              <span className="profile-detail-label-v1">
                <UserOutlined /> 用户名
              </span>
            ),
            children: <strong>{username}</strong>
          },
          {
            key: "role",
            label: (
              <span className="profile-detail-label-v1">
                <SafetyCertificateOutlined /> 角色身份
              </span>
            ),
            children: <strong>{roles}</strong>
          }
        ]}
      />
    </Card>
  );
}
