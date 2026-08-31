# JWT 认证接入：第五阶段“邮箱注册 API 接入”实现计划

> 状态：已完成
>
> 总实施方案：[AUTH_JWT_IMPLEMENTATION_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PLAN.md)
>
> 阶段执行记录：[AUTH_JWT_IMPLEMENTATION_PHASE_5_EXECUTION.md](./AUTH_JWT_IMPLEMENTATION_PHASE_5_EXECUTION.md)
>
> 范围：将第四阶段邮箱注册页面的占位行为接入验证码和注册 API，成功后自动登录；不实现其他认证页面。

## 1. 背景与阶段基准

### 1.1 前置阶段状态

- 第四阶段已完成登录/注册模式、注册表单、前端校验和占位 UI。
- [auth-api.ts](../apps/main/src/services/auth-api.ts) 已提供 `sendEmailRegistrationCode` 与 `registerWithEmail` wrapper，且两者使用 `skipAuthRefresh`。
- 既有 [auth.service.ts](../apps/main/src/services/auth.service.ts) 负责 token/session 保存、`/auth/me` 查询和用户映射；[auth.store.ts](../apps/main/src/stores/auth.store.ts) 负责认证状态。

### 1.2 后端契约

- `POST /auth/email/register/code` 请求 `{ email }`，成功返回 `challenge_id`、`expires_in`、`resend_after`。
- `POST /auth/email/register` 请求 `{ email, challenge_id, code, password }`，成功返回 access/refresh token 和 `expires_in`。
- `resend_after` 按秒控制再次发送间隔；`confirmPassword` 仅前端字段，不发送给后端。

### 1.3 本阶段目标

1. 验证码按钮接入真实 service，成功后按 `resend_after` 倒计时并阻止重复请求；
2. 注册提交接入真实 service，保存 token、请求 `/auth/me` 并自动进入原目标页面；
3. 完善 service/store/page 测试和 mock E2E，失败时清理半登录状态。

## 2. 范围与约束

### 2.1 本阶段实现

- service 暴露验证码发送和注册自动登录方法；
- store 增加 register action；
- 页面保存内存 `challengeId`、实现倒计时、注册请求和成功跳转；
- 错误、重复提交、组件卸载和模式切换处理；
- 单元测试、mock E2E 和阶段文档。

### 2.2 本阶段明确不实现

- 不实现忘记密码、密码重置或其他认证页面；
- 不把验证码或 challenge 持久化到 sessionStorage；
- 不新增后端接口、修改公共 API 包或引入新依赖；
- 不执行生产注册、真实验证码发送或未经授权的真实账号操作。

### 2.3 已确认约束

- 注册成功后自动登录，保存 token 后调用 `/auth/me`，成功进入原目标路径；`/auth/me` 失败则清理 session 并失败。
- 验证码成功后使用 `resend_after` 倒计时，不使用固定值或 `expires_in`。
- 注册和验证码请求显式跳过自动 refresh；请求体使用后端 snake_case。

## 3. 详细设计与修改文件

### 3.1 Auth service/store

- [auth.service.ts](../apps/main/src/services/auth.service.ts)：规范化邮箱、challenge、验证码输入；注册返回 token 后复用 session schema，再调用 `/auth/me`；用户请求失败清理 session。
- [auth.store.ts](../apps/main/src/stores/auth.store.ts)：增加 `register` action，统一 authenticated/anonymous 状态和错误处理。
- 测试覆盖验证码请求、注册请求、token 持久化、用户请求失败清理及 store 状态。

### 3.2 LoginPage 验证码与注册

- [LoginPage.tsx](../apps/main/src/pages/LoginPage.tsx)：注册表单通过 `FormInstance` 校验邮箱后发送验证码；内存保存 challenge；`resend_after` 驱动倒计时；无 challenge 时阻止注册；注册成功自动跳转。
- 倒计时使用 interval，组件卸载和模式切换清理；发送失败保持可重试；注册按钮复用 authenticating loading。
- 注册只传 email、challenge_id、code、password，不传 confirmPassword。

### 3.3 测试与 E2E

- [LoginPage.test.tsx](../apps/main/src/pages/LoginPage.test.tsx)：覆盖无效邮箱、验证码成功/倒计时/防重复发送、无 challenge、注册字段提交和成功调用。
- [host-login.spec.ts](../e2e/host-login.spec.ts)：mock 验证码、注册和 `/auth/me`，验证请求体及注册后进入应用中心。

### 3.4 数据与配置

不涉及数据库、缓存、迁移、配置或依赖变化；challenge 只在页面生命周期内保存。

## 4. 实施步骤

1. 扩展并测试 auth service 的验证码和注册自动登录能力；
2. 增加 auth store register action 及失败清理；
3. 接入 LoginPage 的验证码、倒计时和注册提交；
4. 增加页面单测和 host mock E2E；
5. 执行 lint、测试、构建和 diff 检查；
6. 更新总方案、第四阶段记录和第五阶段执行记录。

## 5. 测试与验证计划

```bash
pnpm --filter tsuz-web-main test -- --run src/services/auth.service.test.ts src/stores/auth.store.test.ts src/pages/LoginPage.test.tsx --pool=forks --maxWorkers=1 --testTimeout=15000
pnpm --filter tsuz-web-main lint
pnpm --filter tsuz-web-main build
pnpm exec playwright test e2e/host-login.spec.ts
pnpm test
pnpm lint
git diff --check
```

真实 API 验证只有在授权测试环境与受控账号就绪后执行，不纳入普通 CI。

## 6. 验收标准与追踪

| 编号 | 验收标准 | 实现位置 | 验证方式 | 状态 |
| --- | --- | --- | --- | --- |
| AC-5-01 | 合法邮箱发送验证码并保存 challenge，按 `resend_after` 禁止重复发送 | `LoginPage.tsx`、`auth.service.ts` | 页面单测、mock E2E | 已满足 |
| AC-5-02 | 注册请求字段符合契约，不发送 confirmPassword；无 challenge 不请求 | `LoginPage.tsx`、`auth.service.ts` | 页面/service 测试、E2E 请求体断言 | 已满足 |
| AC-5-03 | 注册成功保存 token、调用 `/auth/me` 并自动进入目标页面 | `auth.service.ts`、`auth.store.ts`、`LoginPage.tsx` | service/store 测试、mock E2E | 已满足 |
| AC-5-04 | 注册或 `/auth/me` 失败时 fail closed，清理本地 session 并展示错误 | service/store/page | service/store 测试 | 已满足 |
| AC-5-05 | 既有登录、refresh、host 路由和文档回归通过 | 既有认证模块、plan 文档 | 全量测试、lint、构建、E2E | 已满足 |

## 7. 风险、回滚与异常处理

- 验证码接口失败：不设置 challenge，按钮恢复可重试并显示错误。
- 重发验证码：以最新成功响应替换 challenge，旧验证码不能通过页面提交旧 challenge。
- 注册或 `/auth/me` 失败：store/service 清理 token/session，状态恢复 anonymous。
- interval 泄漏：卸载和模式切换清理 timer。
- 回滚仅涉及本阶段代码和文档，不涉及数据库或外部资源。

## 8. 阶段交付物

- 真实验证码发送、`resend_after` 倒计时和注册自动登录流程；
- service/store/page 单元测试与 host mock E2E；
- 第五阶段执行记录及总方案同步。

## 9. 计划调整记录

无。实际实现遵循已确认的自动登录和 `resend_after` 决策。
