# 应用中心页面迁移第一阶段实现计划

## 状态

已完成实现，实际执行记录见 [11_IMPLEMENTATION_PHASE_1_EXECUTION.md](./11_IMPLEMENTATION_PHASE_1_EXECUTION.md)。

## 阶段目标

将 `refer/` 的登录、应用中心、顶部导航和个人中心体验迁移到 `apps/main` 的 Vite + React Router + Ant Design 架构，同时保留现有 Zustand 认证和 `/apps/mfe-app/*` qiankun 挂载路径。

## 本阶段范围

- 新增受保护的 `/apps`、`/profile`、`/admin` 路由，根路径兼容重定向到 `/apps`。
- 新增应用中心、个人中心、顶部导航组件和页面。
- 重做登录页视觉结构，但继续使用 `username/password` demo 认证契约。
- 迁移八个应用展示配置到主应用已有数据文件，未接入卡片使用提示消息。
- 增加 Ant Design icons 直接依赖和应用样式。
- 补充组件测试、登录 smoke 测试并调整 qiankun 集成测试的登录后路径。

## 本阶段不实现

- 不新增真实管理员业务。
- 不为八个卡片伪造远程 entry 或改变 qiankun 注册协议。
- 不将认证协议改为邮箱登录。
- 不引入 Next.js、Tailwind v4、shadcn 或 `refer` 运行时依赖。

## 验收标准

1. 未认证访问受保护页面重定向到登录页，成功登录默认进入 `/apps`。
2. 应用中心显示八个应用卡片，个人中心显示当前认证用户信息。
3. 顶部菜单可进入 profile 并完成清理认证状态后的退出登录。
4. `/apps/mfe-app/*` 保留 qiankun outlet/fallback 能力。
5. 主应用 lint、unit test 和 build 通过；Playwright 若环境有浏览器则通过，缺少浏览器时记录环境限制。
