# JWT 认证接入：第五阶段“邮箱注册 API 接入”执行记录

> 状态：已完成
>
> 执行日期：2026-08-31
>
> 总实施方案：[AUTH_JWT_IMPLEMENTATION_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PLAN.md)
>
> 阶段实现计划：[AUTH_JWT_IMPLEMENTATION_PHASE_5_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PHASE_5_PLAN.md)

## 1. 执行范围与结论

本次根据总方案完成第五阶段“邮箱注册 API 接入”。

阶段结论：已将页面占位行为替换为验证码发送、`resend_after` 倒计时、注册提交和 token 自动登录流程；mock 测试全部通过，真实测试 API 未执行。

本阶段实际完成：

1. auth service 暴露验证码发送和注册自动登录能力；
2. auth store 增加 register action，统一认证状态和失败清理；
3. LoginPage 接入验证码/注册请求、challenge 内存状态、倒计时和成功跳转；
4. 增加 service/store/page 测试及 host mock E2E。

本阶段明确未实现或未执行：

- 未执行真实验证码发送、真实账号注册或生产操作；
- 未实现忘记密码、密码重置等其他认证页面；
- challenge 未持久化到 sessionStorage。

## 2. 实际代码与配置变更

### 2.1 Auth service

- [auth.service.ts](../apps/main/src/services/auth.service.ts)：新增 `sendEmailRegistrationCode` 和 `registerWithEmail` service 方法。
- 验证码请求会 trim 邮箱并调用已有 auth API wrapper；注册请求会规范化 email/challenge/code，按 token response 保存 session，随后调用 `/auth/me` 并写入 token-only session。
- 注册 token 后的 `/auth/me` 失败会清理本地 session并重新抛出错误。

### 2.2 Auth store

- [auth.store.ts](../apps/main/src/stores/auth.store.ts)：新增 `register` action。
- 注册成功设置 authenticated、user 和 accessToken；注册或用户资料请求失败时清理 session、恢复 anonymous 并保存可展示错误。

### 2.3 LoginPage

- [LoginPage.tsx](../apps/main/src/pages/LoginPage.tsx)：验证码按钮先校验邮箱，成功后保存 challenge_id，并按 `resend_after` 秒禁用重发；无 challenge 时阻止注册。
- 注册提交映射为 `{ email, challenge_id, code, password }`，不发送 confirmPassword；成功后复用登录目标路径跳转。
- 组件卸载和模式切换清理倒计时；请求失败时保持可重试。

关键实现链路：

```text
注册模式
  → 校验邮箱
  → POST /auth/email/register/code
  → 保存 challenge_id，按 resend_after 倒计时
  → 前端校验注册字段
  → POST /auth/email/register
  → 保存 access/refresh token 与 expiresAt
  → GET /auth/me
  → authenticated 并进入原目标路径
```

### 2.4 测试与 E2E

- [auth.service.test.ts](../apps/main/src/services/auth.service.test.ts)：新增验证码、注册 token/session、`/auth/me` 失败清理测试。
- [auth.store.test.ts](../apps/main/src/stores/auth.store.test.ts)：新增 register 成功和失败状态测试。
- [LoginPage.test.tsx](../apps/main/src/pages/LoginPage.test.tsx)：新增无效邮箱、不重复发送、倒计时、无 challenge 和注册字段请求测试。
- [host-login.spec.ts](../e2e/host-login.spec.ts)：新增 mock 验证码/注册/`/auth/me` 流程和请求体断言。

### 2.5 数据、迁移和状态

不涉及数据库、缓存、迁移或配置变化。challenge_id 仅保存在 LoginPage 内存中，token 继续使用既有 sessionStorage schema。

### 2.6 API、Schema 或公共契约

复用既有 auth API 契约：

- `POST /auth/email/register/code` 请求 `{ email }`；
- `POST /auth/email/register` 请求 `{ email, challenge_id, code, password }`；
- `resend_after` 按秒用于页面重发倒计时；
- 注册成功返回 token response，并由页面后续调用 `/auth/me`。

未修改共享 API 包或后端公共契约。

## 3. 关键设计结果

1. 注册成功自动登录，token 保存和 `/auth/me` 用户恢复与登录流程一致；
2. 验证码重发间隔使用后端 `resend_after`，倒计时期间按钮禁用；
3. 注册请求不触发自动 refresh，并且不发送确认密码；
4. 注册或用户资料请求失败 fail closed，清理本地 session；
5. 既有登录、refresh、logout 和页面布局保持兼容。

## 4. 与阶段计划的差异

实现与阶段计划一致，无范围或设计偏差。

## 5. 测试与验证结果

### 5.1 验证汇总

| 检查 | 命令或方法 | 结果 | 证据/说明 |
| --- | --- | --- | --- |
| 定向测试 | `pnpm --filter tsuz-web-main test -- --run src/services/auth.service.test.ts src/stores/auth.store.test.ts src/pages/LoginPage.test.tsx --pool=forks --maxWorkers=1 --testTimeout=15000` | 通过 | 3 个文件、21 个测试通过 |
| 主应用 lint | `pnpm --filter tsuz-web-main lint` | 通过 | TypeScript 检查通过 |
| Host E2E | `pnpm exec playwright test e2e/host-login.spec.ts` | 通过 | 3 个测试通过，含注册流程 |
| 主应用完整测试 | `pnpm --filter tsuz-web-main test -- --pool=forks --maxWorkers=1 --testTimeout=15000` | 通过 | 10 个文件、35 个测试通过 |
| 主应用构建 | `pnpm --filter tsuz-web-main build` | 通过 | Vite 构建通过；保留既有大 chunk warning |
| 工作区测试/lint | `pnpm test`、`pnpm lint` | 通过 | workspace 测试和 lint 均通过 |
| Diff 检查 | `git diff --check` | 通过 | 无空白错误 |

### 5.2 失败与未执行项

- 早期布局阶段的测试定位问题已在第四阶段记录；本阶段没有真实接口失败。
- 真实验证码发送和注册未执行，因为会产生邮件、账号和 token 等外部副作用，需要受控授权环境。

### 5.3 真实环境或人工验证

| 验证项 | 环境 | 副作用/授权 | 结果 |
| --- | --- | --- | --- |
| `/auth/email/register/code`、`/auth/email/register` | 测试 API | 未调用 | 未执行，需明确授权和受控测试邮箱 |

## 6. 阶段验收结果

| 编号 | 验收标准 | 结果 | 验证证据 |
| --- | --- | --- | --- |
| AC-5-01 | 合法邮箱发送验证码并保存 challenge，按 `resend_after` 禁止重复发送 | 通过 | LoginPage 单测、host mock E2E |
| AC-5-02 | 注册请求字段符合契约，不发送 confirmPassword；无 challenge 不请求 | 通过 | LoginPage/service 测试、E2E 请求体断言 |
| AC-5-03 | 注册成功保存 token、调用 `/auth/me` 并自动进入目标页面 | 通过 | auth service/store 测试、host mock E2E |
| AC-5-04 | 注册或 `/auth/me` 失败时 fail closed，清理本地 session 并展示错误 | 通过 | auth service/store 测试 |
| AC-5-05 | 既有登录、refresh、host 路由和文档回归通过 | 通过 | 主应用完整测试、构建、workspace 测试/lint、host E2E 和 diff 检查通过 |

## 7. 安全、兼容性与可观测性核对

### 安全

- 注册 token 仅按既有 token-only session schema 保存；验证码、challenge 和 confirmPassword 不持久化。
- 注册接口保持 `skipAuthRefresh`，未登录状态不会因注册请求递归刷新。
- 未将真实密码、验证码、token 或 Secret 写入文档和日志。
- 验证码限流、防枚举和后端密码策略由后端契约负责，本阶段仅使用后端返回的 `resend_after`。

### 兼容性

- 登录、页面恢复、refresh、profile、logout 和既有 host E2E 保持兼容；注册流程使用同一认证状态模型。
- 未修改共享 API 包、公共数据结构、配置、迁移或依赖。

### 可观测性

- 未新增日志、指标或追踪；用户可见错误沿用页面 Alert/Ant Design message 与 store error。

## 8. 遗留问题与后续阶段入口

### 8.1 当前阶段遗留问题

| 问题 | 影响 | 负责人/条件 | 处理阶段 |
| --- | --- | --- | --- |
| 真实 API 联调未执行 | 无法据此确认测试环境邮件、验证码和后端实际注册行为 | 需要授权测试后端、测试邮箱和受控账号清理 | 受控联调/发布前 |

### 8.2 下一阶段可复用能力

- 可复用当前 LoginPage 注册流程、auth service/store 和现有 auth API wrapper。
- 后续如实现忘记密码/密码重置，应继续使用 `skipAuthRefresh` 和后端 snake_case 契约。
- 若需要跨页面恢复验证码挑战，需另行确认安全持久化策略；当前 challenge 仅限页面生命周期。

## 9. 文档同步记录

- [AUTH_JWT_IMPLEMENTATION_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PLAN.md)：增加第五阶段链接和注册 API 流程。
- [AUTH_JWT_IMPLEMENTATION_PHASE_5_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PHASE_5_PLAN.md)：记录最终实现契约和验收标准。
- [AUTH_JWT_IMPLEMENTATION_PHASE_4_EXECUTION.md](./AUTH_JWT_IMPLEMENTATION_PHASE_4_EXECUTION.md)：补充第五阶段已接入注册 API 的后续事实，保留第四阶段历史范围。
- 本执行记录：记录第五阶段实际代码、测试和真实 API 未执行状态。

## 10. 阶段结论

第五阶段已完成：

- 验证码发送、`resend_after` 倒计时、注册请求和自动登录已接入；
- 定向及主应用单元测试、host mock E2E、构建、workspace 测试/lint 和 diff 检查全部通过；
- 真实测试 API 未执行，需在获得授权并配置受控测试邮箱后单独联调。
