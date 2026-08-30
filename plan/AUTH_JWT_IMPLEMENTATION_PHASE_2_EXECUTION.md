# JWT 认证接入：第二阶段“主应用 auth API 与会话”执行记录

> 状态：已完成
>
> 执行日期：2026-08-22
>
> 总实施方案：[AUTH_JWT_IMPLEMENTATION_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PLAN.md)
>
> 阶段实现计划：[AUTH_JWT_IMPLEMENTATION_PHASE_2_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PHASE_2_PLAN.md)

## 1. 实际完成

- [apps/main/src/services/auth-api.ts](../apps/main/src/services/auth-api.ts)：新增 8 个 auth endpoint wrapper 和 OpenAPI 请求/响应类型；无 `/auth/login` wrapper。
- [apps/main/src/services/auth-session.ts](../apps/main/src/services/auth-session.ts)：使用 `VITE_MAIN_WEB_SESSION` 作为 sessionStorage key；只保存 access token、refresh token 和 expiresAt，读取旧格式时移除 user 字段；保留内存回退、过期判断和清理能力。
- [apps/main/src/services/api-client.ts](../apps/main/src/services/api-client.ts)：主应用客户端读取会话 token，并支持注入 refresh/未授权处理。
- [apps/main/src/services/auth.service.ts](../apps/main/src/services/auth.service.ts)：新增登录、刷新、登出、`/auth/me` 查询和当前用户映射；用户资料不写入 sessionStorage。
- [apps/main/src/stores/auth.store.ts](../apps/main/src/stores/auth.store.ts)：启动时仅从 session 恢复 token，随后请求 `/auth/me` 恢复内存 user，并向 auth bridge 暴露当前 token/user。
- [apps/main/src/pages/ProfilePage.tsx](../apps/main/src/pages/ProfilePage.tsx)：每次挂载直接请求 `/auth/me`，不依赖持久化 user。
- [apps/main/src/vite-env.d.ts](../apps/main/src/vite-env.d.ts)、[apps/main/.env.example](../apps/main/.env.example)：声明并示例化 `VITE_MAIN_WEB_SESSION`。
- [packages/shared/src/index.ts](../packages/shared/src/index.ts)：`LoginCredentials` 改为 email，`AuthSession` 增加 refreshToken。
- [apps/main/src/services/auth-api.test.ts](../apps/main/src/services/auth-api.test.ts)：覆盖 8 个路径和排除 `/auth/login`。
- [apps/main/src/services/auth-session.test.ts](../apps/main/src/services/auth-session.test.ts)、[apps/main/src/services/auth.service.test.ts](../apps/main/src/services/auth.service.test.ts)、[apps/main/src/stores/auth.store.test.ts](../apps/main/src/stores/auth.store.test.ts)、[apps/main/src/pages/ProfilePage.test.tsx](../apps/main/src/pages/ProfilePage.test.tsx)：覆盖 token-only 持久化、启动 `/auth/me` 恢复和 ProfilePage 最新资料请求。

## 2. 关键设计结果

- 具体 auth API 保持在主应用，不污染共享 API 包；
- 登录后先保存 token，再调用 `/auth/me`，用户请求失败会清理会话；
- logout 的本地清理位于 finally；
- permissions 在后端未返回时为空数组；
- refresh 请求显式设置 `skipAuthRefresh`。
- 页面启动恢复先读取 `VITE_MAIN_WEB_SESSION` 对应的 sessionStorage 中的 `expiresAt`：未过期 session 不调用 `/auth/refresh`，但调用 `/auth/me` 恢复内存 user；过期 session 才执行 refresh，随后调用 `/auth/me`，失败时清理本地会话。
- sessionStorage 只保存 access token、refresh token 和 expiresAt，不保存 user；ProfilePage 每次挂载都调用 `/auth/me` 获取最新资料。
- [apps/main/src/components/RequireAuth.tsx](../apps/main/src/components/RequireAuth.tsx)：会话恢复期间显示等待状态，避免 refresh 或 `/auth/me` 尚未完成时误跳转登录页。

## 3. 验证结果

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| 主应用类型检查 | `pnpm --filter tsuz-web-main lint` | 通过 |
| 主应用测试 | `pnpm --filter tsuz-web-main test -- --pool=forks --maxWorkers=1 --testTimeout=15000` | 通过，10 个文件、22 个测试 |
| 主应用构建 | `pnpm --filter tsuz-web-main build` | 通过；保留既有大 chunk warning |
| Host auth/profile E2E | `pnpm exec playwright test e2e/host-login.spec.ts` | 通过，2 个测试；有效 session reload 未调用 refresh，ProfilePage 使用 `/auth/me` 返回资料 |
| API wrapper 定向测试 | 包含在主应用 test | 通过 |
| 真实 auth API | 未执行 | 未使用真实凭证或执行副作用接口 |

## 4. 遗留与下一阶段入口

第二阶段已完成，可进入第三阶段邮箱登录页面接入。真实 API 联调需要把 `VITE_API_BASE_URL` 指向授权的测试后端，并使用受控测试账号；不能以 mock 结果替代真实环境结论。
