export interface SubApp {
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  background: string;
}

export const subApps: SubApp[] = [
  {
    key: "analytics",
    name: "数据分析",
    description: "实时业务数据看板",
    icon: "DashboardOutlined",
    color: "#4f46e5",
    background: "#eef2ff"
  },
  {
    key: "orders",
    name: "订单管理",
    description: "订单处理与跟踪",
    icon: "ShoppingOutlined",
    color: "#0891b2",
    background: "#ecfeff"
  },
  {
    key: "users",
    name: "用户中心",
    description: "会员与客户资料",
    icon: "TeamOutlined",
    color: "#16a34a",
    background: "#f0fdf4"
  },
  {
    key: "content",
    name: "内容管理",
    description: "文章与素材维护",
    icon: "FileTextOutlined",
    color: "#d97706",
    background: "#fffbeb"
  },
  {
    key: "finance",
    name: "财务系统",
    description: "账单与对账管理",
    icon: "AccountBookOutlined",
    color: "#db2777",
    background: "#fdf2f8"
  },
  {
    key: "message",
    name: "消息通知",
    description: "站内信与推送",
    icon: "BellOutlined",
    color: "#7c3aed",
    background: "#f5f3ff"
  },
  {
    key: "monitor",
    name: "系统监控",
    description: "服务运行状态",
    icon: "MonitorOutlined",
    color: "#dc2626",
    background: "#fef2f2"
  },
  {
    key: "permission",
    name: "权限管理",
    description: "角色与访问控制",
    icon: "SafetyCertificateOutlined",
    color: "#0d9488",
    background: "#f0fdfa"
  }
];
