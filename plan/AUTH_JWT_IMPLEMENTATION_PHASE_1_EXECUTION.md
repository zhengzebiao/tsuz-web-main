# JWT 认证接入：第一阶段“共享 API refresh 扩展”执行记录

> 状态：已完成
>
> 执行日期：2026-08-22
>
> 总实施方案：[AUTH_JWT_IMPLEMENTATION_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PLAN.md)
>
> 阶段实现计划：[AUTH_JWT_IMPLEMENTATION_PHASE_1_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PHASE_1_PLAN.md)

## 1. 实际完成

- [packages/api/src/index.ts](../packages/api/src/index.ts)：增加 `refreshAccessToken` 注入回调、`skipAuthRefresh` 请求选项、单客户端 `refreshPromise` single-flight 和原请求单次重试；重试前重新读取 access token。
- [packages/api/src/index.test.ts](../packages/api/src/index.test.ts)：新增 5 个测试，覆盖刷新重试、并发单飞、重试 401 上限和非 401。

本阶段未实现：具体 auth endpoint、token 存储、主应用会话和登录页面。

## 2. 实际行为

```text
401 + refresh callback
  → 复用或创建 refreshPromise
  → 成功后原请求重试一次
  → 重试仍 401 时执行 onUnauthorized 并抛出 ApiError
```

refresh callback 失败时本轮等待请求失败；没有 callback 时保持原有 401 回调行为。

## 3. 验证结果

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| 定向测试 | `pnpm --filter @tsuz/api test` | 通过，1 个文件 7 个测试 |
| 类型检查 | `pnpm --filter @tsuz/api lint` | 通过 |
| Diff 检查 | `git diff --check` | 通过 |
| 真实后端 refresh | 未执行 | 未使用真实 token，避免外部副作用 |

## 4. 阶段结论

第一阶段已完成，可进入第二阶段。后续主应用必须通过 callback 负责调用 `/auth/refresh`、更新 token 和处理最终 logout；共享包不保存 token，也不包含 auth endpoint。
