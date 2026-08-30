# JWT 认证接入：第二阶段“主应用 auth API 与会话”实现计划

> 状态：已实现，行为修正已补充
>
> 总实施方案：[AUTH_JWT_IMPLEMENTATION_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PLAN.md)
>
> 范围：在主应用内部构造 auth 分类除 `/auth/login` 外的 8 个接口，并接入 token/session 生命周期；不修改登录页面。

## 1. 阶段目标

1. 在 `apps/main/src/services/auth-api.ts` 实现 8 个 OpenAPI 路径和类型；
2. 在 `auth-session.ts` 管理 sessionStorage 和内存回退；
3. 在 `auth.service.ts` 接入登录、refresh、logout、`/auth/me` 用户映射；
4. 为主应用 API 客户端提供 access token getter、refresh callback 和未授权处理；
5. 保持服务层可由 fake `ApiClient` 测试，避免真实外部副作用。

## 2. 实现内容

- 8 个 endpoint 保持后端 snake_case 字段；所有无需登录的 auth 写接口显式跳过自动 refresh；
- 使用 `VITE_MAIN_WEB_SESSION` 作为 sessionStorage key，仅写入 access/refresh token 和 expiresAt；存储异常时使用内存 session，不持久化 user；页面启动恢复时优先复用未过期 access token，仅在过期时调用 refresh；
- `/auth/me` 映射为现有 `CurrentUser`，后端没有提供的 permissions 使用空数组；启动恢复和 ProfilePage 均从 `/auth/me` 获取内存中的最新 user；
- logout 尝试调用后端后，在 finally 清理本地会话；
- refresh 更新 access token、refresh token 和过期时间。

## 3. 不实现

- 不接入 `/auth/login`；
- 不修改 LoginPage；
- 不增加注册、验证码、密码重置页面；
- 不执行真实注册、发信、重置密码请求。

## 4. 验收标准

| 编号 | 标准 | 状态 |
| --- | --- | --- |
| AC-2-01 | 8 个方法路径、method、body 与 OpenAPI 一致 | 已满足 |
| AC-2-02 | refresh token 轮换并持久化，logout 失败也清理本地状态 | 已满足 |
| AC-2-03 | `/auth/me` 映射不伪造 permissions | 已满足 |
| AC-2-04 | 主应用 lint 和 auth service tests 通过 | 已满足 |

## 5. 验证命令

```bash
pnpm --filter tsuz-web-main lint
pnpm --filter tsuz-web-main test
```

真实后端 auth POST 不在本阶段自动执行。
