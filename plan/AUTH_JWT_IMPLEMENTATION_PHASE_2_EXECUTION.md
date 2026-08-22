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
- [apps/main/src/services/auth-session.ts](../apps/main/src/services/auth-session.ts)：新增 sessionStorage 读写、清理、内存回退和 expiresAt 计算。
- [apps/main/src/services/api-client.ts](../apps/main/src/services/api-client.ts)：主应用客户端读取会话 token，并支持注入 refresh/未授权处理。
- [apps/main/src/services/auth.service.ts](../apps/main/src/services/auth.service.ts)：新增登录、刷新、登出、当前用户映射及 token 生命周期。
- [apps/main/src/stores/auth.store.ts](../apps/main/src/stores/auth.store.ts)：使用真实会话字段，初始化并向 auth bridge 暴露当前 token/user。
- [packages/shared/src/index.ts](../packages/shared/src/index.ts)：`LoginCredentials` 改为 email，`AuthSession` 增加 refreshToken。
- [apps/main/src/services/auth-api.test.ts](../apps/main/src/services/auth-api.test.ts)：覆盖 8 个路径和排除 `/auth/login`。
- [apps/main/src/services/auth.service.test.ts](../apps/main/src/services/auth.service.test.ts)：覆盖登录保存、刷新轮换和登出失败清理。

## 2. 关键设计结果

- 具体 auth API 保持在主应用，不污染共享 API 包；
- 登录后先保存 token，再调用 `/auth/me`，用户请求失败会清理会话；
- logout 的本地清理位于 finally；
- permissions 在后端未返回时为空数组；
- refresh 请求显式设置 `skipAuthRefresh`。

## 3. 验证结果

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| 主应用类型检查 | `pnpm --filter tsuz-web-main lint` | 通过 |
| 主应用测试 | `pnpm --filter tsuz-web-main test -- --pool=forks --maxWorkers=1 --testTimeout=15000` | 通过，7 个文件、12 个测试 |
| API wrapper 定向测试 | 包含在主应用 test | 通过 |
| 真实 auth API | 未执行 | 未使用真实凭证或执行副作用接口 |

## 4. 遗留与下一阶段入口

第二阶段已完成，可进入第三阶段邮箱登录页面接入。真实 API 联调需要把 `VITE_API_BASE_URL` 指向授权的测试后端，并使用受控测试账号；不能以 mock 结果替代真实环境结论。
