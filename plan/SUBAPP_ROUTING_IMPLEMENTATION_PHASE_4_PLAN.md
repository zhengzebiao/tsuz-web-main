# 子应用路由与资源代理：第四阶段“金铲铲主应用接入”实现计划

> 状态：部分完成
>
> 总实施方案：[SUBAPP_ROUTING_IMPLEMENTATION_PLAN.md](./SUBAPP_ROUTING_IMPLEMENTATION_PLAN.md)
>
> 阶段执行记录：[SUBAPP_ROUTING_IMPLEMENTATION_PHASE_4_EXECUTION.md](./SUBAPP_ROUTING_IMPLEMENTATION_PHASE_4_EXECUTION.md)
>
> 范围：在主应用中增加金铲铲应用中心入口和 qiankun 注册；不提前执行金铲铲生产资源构建、服务器 Nginx 配置或真实部署。

## 1. 背景与阶段基准

### 1.1 前置阶段状态

- 第一阶段已建立管理员子应用的 `RequireAuth`、`MicroAppOutlet`、`createMicroApps`、`matchesActiveRoute` 和 auth bridge 链路，主应用代码与定向测试已落地；真实生产资源和服务器联调仍由后续环境阶段负责。
- 第二、三阶段尚未完成，不阻塞本阶段复用主应用已有的 qiankun 注册机制。
- 当前工作区已由用户将应用中心数据改成唯一的金铲铲卡片，`key` 为 `jcc`、本地端口为 `7202`，但临时路由仍为 `/jcc`，点击行为仍显示“正在建设中”。

### 1.2 当前仓库事实

- 主应用路由集中在 `apps/main/src/App.tsx`，管理员挂载路由为 `/app/admin/*`。
- 共享 metadata 位于 `packages/shared/src/index.ts`，当前仅有管理员应用。
- `apps/main/src/micro-apps/config.ts` 当前把所有 metadata 都解析到 `VITE_ADMIN_APP_ENTRY`，必须在加入第二个应用前按应用区分 entry。
- `apps/main/src/components/AppGrid.tsx` 当前没有导航行为。
- 实施前 Git 工作区只有 `apps/main/src/data/sub-apps.ts` 的用户要求变更；本阶段保留该变更并将路由按用户最新确认调整为 `/app/jcc`。
- 总方案采用 `/app/<name>` 作为用户页面路由、`/subapps/<name>/` 作为部署资源路径；用户最新确认金铲铲页面路由遵循该规范。

### 1.3 本阶段目标

1. 点击或键盘激活金铲铲卡片后，通过 React Router 导航到受保护的 `/app/jcc`。
2. 主应用在 `/app/jcc` 及其嵌套路由中创建 qiankun 容器，并以注册名 `jcc`、本地默认 entry `//127.0.0.1:7202/` 挂载子应用。
3. 管理员与金铲铲拥有独立 entry 配置，继续共享 API base 和认证 bridge，且 activeRule 不发生前缀误匹配。
4. 同步构建、部署变量、测试和阶段文档，但不伪造真实 7202 子应用或生产环境的验收结果。

## 2. 范围与约束

### 2.1 本阶段实现

- shared 金铲铲 metadata、路由、basename、端口和默认 entry；
- 主应用 `/app/jcc/*` 路由与应用卡片 SPA 导航；
- `VITE_JCC_APP_ENTRY` 的 Vite、Docker、Compose 和 workflow 构建时传递；
- shared、微应用配置、应用卡片和主应用承载路由测试；
- README、总方案、本阶段计划和执行记录同步。

### 2.2 本阶段明确不实现

- 不修改独立的金铲铲子应用仓库或其内部业务页面；
- 不配置金铲铲生产 `base=/subapps/jcc/`、外层 Nginx 或服务器端口；
- 不执行生产部署、镜像发布、服务器修改或真实外部服务调用；
- 不改变管理员 `/app/admin` 契约，不删除历史 `/apps/mfe-app/*` 兼容路由；
- 不实现动态 manifest、运行时端口发现或应用权限模型。

### 2.3 已确认约束

- 金铲铲注册字段/名称为 `jcc`；
- 用户页面路由和子应用 basename 均为 `/app/jcc`；
- 本地子应用端口为 `7202`，默认 entry 为 `//127.0.0.1:7202/`；
- `/app/jcc` 必须由主应用处理并经过 `RequireAuth`，不能直接反代到 7202；
- 子应用继续接收现有 `appName`、`basename`、`apiBaseUrl`、认证读取和退出登录 props。

### 2.4 临时数据与隔离测试规则

本阶段不涉及数据库、缓存、迁移或持久业务数据。单元测试使用固定非生产认证数据；浏览器验证不连接生产环境、不记录真实 Token 或 Secret。

### 2.5 前置依赖与环境条件

| 依赖                | 所需状态                                         | 当前状态         | 不满足时的处理                                     |
| ------------------- | ------------------------------------------------ | ---------------- | -------------------------------------------------- |
| 主应用 qiankun 基础 | 能注册多个 metadata 并挂载到 `#subapp-container` | 已具备管理员实现 | 复用现有实现并增加多应用测试                       |
| 金铲铲子应用 7202   | 真实挂载验证时可访问且支持 qiankun               | 待验证           | 完成主应用无副作用验证，将真实挂载标记为待环境验证 |
| 生产 entry/Nginx    | 部署时提供 `VITE_JCC_APP_ENTRY` 和资源代理       | 未就绪且未授权   | 本阶段只传递变量和记录部署要求，不执行外部操作     |

## 3. 详细设计与修改文件

### 3.1 Shared 子应用契约

修改：

- `packages/shared/src/index.ts`：新增 `JCC_APP_ROUTE`、`JCC_APP_BASENAME`、`DEFAULT_JCC_APP_ENTRY` 和 `jccAppMeta`，并加入 `microAppMetas`；
- `packages/shared/src/index.test.ts`：覆盖两套 metadata 和 `/app/jcc` 路由边界。

设计：

1. `jccAppMeta.name` 为 `jcc`、`activeRule`/`basename` 为 `/app/jcc`、`port` 为 `7202`；
2. 继续复用 `matchesActiveRoute`，允许 `/app/jcc/**`，拒绝 `/app/jcc-legacy` 等前缀碰撞；
3. 管理员常量和 metadata 保持向后兼容。

### 3.2 主应用注册、路由和卡片导航

修改或新增：

- `apps/main/src/micro-apps/config.ts`、`config.test.ts`：按 metadata 名称分别读取管理员和金铲铲 entry；
- `apps/main/src/App.tsx`、`App.test.tsx`：增加受保护的 `/app/jcc/*` qiankun outlet 并验证容器；
- `apps/main/src/data/sub-apps.ts`：将卡片路由改为 `/app/jcc`，复用 shared 路由和端口；
- `apps/main/src/components/AppGrid.tsx`、`apps/main/src/pages/AppsPage.test.tsx`：点击及键盘激活时调用 `navigate(app.route)`，同步唯一应用断言；
- `e2e/host-login.spec.ts`：把旧八应用 smoke 断言更新为金铲铲卡片。

设计：

1. 卡片只负责 SPA 导航，不直接请求 7202，也不在 UI 中拼接 entry；
2. `/app/jcc/*` 复用现有 `MicroAppOutlet`，其 mount effect 继续触发 qiankun 路由重算；
3. `createMicroApps` 继续统一添加认证和容器 guard，并向两个子应用传递相同 auth bridge；
4. 单元测试只证明主应用导航、注册和容器契约，不能替代 7202 真实挂载。

### 3.3 数据、迁移或状态

不涉及数据结构、迁移、缓存或持久状态变更。现有登录 session 和 auth store 行为不变。

### 3.4 API、Schema 或公共契约

新增前端共享常量和 metadata；不新增后端 API。`MicroAppProps` 字段保持不变，金铲铲通过既有 props 接收 `appName=jcc`、`basename=/app/jcc`、API base 和认证 bridge。

### 3.5 配置、依赖和外部服务

- 新增可选构建时变量 `VITE_JCC_APP_ENTRY`，本地默认 `//127.0.0.1:7202/`；
- 同步 `apps/main/src/vite-env.d.ts`、环境示例、Dockerfile、Compose 和部署 workflow；
- 不新增 npm 依赖，不修改锁文件；
- 生产 URL 未确认，不在代码或示例中声明为已就绪；部署时应显式提供实际 entry。

### 3.6 安全、权限与可观测性

- `/app/jcc` 保持在 `RequireAuth` 内，未认证用户仍跳转 `/login`；
- activeRule 同时要求已认证且 `#subapp-container` 已存在，保持现有 fail-closed 行为；
- 不把 Token、Secret 或真实凭证写入 URL、配置示例、测试或文档；
- 本阶段不新增日志或指标，真实挂载通过浏览器 Console/Network 检查。

## 4. 实施步骤

1. 更新总方案并建立本阶段计划；
2. 增加 shared metadata、默认 entry 和测试；
3. 扩展主应用 entry 解析与 qiankun 注册测试；
4. 接入 `/app/jcc/*` 路由和卡片导航，补充组件/路由测试；
5. 同步 Vite、Docker、Compose、workflow、环境示例和 README；
6. 执行定向测试、lint、构建、全量回归和 diff 检查；
7. 创建执行记录，根据真实结果更新本计划与总方案状态。

真实 7202 子应用验证仅在服务已经就绪时进行；本阶段不为验证而修改或发布外部子应用。

## 5. 测试与验证计划

### 5.1 定向测试

| 测试文件/范围                             | 覆盖行为                                            | 预期结果                                       |
| ----------------------------------------- | --------------------------------------------------- | ---------------------------------------------- |
| `packages/shared/src/index.test.ts`       | admin/jcc metadata、嵌套路由和前缀碰撞              | 两个应用契约正确且互不误匹配                   |
| `apps/main/src/micro-apps/config.test.ts` | 默认/覆盖 entry、两个注册、auth props 和 activeRule | admin 使用 7201，jcc 使用 7202，guard 保持不变 |
| `apps/main/src/pages/AppsPage.test.tsx`   | 唯一卡片、点击和键盘导航                            | 地址变为 `/app/jcc`                            |
| `apps/main/src/App.test.tsx`              | 已认证访问 `/app/jcc`                               | 主应用壳内渲染 `#subapp-container`             |
| `e2e/host-login.spec.ts`                  | 登录后应用中心展示                                  | 只显示金铲铲卡片                               |

### 5.2 回归与质量检查

```bash
pnpm --filter @tsuz/shared test
pnpm --filter tsuz-web-main test
pnpm --filter tsuz-web-main lint
pnpm --filter tsuz-web-main build
pnpm test
pnpm lint
git diff --check
```

如环境允许，再运行 `pnpm exec playwright test e2e/host-login.spec.ts`。现有管理员远程集成 spec 不作为金铲铲真实挂载证据。

### 5.3 真实环境验证

启动主应用 7200 和兼容 qiankun 的金铲铲子应用 7202 后，登录并点击卡片，验证 `/app/jcc`、主应用 Header、子应用内容、刷新、嵌套路由、认证 props、Console 和 Network。若 7202 未运行或不在当前工作区，本项记录为“未执行/待环境验证”。

## 6. 验收标准与追踪

| 编号    | 验收标准                                                                  | 实现位置                     | 验证方式                | 状态   |
| ------- | ------------------------------------------------------------------------- | ---------------------------- | ----------------------- | ------ |
| AC-4-01 | 金铲铲卡片点击和键盘激活均导航到 `/app/jcc`                               | `AppGrid.tsx`、`sub-apps.ts` | Testing Library         | 已满足 |
| AC-4-02 | `/app/jcc` 和嵌套路由由受保护主应用壳承载                                 | `App.tsx`                    | 路由单测                | 已满足 |
| AC-4-03 | qiankun 注册 `jcc`，basename/activeRule 为 `/app/jcc`，默认 entry 为 7202 | shared、`config.ts`          | shared/config 单测      | 已满足 |
| AC-4-04 | admin 和 jcc entry/activeRule 独立且认证 props 不回归                     | `config.ts`                  | config 单测与主应用回归 | 已满足 |
| AC-4-05 | Vite、Docker、Compose 和 workflow 完整传递 `VITE_JCC_APP_ENTRY`           | 配置文件                     | 静态检查和 build        | 已满足 |
| AC-4-06 | 文档明确生产资源和真实挂载尚需独立子应用/Nginx 环境                       | README 与三类方案文档        | 文档检查                | 已满足 |

## 7. 风险、回滚与异常处理

| 风险或失败场景               | 影响                              | 预防/检测                                    | 回滚或恢复                             |
| ---------------------------- | --------------------------------- | -------------------------------------------- | -------------------------------------- |
| 7202 未运行或非 qiankun 应用 | `/app/jcc` 容器为空并出现加载错误 | 单测与真实环境结果分开；检查 Console/Network | 启动兼容子应用或回滚 JCC metadata/路由 |
| JCC 子应用 basename 不一致   | 嵌套路由刷新或导航失败            | host 传递 `/app/jcc` 并在真实联调核对        | 同步子应用路由配置                     |
| entry 配置串用管理员变量     | 加载错误子应用                    | 对两项注册分别测试 entry                     | 回滚变量变更并重新构建旧 tag           |
| 生产资源 base/Nginx 未配置   | 生产 entry 或 chunk 404           | 文档标记未就绪，不宣称部署完成               | 不发布该入口或回滚主应用镜像           |

本阶段没有数据副作用；应用代码可通过历史不可变镜像回滚。Vite entry 是构建时配置，修改变量后必须构建新镜像。

## 8. 阶段交付物

代码与配置：

- shared metadata、主应用路由/导航/注册和完整构建变量传递。

测试：

- shared、config、应用中心、主应用路由及 host smoke 同步。

文档：

- 更新 [总实施方案](./SUBAPP_ROUTING_IMPLEMENTATION_PLAN.md) 的决策、阶段状态和链接；
- 更新本阶段计划的状态和实施调整；
- 创建 [第四阶段执行记录](./SUBAPP_ROUTING_IMPLEMENTATION_PHASE_4_EXECUTION.md)。

## 9. 计划调整记录

| 调整项                 | 原计划                        | 调整后                                                                    | 原因                                                                                                                       | 对总方案/后续阶段的影响                                                    |
| ---------------------- | ----------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 浏览器真实联调         | 7202 就绪时验证挂载和业务页面 | 使用现有主应用登录真实联调；另以浏览器内无副作用 API 响应替身隔离挂载验证 | 7202 实际可访问且 qiankun 静态资源均为 200，但当前本地 JCC API 请求返回 401 后子应用调用 host `logout`，页面很快回到登录页 | 可以证明 qiankun 挂载链路成立；真实业务 API 授权仍作为遗留项，不误记为通过 |
| 旧未使用管理员占位组件 | 不在计划中                    | 删除 `App.tsx` 内从未被路由引用的 `AdminPage` 及相关 import               | 仓库级 ESLint 报告既有 unused error，阻塞本阶段质量门禁；删除不改变运行时行为                                              | 无公共契约影响，管理员仍由 `/app/admin/*` 的 `MicroAppOutlet` 承载         |
