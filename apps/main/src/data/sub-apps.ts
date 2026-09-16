import { JCC_APP_ROUTE, jccAppMeta } from "@tsuz/shared";

export interface SubApp {
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  background: string;
  route: string;
  localPort: number;
}

export const subApps: SubApp[] = [
  {
    key: "jcc",
    name: "金铲铲",
    description: "金铲铲子应用",
    icon: "DashboardOutlined",
    color: "#d97706",
    background: "#fffbeb",
    route: JCC_APP_ROUTE,
    localPort: jccAppMeta.port
  }
];
