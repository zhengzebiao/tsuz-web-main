# 子应用路由与资源代理：第四阶段“金铲铲主应用接入”执行记录

> 状态：部分完成
>
> 执行日期：2026-09-15
>
> 总实施方案：[SUBAPP_ROUTING_IMPLEMENTATION_PLAN.md](./SUBAPP_ROUTING_IMPLEMENTATION_PLAN.md)
>
> 阶段实现计划：[SUBAPP_ROUTING_IMPLEMENTATION_PHASE_4_PLAN.md](./SUBAPP_ROUTING_IMPLEMENTATION_PHASE_4_PLAN.md)

## 1. 执行范围与结论

本次根据总方案实施第四阶段“金铲铲主应用接入”。

阶段结论：主应用代码、配置、测试、构建和本地 qiankun 挂载链路已经完成并验证；真实 7202 子应用加载了页面并接收 `/app/jcc` 路由，但其首个 JCC 业务 API 在当前本地环境返回 401，子应用按既有逻辑调用 host `logout`，因此真实业务数据联调尚未通过，阶段标记为“部分完成”。生产资源 entry、Nginx 和部署也未执行。

本阶段实际完成：

1. 应用中心只显示金铲铲卡片，点击和键盘激活均导航到 `/app/jcc`；
2. 主应用增加受保护的 `/app/jcc/*` qiankun outlet，并注册 `name=jcc`、`basename/activeRule=/app/jcc`、默认 entry `//127.0.0.1:7202/`；
3. 管理员与金铲铲 entry 独立解析，继续共享 API base、认证读取、当前用户和退出 bridge；
4. `VITE_JCC_APP_ENTRY` 已贯穿 Vite 类型、环境示例、Docker、Compose 和部署 workflow；
5. 单元测试、浏览器 host smoke、README、总方案、阶段计划和本执行记录已同步。

本阶段明确未实现或未执行：

- 未修改 `/Users/zhengzebiao/code/tsuz-web-jcc` 子应用代码；
- 未修复当前本地 JCC API 401 或更改子应用收到 401 时调用 host `logout` 的既有行为；
- 未确认金铲铲生产资源 URL/base，未修改服务器 Nginx；
- 未构建或发布生产镜像，未部署测试/生产环境；
- 管理员第二、三阶段遗留工作未纳入本阶段。

## 2. 实际代码与配置变更

### 2.1 应用中心导航与受保护路由

- [`apps/main/src/data/sub-apps.ts`](../apps/main/src/data/sub-apps.ts)：应用列表只保留 `key=jcc` 的金铲铲卡片，route/port 复用 shared 契约；
- [`apps/main/src/components/AppGrid.tsx`](../apps/main/src/components/AppGrid.tsx)：卡片点击、Enter 和 Space 改为 React Router SPA 导航，不再显示“正在建设中”；
- [`apps/main/src/App.tsx`](../apps/main/src/App.tsx)：增加 `/app/jcc/*` → `MicroAppOutlet`，保持 `RequireAuth` 和主应用 Header；同时删除从未被路由使用、阻塞仓库 ESLint 的旧 `AdminPage` 死代码；
- [`apps/main/src/pages/AppsPage.test.tsx`](../apps/main/src/pages/AppsPage.test.tsx)：验证唯一卡片及点击/键盘导航；
- [`apps/main/src/App.test.tsx`](../apps/main/src/App.test.tsx)：验证 `/app/jcc`、嵌套路由及未认证访问行为；
- [`e2e/host-login.spec.ts`](../e2e/host-login.spec.ts)：更新应用中心断言，并验证卡片点击后 URL 和容器。

关键实现：

```text
/apps 金铲铲卡片
  → navigate(/app/jcc)
  → RequireAuth
  → AuthenticatedShell + #subapp-container
  → qiankun activeRule=/app/jcc
```

### 2.2 Shared metadata 与 qiankun 注册

- [`packages/shared/src/index.ts`](../packages/shared/src/index.ts)：新增 `JCC_APP_ROUTE`、`JCC_APP_BASENAME`、`DEFAULT_JCC_APP_ENTRY`、`jccAppMeta` 并加入 `microAppMetas`；
- [`packages/shared/src/index.test.ts`](../packages/shared/src/index.test.ts)：验证 admin/jcc metadata、端口和路由前缀边界；
- [`apps/main/src/micro-apps/config.ts`](../apps/main/src/micro-apps/config.ts)：环境类型增加 `VITE_JCC_APP_ENTRY`，`resolveMicroAppEntry` 按 metadata name 选择管理员或金铲铲 entry；
- [`apps/main/src/micro-apps/config.test.ts`](../apps/main/src/micro-apps/config.test.ts)：验证两项注册的默认/覆盖 entry、activeRule、basename、auth props 及 fail-closed guard。

最终注册契约：

```text
admin: /app/admin → VITE_ADMIN_APP_ENTRY → default 127.0.0.1:7201
jcc:   /app/jcc   → VITE_JCC_APP_ENTRY   → default 127.0.0.1:7202
```

### 2.3 数据、迁移和状态

不涉及数据结构、迁移、缓存或持久业务状态变更。主应用 session 存储和 auth store 契约未改变。

### 2.4 API、Schema 或公共契约

新增 JCC 前端 metadata 和构建变量；未新增或修改后端 API。`MicroAppProps` 字段没有变化，JCC 收到 `appName=jcc`、`basename=/app/jcc`、`apiBaseUrl`、`getAccessToken`、`getCurrentUser` 和 `logout`。

### 2.5 配置、依赖和外部服务

- [`apps/main/src/vite-env.d.ts`](../apps/main/src/vite-env.d.ts)、[`apps/main/.env.example`](../apps/main/.env.example)、[` .env.deploy.example`](../.env.deploy.example)：新增 `VITE_JCC_APP_ENTRY`，本地示例为 `//127.0.0.1:7202/`；
- [`Dockerfile`](../Dockerfile)、[`docker-compose.yml`](../docker-compose.yml)：新增对应 build arg/env；
- [` .github/workflows/deploy.yml`](../.github/workflows/deploy.yml)：GitHub Environment 读取、远程参数传递、Docker build arg 和部署 `.env` 生成均同步 JCC entry；
- [`README.md`](../README.md)：补充本地启动、点击入口、构建变量、Docker/Compose 和 Nginx 职责；
- 未新增依赖，锁文件未修改；未记录任何真实 Secret。

## 3. 关键设计结果

1. 金铲铲业务页面统一为 `/app/jcc`，包含嵌套路由 `/app/jcc/**`，始终由主应用处理并保留鉴权和 Header；
2. 卡片展示数据引用 shared 路由/端口，避免 UI 与 qiankun metadata 漂移；
3. 每个子应用使用独立构建时 entry，管理员既有行为不变；
4. 本地真实浏览器已证明 7202 HTML、Vite 模块和 qiankun lifecycle 能加载并渲染 JCC 页面；
5. 业务 API 401 与 qiankun 挂载是两个独立结论：前者当前失败，不否定后者已成功。

## 4. 与阶段计划的差异

| 差异                  | 计划内容                  | 实际实施                                                                                                              | 原因                                                    | 影响与处理                                                |
| --------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------- |
| 本地业务 API 结果     | 7202 就绪时验证子应用挂载 | 真实加载后 `/api/jcc/heroes` 返回 401，随后子应用调用 host logout；另以浏览器内无副作用空列表响应替身隔离验证挂载页面 | 当前 API 登录会话未通过 JCC endpoint 授权               | qiankun 挂载记为通过，真实业务 API 记为未通过，不合并结论 |
| `AdminPage` 死代码    | 未计划修改                | 删除未被路由引用的旧占位组件和 import                                                                                 | 仓库级 ESLint 报 unused error，阻塞质量门禁             | 无运行时或公共契约影响，管理员继续使用 `MicroAppOutlet`   |
| host 浏览器测试旧断言 | 预期更新应用卡片 smoke    | 同时移除测试中已不存在的“应用中心”标题断言                                                                            | 当前 `AppsPage` 只渲染网格，旧 E2E 与现有页面事实不一致 | 测试改为语义化定位唯一金铲铲标题                          |

## 5. 测试与验证结果

### 5.1 验证汇总

| 检查                      | 命令或方法                                                   | 结果   | 证据/说明                                                     |
| ------------------------- | ------------------------------------------------------------ | ------ | ------------------------------------------------------------- |
| Shared 定向测试           | `pnpm --filter @tsuz/shared test`                            | 通过   | 1 个文件、3 个测试通过                                        |
| 主应用定向/全量单元测试   | `pnpm --filter tsuz-web-main test`                           | 通过   | 最终完整运行时 11 个文件、40 个测试通过                       |
| 工作区测试                | `pnpm test`                                                  | 通过   | 4 个 workspace task 成功；主应用 40 个测试通过                |
| 工作区 lint               | `pnpm lint`                                                  | 通过   | ESLint 与 4 个 workspace TypeScript lint task 通过            |
| 主应用生产构建            | `pnpm --filter tsuz-web-main build`                          | 通过   | Vite 构建成功；仍有既有 500 kB 大 chunk warning               |
| Diff 检查                 | `git diff --check`                                           | 通过   | 最终未发现 whitespace 错误                                    |
| Host Playwright smoke     | `pnpm exec playwright test e2e/host-login.spec.ts`           | 通过   | 3 个测试通过，包含点击金铲铲后 `/app/jcc` 与容器断言          |
| 本地真实 qiankun 静态加载 | 主应用隔离启动在 7299，JCC 运行在 7202，Chrome DevTools 验证 | 通过   | 7202 entry 及相关模块均为 200，JCC 页面实际渲染到主应用 shell |
| 本地真实 JCC API          | Chrome Network：`GET /api/jcc/heroes?limit=20&offset=0`      | 未通过 | 返回 401；JCC 现有客户端调用 host logout，页面回到登录        |
| 生产/Nginx/部署           | 外部操作                                                     | 未执行 | 未获授权且生产 entry/base 未就绪                              |

### 5.2 失败与未执行项

- 首次仓库 lint 失败：`App.tsx` 的旧 `AdminPage` 与 `config.ts` 的兼容 hostname 参数触发 unused；删除死代码并显式保留兼容参数后，最终 lint 通过。
- 首次 `git diff --check` 报 `config.ts` 文件末尾多余空行；已清理，最终通过。
- Host Playwright 初次失败是旧测试仍断言页面不存在的“应用中心”标题，随后用金铲铲语义化 heading 更新；一次中间运行还因 `getByText("金铲铲")` 同时匹配标题和描述而失败，改为 role=heading 后最终 3/3 通过。
- 真实 JCC API 401 未在本仓库修复：本阶段只修改主应用，不能把浏览器响应替身结果当作真实 API 通过。
- 主应用 7200 已有用户启动的 Vite 进程，未终止该外部进程；真实隔离验证改用本阶段启动并在结束后停止的 7299 实例。

### 5.3 真实环境或人工验证

| 验证项               | 环境                                              | 副作用/授权                    | 结果                                           |
| -------------------- | ------------------------------------------------- | ------------------------------ | ---------------------------------------------- |
| 卡片导航与 host 容器 | Playwright + 现有 7200                            | 无外部副作用                   | 通过，3 个 host smoke 全部通过                 |
| 7202 qiankun 挂载    | 本地 7299 主应用 + 既有 7202 JCC，Chrome DevTools | 只读交互；隔离主应用进程已停止 | 通过，实际看到主应用 Header、JCC 侧栏和英雄页  |
| 真实 JCC 业务请求    | 本地 API proxy                                    | 只读 GET                       | 失败，401 后自动 logout                        |
| 隔离挂载验证         | 浏览器内仅替代 `/api/jcc/**` 为 200 空列表        | 无持久化或外部写入             | 通过，仅用于证明挂载/渲染，不替代真实 API 验收 |
| 生产资源/Nginx/部署  | 测试/生产服务器                                   | 需要明确授权和生产 entry       | 未执行                                         |

## 6. 阶段验收结果

| 编号         | 验收标准                                                                  | 结果   | 验证证据                                 |
| ------------ | ------------------------------------------------------------------------- | ------ | ---------------------------------------- |
| AC-4-01      | 金铲铲卡片点击和键盘激活均导航到 `/app/jcc`                               | 通过   | `AppsPage.test.tsx` 与 host Playwright   |
| AC-4-02      | `/app/jcc` 和嵌套路由由受保护主应用壳承载                                 | 通过   | `App.test.tsx` 3 个测试                  |
| AC-4-03      | qiankun 注册 `jcc`，basename/activeRule 为 `/app/jcc`，默认 entry 为 7202 | 通过   | shared/config 单测与浏览器真实挂载       |
| AC-4-04      | admin 和 jcc entry/activeRule 独立且认证 props 不回归                     | 通过   | `config.test.ts` 与主应用全量测试        |
| AC-4-05      | Vite、Docker、Compose 和 workflow 完整传递 `VITE_JCC_APP_ENTRY`           | 通过   | 静态检查、lint 和主应用 build            |
| AC-4-06      | 文档明确生产资源和真实挂载尚需独立子应用/Nginx 环境                       | 通过   | README、总方案、本计划和执行记录         |
| 环境补充验收 | 真实 JCC API 使用当前登录会话返回业务数据                                 | 未通过 | `/api/jcc/heroes` 返回 401 并触发 logout |

代码范围内 AC-4-01 至 AC-4-06 均满足，但真实业务 API 联调失败，且生产环境未配置，因此阶段整体不标记为“已完成”。

## 7. 安全、兼容性与可观测性核对

### 安全

- `/app/jcc` 处于 `RequireAuth` 内，路由测试证明匿名状态不渲染子应用容器；
- qiankun activeRule 继续要求已认证且容器存在，保持 fail-closed；
- 本地 401 按子应用既有安全行为清理 host session，没有为了展示页面绕过鉴权；
- 未将访问令牌、密码或 Secret 写入代码、文档、日志或测试结果。

### 兼容性

- 管理员 metadata、默认 7201 entry 和 `/app/admin` 保持不变；
- `resolveMicroAppEntry` 保留现有可选 hostname 参数签名，即使 entry 已固定为显式环境配置；
- 旧 `/apps/mfe-app/*` 兼容路由未删除；
- 新变量缺省时本地回退 7202，旧构建镜像仍可按历史不可变 tag 回滚。

### 可观测性

- 未新增运行时日志或指标；
- 浏览器 Network 可以区分 7202 静态加载状态和 `/api/jcc/**` 业务请求状态；
- 真实挂载时 Console 无 error/warn，但 DevTools 报告 JCC 子应用 4 个表单字段 label/id 可访问性 issue；该问题属于独立子应用，未在本阶段修改。

## 8. 遗留问题与后续阶段入口

### 8.1 当前阶段遗留问题

| 问题                                     | 影响                                                     | 负责人/条件                                         | 处理阶段               |
| ---------------------------------------- | -------------------------------------------------------- | --------------------------------------------------- | ---------------------- |
| 当前本地 JCC API 对登录会话返回 401      | 子应用挂载后立即调用 host logout，用户无法持续使用资料页 | 核对 API token/权限/endpoint 与 JCC 客户端 401 策略 | 金铲铲 API 联调阶段    |
| 金铲铲生产 entry/base 未确认             | 不能在测试域名部署资源                                   | 准备 JCC 生产构建和资源路径                         | 后续子应用生产构建阶段 |
| 外层 Nginx 无 JCC 资源代理               | 测试域名无法加载 JCC entry                               | 明确资源前缀并获服务器配置授权                      | 后续环境联调阶段       |
| JCC 页面存在表单 label/id 可访问性 issue | 辅助技术体验受影响                                       | 修改独立 `tsuz-web-jcc` 仓库                        | JCC 前端质量阶段       |

### 8.2 下一阶段可复用能力

- 主应用已经提供 `/app/jcc`、`JCC_APP_ROUTE`、`jccAppMeta` 和 `VITE_JCC_APP_ENTRY`；
- 金铲铲子应用已经证明可在 qiankun 下使用 host 传入的 `/app/jcc` basename 渲染；
- 后续应先解决真实 API 401，再确认生产 `/subapps/<name>/` base/entry 和 Nginx，不得把 `/app/jcc` 直接代理到 7202。

## 9. 文档同步记录

- [总实施方案](./SUBAPP_ROUTING_IMPLEMENTATION_PLAN.md)：已补充 JCC 决策、现状、契约、第四阶段链接、风险和后续环境边界；
- [第四阶段实现计划](./SUBAPP_ROUTING_IMPLEMENTATION_PHASE_4_PLAN.md)：已记录浏览器验证与死代码清理两项实施调整，并同步最终状态；
- 本执行记录：记录实际改动、真实命令结果、浏览器挂载证据、API 401 和生产环境限制。

## 10. 阶段结论

第四阶段部分完成：

- 金铲铲应用中心入口、`/app/jcc` 受保护路由、独立 7202 qiankun 注册和构建变量已落地；
- 单元测试、工作区测试、lint、生产构建、diff 和 host Playwright 均通过；
- 本地 7202 子应用已在主应用 shell 中真实挂载并渲染；
- 真实 JCC API 当前返回 401 并触发 logout，生产 entry/Nginx/部署也未完成，因此不能宣称端到端业务验收完成；
- 可以进入 JCC API 授权排查与生产资源准备阶段。
