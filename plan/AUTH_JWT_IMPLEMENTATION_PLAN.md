# JWT 认证接入实施方案

> 状态：已完成（代码与自动化验证完成；会话恢复行为已修正；真实测试 API 联调待受控环境）
>
> 接口事实来源：[测试环境 OpenAPI 文档](https://test-api.tusz.online/openapi.json)。
>
> 相关阶段计划与执行记录：见本文第 15 节链接。

## 1. 已确认业务配置与关键决策

| 项目 | 决策或配置 | 状态/来源 |
| --- | --- | --- |
| 登录接口 | 使用 `POST /auth/email/login`，不接入 `POST /auth/login` | 已确认；用户要求 |
| 测试账号 | `admin@example.com` / `password123` | 已确认；用户提供，仅用于受控测试，不写入生产配置 |
| JWT 生命周期 | access token + refresh token；页面恢复优先复用未过期 access token，仅在过期或业务请求 401 时单飞刷新并将原请求最多重试一次 | 已确认；用户确认的并发规则 |
| 共享 API 包职责 | 只提供通用请求、Bearer 注入、refresh 协调和重试，不放业务 endpoint | 已确认；架构讨论 |
| 业务接口归属 | 8 个 auth 接口在主应用 service 中构造 | 已确认；用户要求 |
| 页面范围 | 本次只实现邮箱登录；注册、验证码、忘记密码、密码重置页面暂不实现 | 已确认；用户要求 |
| API 地址 | 通过 `VITE_API_BASE_URL` 配置；本地未配置时默认 `http://localhost:8080/api`，非本地环境默认 `/api` | 当前实现；需部署环境确认 |
| token 存储 | 优先 `sessionStorage`，内存状态作为存储失败时的回退 | 当前实现；安全默认 |

## 2. 背景与现状

主应用原先使用本地 demo 用户登录，[@tsuz/api](../packages/api/src/index.ts) 仅能添加 access token，并在 401 时通知未授权回调。后端已提供 JWT 登录、刷新、登出和当前用户接口；需要把主应用切换到真实邮箱登录，同时保证多个并发请求不会重复刷新 token。

当前相关模块：

- [packages/api/src/index.ts](../packages/api/src/index.ts)：与 React 无关的通用 fetch 客户端；
- [apps/main/src/services/api-client.ts](../apps/main/src/services/api-client.ts)：主应用客户端配置；
- [apps/main/src/services/auth-api.ts](../apps/main/src/services/auth-api.ts)：主应用 auth endpoint 构造；
- [apps/main/src/services/auth-session.ts](../apps/main/src/services/auth-session.ts)：token/session 存储；
- [apps/main/src/services/auth.service.ts](../apps/main/src/services/auth.service.ts)：登录、刷新、登出和用户映射；
- [apps/main/src/stores/auth.store.ts](../apps/main/src/stores/auth.store.ts)：主应用认证状态和子应用 auth bridge；
- [apps/main/src/providers/query-client.ts](../apps/main/src/providers/query-client.ts)：React Query 配置，仅作为应用层基础设施，本次不接入 auth query hooks。

## 3. 目标与非目标

### 3.1 目标

1. 共享请求客户端支持可注入的 refresh callback、single-flight 和单次原请求重试；
2. 主应用构造 OpenAPI auth 分类中除 `/auth/login` 外的 8 个接口；
3. 登录页使用邮箱登录并加载 `/auth/me`，保持现有应用中心、profile、logout 和 qiankun 路由；
4. 使用 mock 和单元测试覆盖 refresh 并发、token 轮换和邮箱登录契约。

### 3.2 非目标

- 不实现 `/auth/login`；
- 不实现注册、注册验证码、忘记密码验证码和密码重置页面；
- 不把具体 auth endpoint 放进共享 API 包；
- 不把 React Query 引入共享 API 包或新增 auth hooks；
- 不执行真实注册、邮件发送或密码重置副作用。

## 4. 核心流程

```text
邮箱登录
  → POST /auth/email/login
  → 保存 access_token / refresh_token
  → GET /auth/me
  → 映射用户并进入 /apps

页面刷新
  → 读取 sessionStorage 中的 session
  → access token 未过期：直接恢复认证状态，不调用 refresh
  → access token 已过期：POST /auth/refresh（跳过自动 refresh）

业务请求 401
  → 同一客户端复用 refresh Promise
  → POST /auth/refresh（跳过自动 refresh）
  → 更新 token
  → 各自重试原请求一次
  → 刷新失败或重试仍 401 时清理会话
```

非 401 响应不触发 refresh；页面恢复不会主动 refresh 未过期 token；每个请求最多重试一次；refresh 自身不会递归刷新。

## 5. 模块职责

### `@tsuz/api`

负责 HTTP 请求构造、token getter、Bearer header、响应解析、ApiError，以及注入式 refresh 的并发协调。不得保存 token、调用业务 endpoint 或依赖 React。

### `apps/main/src/services/auth-api.ts`

负责 8 个 auth endpoint 的路径、请求和响应类型；字段遵循后端 snake_case。登录、注册和密码相关的非受保护请求显式跳过自动 refresh。

### `apps/main/src/services/auth-session.ts`

负责 sessionStorage 的读写、清除、expiresAt 转换和内存回退；不负责路由跳转。

### `apps/main/src/services/auth.service.ts`

负责登录、刷新、登出、当前用户映射和 session 生命周期；logout 最终一定清除本地认证状态。

### `apps/main/src/stores/auth.store.ts`

负责页面认证状态和向 qiankun 子应用提供 `getAccessToken`、`getCurrentUser`、`logout`。

## 6. API 契约

本次主应用封装：

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| POST | `/auth/email/register/code` | 预留发送注册验证码 |
| POST | `/auth/email/register` | 预留邮箱注册 |
| POST | `/auth/email/login` | 页面实际登录 |
| POST | `/auth/password/forgot/code` | 预留发送重置验证码 |
| POST | `/auth/password/reset` | 预留密码重置 |
| POST | `/auth/refresh` | 刷新 JWT |
| POST | `/auth/logout` | 登出当前会话 |
| GET | `/auth/me` | 获取当前用户 |

`POST /auth/refresh` 请求为 `{ refresh_token }`，成功响应使用 `access_token`、`refresh_token`、`expires_in`；`GET /auth/me` 响应使用 `id`、`username`、`roles`。

## 7. 安全与异常

- 不在日志、方案或生产配置中记录真实密码、完整 token 或 Secret；
- refresh 失败时 fail closed，清除本地 session；
- refresh Promise 在单个客户端实例内复用；
- 401 重试后再次 401 不再刷新；
- refresh endpoint 显式跳过自动 refresh；
- 生产环境应通过 HTTPS、受控 CORS 和安全部署配置提供 API；当前浏览器 sessionStorage 方案用于保持标签页会话，后续可按后端能力评估 HttpOnly Cookie。

## 8. 测试与验收

- [packages/api/src/index.test.ts](../packages/api/src/index.test.ts)：覆盖成功刷新、并发单飞、刷新失败、重试上限和非 401；
- [apps/main/src/services/auth-api.test.ts](../apps/main/src/services/auth-api.test.ts)：覆盖 8 个路径且确认不存在 `/auth/login`；
- [apps/main/src/services/auth.service.test.ts](../apps/main/src/services/auth.service.test.ts)：覆盖邮箱登录、session 保存、刷新轮换和 logout 清理；
- [apps/main/src/pages/LoginPage.test.tsx](../apps/main/src/pages/LoginPage.test.tsx)：覆盖邮箱表单；
- [e2e/host-login.spec.ts](../e2e/host-login.spec.ts)：通过 Playwright route mock 验证邮箱登录、`/auth/me`、应用中心、profile 和 logout；
- 真实测试 API 登录尚未作为 CI 验收，避免把账号和外部服务副作用绑定到自动化测试。

验证命令：

```bash
pnpm test
pnpm lint
pnpm build
pnpm exec playwright test e2e/host-login.spec.ts
```

## 9. 分阶段实施顺序

### 第一阶段：共享 API refresh 扩展

> 状态：已完成
>
> 阶段计划：[AUTH_JWT_IMPLEMENTATION_PHASE_1_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PHASE_1_PLAN.md)
>
> 执行记录：[AUTH_JWT_IMPLEMENTATION_PHASE_1_EXECUTION.md](./AUTH_JWT_IMPLEMENTATION_PHASE_1_EXECUTION.md)

实现 `refreshAccessToken`、single-flight、skipAuthRefresh 和原请求单次重试，不增加具体 auth endpoint。

### 第二阶段：主应用 8 个 auth 接口和 JWT 会话

> 状态：已完成
>
> 阶段计划：[AUTH_JWT_IMPLEMENTATION_PHASE_2_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PHASE_2_PLAN.md)
>
> 执行记录：[AUTH_JWT_IMPLEMENTATION_PHASE_2_EXECUTION.md](./AUTH_JWT_IMPLEMENTATION_PHASE_2_EXECUTION.md)

在主应用 service 内实现 8 个 auth endpoint、token/session 生命周期、当前用户映射和 logout 清理。

### 第三阶段：邮箱登录页面

> 状态：已完成
>
> 阶段计划：[AUTH_JWT_IMPLEMENTATION_PHASE_3_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PHASE_3_PLAN.md)
>
> 执行记录：[AUTH_JWT_IMPLEMENTATION_PHASE_3_EXECUTION.md](./AUTH_JWT_IMPLEMENTATION_PHASE_3_EXECUTION.md)

将页面和 store 切换到 `/auth/email/login`，使用用户提供的测试账号进行 mock E2E 验证；其他 auth 页面保留为后续范围。

## 10. 当前验证结论与遗留

已通过：工作区 `pnpm test`、`pnpm lint`、`pnpm build`，以及 mocked host email login Playwright 测试。构建仍有既有的大 chunk warning。真实测试 API 登录、真实 refresh 失效和生产部署验证需要配置环境和受控凭证后单独执行，不在本次自动化验收中宣称通过。
