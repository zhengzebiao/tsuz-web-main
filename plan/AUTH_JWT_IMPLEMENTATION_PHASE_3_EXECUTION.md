# JWT 认证接入：第三阶段“邮箱登录页面”执行记录

> 状态：已完成
>
> 执行日期：2026-08-22
>
> 总实施方案：[AUTH_JWT_IMPLEMENTATION_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PLAN.md)
>
> 阶段实现计划：[AUTH_JWT_IMPLEMENTATION_PHASE_3_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PHASE_3_PLAN.md)

## 1. 实际完成

- [apps/main/src/pages/LoginPage.tsx](../apps/main/src/pages/LoginPage.tsx)：将用户名表单改为邮箱表单，保留登录 loading、错误展示、重定向和应用中心入口；移除 demo 账号提示。
- [apps/main/src/stores/auth.store.ts](../apps/main/src/stores/auth.store.ts)：调用真实邮箱认证 service，并从 session 恢复基础认证状态。
- [apps/main/src/pages/LoginPage.test.tsx](../apps/main/src/pages/LoginPage.test.tsx)：验证邮箱和密码预填、编辑及表单状态。
- [e2e/host-login.spec.ts](../e2e/host-login.spec.ts)：通过 Playwright route mock 验证 `/auth/email/login`、`/auth/me`、`/auth/logout` 以及应用中心、profile、退出流程。
- [apps/main/vite.config.ts](../apps/main/vite.config.ts)：配置单 fork 测试池和 15 秒测试超时，稳定当前环境下 Ant Design 组件测试。

## 2. 验证结果

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| 主应用类型检查 | `pnpm --filter tsuz-web-main lint` | 通过 |
| 主应用单元测试 | `pnpm --filter tsuz-web-main test -- --pool=forks --maxWorkers=1 --testTimeout=15000` | 通过，7 个文件、12 个测试 |
| Host E2E | `pnpm exec playwright test e2e/host-login.spec.ts` | 通过，1 passed |
| 工作区测试 | `pnpm test` | 通过，4 个 workspace task |
| 工作区 lint | `pnpm lint` | 通过 |
| 工作区构建 | `pnpm build` | 通过；保留既有大 chunk warning |
| 真实测试 API 登录 | 未执行 | 未将真实凭证和外部副作用纳入自动化 |

## 3. 阶段验收

- AC-3-01：通过。E2E mock 仅拦截 `/auth/email/login`，service 没有 `/auth/login` wrapper。
- AC-3-02：通过。mock 登录后调用 `/auth/me`，页面进入 `/apps`。
- AC-3-03：通过。profile、logout、host smoke 和现有单元测试通过。
- AC-3-04：通过。本次未添加注册、验证码、忘记密码或重置密码页面。

## 4. 遗留问题

- 真实测试 API 联调未执行，需要在 `VITE_API_BASE_URL` 配置为授权测试服务且使用受控测试账号时单独验证。
- 当前构建有 Vite 大 chunk warning，不影响本阶段认证验收。

## 5. 阶段结论

第三阶段已完成，三阶段代码交付完成。下一步可在获得需求后实现注册、验证码、密码重置页面，或单独开展真实测试环境联调与 token 失效场景验证。
