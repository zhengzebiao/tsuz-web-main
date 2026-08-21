# 应用中心页面迁移第一阶段执行记录

## 执行状态

已完成本阶段主应用交付。代码、单元测试、类型检查、生产构建和 host Playwright smoke 已通过；远程 qiankun 集成 smoke 因未提供远程子应用环境而按测试配置跳过。

## 实际修改

- [apps/main/src/App.tsx](../apps/main/src/App.tsx)：移除旧 host roadmap 首页，增加受保护的 `/apps`、`/profile`、`/admin`，保留 `/apps/mfe-app/*` 和 qiankun fallback；根路径重定向到 `/apps`。
- [apps/main/src/components/AppHeader.tsx](../apps/main/src/components/AppHeader.tsx)：新增品牌导航、管理员入口、响应式头像菜单、个人中心和清理认证状态的退出登录。
- [apps/main/src/components/AppGrid.tsx](../apps/main/src/components/AppGrid.tsx)：使用主应用数据和 Ant Design 图标显示八个应用卡片，未接入应用点击时显示提示。
- [apps/main/src/pages/AppsPage.tsx](../apps/main/src/pages/AppsPage.tsx)：新增应用中心页面。
- [apps/main/src/pages/ProfilePage.tsx](../apps/main/src/pages/ProfilePage.tsx)：新增基于 `useAuthStore().user` 的个人中心页面。
- [apps/main/src/pages/LoginPage.tsx](../apps/main/src/pages/LoginPage.tsx)：迁移左右分栏品牌视觉、中文用户名登录表单、演示账号提示、成功消息和默认 `/apps` 跳转。
- [apps/main/src/providers/AppProviders.tsx](../apps/main/src/providers/AppProviders.tsx)：增加 Ant Design `App` provider，为 message API 提供上下文。
- [apps/main/src/styles/main.css](../apps/main/src/styles/main.css)：新增登录、导航、应用卡片、profile 和移动端响应式样式。
- [apps/main/package.json](../apps/main/package.json)、[pnpm-lock.yaml](../pnpm-lock.yaml)：增加 `@ant-design/icons` 直接依赖。
- 新增 [AppsPage.test.tsx](../apps/main/src/pages/AppsPage.test.tsx)、[ProfilePage.test.tsx](../apps/main/src/pages/ProfilePage.test.tsx)、[AppHeader.test.tsx](../apps/main/src/components/AppHeader.test.tsx)，更新 [LoginPage.test.tsx](../apps/main/src/pages/LoginPage.test.tsx)。
- 更新 [e2e/host-login.spec.ts](../e2e/host-login.spec.ts) 验证 `/apps`、profile 和 logout；更新 [e2e/host-load-subapp.spec.ts](../e2e/host-load-subapp.spec.ts) 保持 qiankun 集成路径独立。

## 验收映射

| 验收项 | 结果 | 证据 |
| --- | --- | --- |
| 应用中心和八个卡片 | 通过 | `AppsPage.test.tsx`；Chrome 页面实际看到八个卡片 |
| 当前用户个人中心 | 通过 | `ProfilePage.test.tsx`；Chrome 实际访问 `/profile` 显示 Demo Admin、ID、用户名和角色 |
| 顶部菜单及退出逻辑 | 通过 | `AppHeader.test.tsx`；Chrome 实际打开头像菜单并导航到 `/profile` |
| 登录默认入口 | 通过 | `LoginPage.test.tsx`；Chrome 实际登录后到 `/apps` 并显示成功消息 |
| qiankun 保留路径 | 代码和集成 spec 已保留 | `App.tsx` 与 `host-load-subapp.spec.ts`；真实远程集成未执行 |
| TypeScript lint | 通过 | `pnpm --filter tsuz-web-main lint` |
| 主应用单元测试 | 通过 | `pnpm --filter tsuz-web-main test`：6 个文件、10 个测试通过 |
| 工作区测试 | 通过 | `pnpm test`：4 个 workspace task 成功 |
| 生产构建 | 通过 | `pnpm --filter tsuz-web-main build`；Vite 构建成功，存在既有/常规大 chunk warning |
| Playwright host smoke | 通过 | `pnpm exec playwright test e2e/host-login.spec.ts`：1 passed |
| Playwright 全量 smoke | 通过（1 项跳过） | `pnpm exec playwright test`：host login 1 passed；qiankun integration 1 skipped（未启用集成环境） |

## 运行时检查

- 已使用当前已有的 `http://127.0.0.1:7200` Vite 服务访问登录页、登录后的 `/apps` 和 `/profile`。
- 由于 7200 端口已有服务，重新启动命令提示 `Port 7200 is already in use`；对已有服务的 HTTP 200 响应和 Chrome 交互验证成功。
- Chrome 页面未发现新增 Ant Design provider 警告；应用卡片、菜单、个人中心和登录成功提示均可见。
- 没有主应用代码从 `refer` 导入，也没有引入 Next.js 运行时依赖。

## 偏差与遗留

- qiankun 真实远程子应用集成仍需在 `MFE_INTEGRATION_E2E=true` 且 mfe-app dev server 可用时执行；本阶段的全量 Playwright 运行按配置跳过该 spec，并未伪造集成通过结果。集成 spec 已改为在登录后通过 SPA history 导航到 `/apps/mfe-app`，避免完整页面刷新绕过 React 应用状态。
- Vite 构建报告 bundle 超过 500 kB 的提示；不影响本阶段功能验收，可在后续性能阶段处理。

## 下一阶段入口

启动远程 `mfe-app` 后执行 `MFE_INTEGRATION_E2E=true pnpm exec playwright test e2e/host-load-subapp.spec.ts`；其余主应用迁移验收已完成。
