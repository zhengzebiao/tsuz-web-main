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
import { Card, Typography } from "antd";
import type { ComponentType, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
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

export default function AppGridV1({ apps = subApps }: AppGridProps) {
  const navigate = useNavigate();

  const handleAppClick = (app: SubApp) => {
    navigate(app.route);
  };

  return (
    <div className="app-grid-v1">
      {apps.map((app) => {
        const Icon = iconMap[app.icon] ?? DashboardOutlined;

        return (
          <Card
            key={app.key}
            className="app-card-v1"
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
            <div className="app-card-icon-v1" style={{ backgroundColor: app.background, color: app.color }}>
              <Icon style={{ fontSize: 24 }} />
            </div>
            <Typography.Title level={4}>{app.name}</Typography.Title>
          </Card>
        );
      })}
    </div>
  );
}

export { AppGridV1 };
