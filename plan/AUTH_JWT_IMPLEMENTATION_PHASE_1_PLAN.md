# JWT 认证接入：第一阶段“共享 API refresh 扩展”实现计划

> 状态：已实现，待执行记录归档
>
> 总实施方案：[AUTH_JWT_IMPLEMENTATION_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PLAN.md)
>
> 范围：扩展 `@tsuz/api` 的 JWT refresh 协调能力；不增加具体 auth endpoint，不接入页面。

## 1. 阶段目标

1. 增加可注入 `refreshAccessToken` 回调；
2. 同一客户端实例内并发 401 只发起一次 refresh，其余请求等待同一 Promise；
3. refresh 成功后每个原请求最多重试一次，失败或再次 401 时终止；
4. refresh endpoint 可用 `skipAuthRefresh` 避免递归；
5. 保持不配置 refresh 时的既有 401 行为。

## 2. 修改范围

- [packages/api/src/index.ts](../packages/api/src/index.ts)：请求选项、single-flight refresh 和原请求重试；
- [packages/api/src/index.test.ts](../packages/api/src/index.test.ts)：刷新、并发、失败、重试上限和非 401 测试。

不实现具体 `/auth/*` 接口、token 存储、React Query 或页面。

## 3. 关键设计

- `refreshPromise` 是闭包级状态，生命周期绑定一个 `ApiClient`；
- 请求重试时重新执行 `getAccessToken()`，因此读取到更新后的 token；
- `skipAuthRefresh` 只作为客户端内部请求选项，不会写入 `fetch` 的 RequestInit；
- refresh callback 失败时调用一次 `onUnauthorized`，本轮请求收到 `ApiError`；
- 非 401 响应直接按原有错误路径处理。

## 4. 验收标准

| 编号 | 标准 | 状态 |
| --- | --- | --- |
| AC-1-01 | refresh 成功后原请求使用新 token 重试一次 | 已满足 |
| AC-1-02 | 并发 401 只执行一次 refresh，所有原请求各重试一次 | 已满足 |
| AC-1-03 | refresh 失败、重试再次 401 或非 401 不产生无限刷新 | 已满足 |
| AC-1-04 | `@tsuz/api` lint/test 通过且不依赖 React | 已满足 |

## 5. 验证命令

```bash
pnpm --filter @tsuz/api test
pnpm --filter @tsuz/api lint
```

真实后端 refresh 不在本阶段执行；使用 fake fetcher 验证无副作用的请求行为。
