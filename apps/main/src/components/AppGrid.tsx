import {
  AccountBookOutlined,
  BellOutlined,
  DashboardOutlined,
  FileTextOutlined,
  MonitorOutlined,
  SafetyCertificateOutlined,
  ShoppingOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { App, Card, Col, Row, Typography } from "antd";
import type { ComponentType, CSSProperties } from "react";
import { subApps, type SubApp } from "../data/sub-apps";

const iconMap: Record<string, ComponentType<{ style?: CSSProperties }>> = {
  AccountBookOutlined,
  BellOutlined,
  DashboardOutlined,
  FileTextOutlined,
  MonitorOutlined,
  SafetyCertificateOutlined,
  ShoppingOutlined,
  TeamOutlined
};

export interface AppGridProps {
  apps?: SubApp[];
}

export default function AppGrid({ apps = subApps }: AppGridProps) {
  const { message } = App.useApp();

  const handleAppClick = (app: SubApp) => {
    message.info(`${app.name}正在建设中，敬请期待`);
  };

  return (
    <Row gutter={[20, 20]} className="app-grid">
      {apps.map((app) => {
        const Icon = iconMap[app.icon] ?? DashboardOutlined;

        return (
          <Col key={app.key} xs={12} sm={8} lg={6}>
            <Card
              className="app-card"
              hoverable
              onClick={() => handleAppClick(app)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleAppClick(app);
                }
              }}
            >
              <div className="app-card-icon" style={{ backgroundColor: app.background, color: app.color }}>
                <Icon style={{ fontSize: 24 }} />
              </div>
              <Typography.Title level={4}>{app.name}</Typography.Title>
              <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                {app.description}
              </Typography.Paragraph>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}

export { AppGrid };
