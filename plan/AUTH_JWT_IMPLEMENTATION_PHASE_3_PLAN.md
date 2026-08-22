# JWT 认证接入：第三阶段“邮箱登录页面”实现计划

> 状态：已实现，待执行记录归档
>
> 总实施方案：[AUTH_JWT_IMPLEMENTATION_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PLAN.md)
>
> 范围：将现有登录页面切换为 `/auth/email/login`；不实现其他 auth 页面。

## 1. 阶段目标

1. 登录表单使用 email/password；
2. 登录成功后由 service 获取 token 和 `/auth/me` 用户信息，进入 `/apps` 或原始目标路径；
3. 保留错误提示、loading、profile/header/logout 和 qiankun auth bridge；
4. 通过 mock E2E 验证请求契约，不把外部真实账号绑定到 CI。

## 2. 实现内容

- [apps/main/src/pages/LoginPage.tsx](../apps/main/src/pages/LoginPage.tsx)：邮箱字段、邮箱校验、测试账号预填和登录文案；
- [apps/main/src/stores/auth.store.ts](../apps/main/src/stores/auth.store.ts)：调用 `loginWithEmail`，成功后写入认证状态；
- [apps/main/src/pages/LoginPage.test.tsx](../apps/main/src/pages/LoginPage.test.tsx)：验证邮箱表单；
- [e2e/host-login.spec.ts](../e2e/host-login.spec.ts)：mock login/me/logout，验证应用中心和 profile 流程；
- [apps/main/vite.config.ts](../apps/main/vite.config.ts)：配置稳定的单 fork 测试池和足够的组件测试超时，避免当前环境并发运行时的超时抖动。

## 3. 不实现

- 注册、注册验证码；
- 忘记密码、密码重置；
- `/auth/login`；
- 新的 React Query auth hooks。

## 4. 验收标准

| 编号 | 标准 | 状态 |
| --- | --- | --- |
| AC-3-01 | 表单提交 `/auth/email/login`，不请求 `/auth/login` | 已满足；service/E2E mock |
| AC-3-02 | 成功登录后访问 `/auth/me` 并进入 `/apps` | 已满足；E2E mock |
| AC-3-03 | profile、logout 和现有 host 路由回归通过 | 已满足；E2E/单元测试 |
| AC-3-04 | 其他 auth 功能没有页面入口 | 已满足 |

## 5. 验证命令

```bash
pnpm --filter tsuz-web-main lint
pnpm --filter tsuz-web-main test -- --pool=forks --maxWorkers=1 --testTimeout=15000
pnpm exec playwright test e2e/host-login.spec.ts
```

真实测试环境登录需单独授权执行，不进入普通 CI。
