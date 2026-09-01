# 子应用路由与资源代理：第一阶段执行记录

> 状态：部分完成
>
> 执行日期：2026-09-01
>
> 总实施方案：[SUBAPP_ROUTING_IMPLEMENTATION_PLAN.md](./SUBAPP_ROUTING_IMPLEMENTATION_PLAN.md)
>
> 阶段实现计划：[SUBAPP_ROUTING_IMPLEMENTATION_PHASE_1_PLAN.md](./SUBAPP_ROUTING_IMPLEMENTATION_PHASE_1_PLAN.md)

## 1. 执行范围与结论

本次完成主应用管理员入口和构建配置的第一阶段改造。

阶段结论：主应用代码、配置、测试和文档已完成并通过主应用定向验证；管理员子应用生产资源 base、服务器 Nginx 和真实双应用 qiankun 联调未在本阶段执行，因此整体标记为“部分完成”，不能据此宣称测试环境端到端已完成。

本阶段实际完成：

1. 主应用管理员路由从 `/admin` 占位页切换为受保护的 `/app/admin/*` qiankun outlet；
2. shared metadata、basename 和本地默认 entry 切换为管理员语义；
3. Dockerfile、Compose、远程构建 workflow、环境示例和 README 使用 `VITE_ADMIN_APP_ENTRY`；
4. shared/config/header 单测和 qiankun E2E 路径同步；
5. 新增子应用路由与资源代理总方案、第一阶段计划和本执行记录。

本阶段未实现或未执行：

- 未修改 `tsuz-web-admin` 的 Vite `base`，其生产静态资源尚未确认可从 `/subapps/admin/` 加载；
- 未修改服务器外层 Nginx，`/subapps/admin/` → 7201 和 `/` → 7200 需要后续环境阶段执行；
- 未执行真实 CCR/服务器部署及浏览器跨容器 qiankun 联调；
- 未新增其他 `/app/**` 子应用。

## 2. 实际代码与配置变更

### 2.1 主应用管理员路由和 qiankun 契约

- [`apps/main/src/App.tsx`](../apps/main/src/App.tsx)：删除 `/admin` 占位页面，增加受保护的 `app/admin/*` 路由并更新管理员挂载说明、等待提示和错误提示；
- [`apps/main/src/components/AppHeader.tsx`](../apps/main/src/components/AppHeader.tsx)：管理员入口导航到 `/app/admin`；
- [`packages/shared/src/index.ts`](../packages/shared/src/index.ts)：新增管理员路由、basename、默认 entry 和 `adminAppMeta`；
- [`apps/main/src/micro-apps/config.ts`](../apps/main/src/micro-apps/config.ts)：读取 `VITE_ADMIN_APP_ENTRY`，保留认证、容器和 auth bridge 逻辑；
- [`packages/shared/src/index.test.ts`](../packages/shared/src/index.test.ts)、[`apps/main/src/micro-apps/config.test.ts`](../apps/main/src/micro-apps/config.test.ts)、[`apps/main/src/components/AppHeader.test.tsx`](../apps/main/src/components/AppHeader.test.tsx)：覆盖管理员路由、前缀碰撞、entry 覆盖和 header 导航。

关键实现链路：

```text
/app/admin
  → RequireAuth
  → main App authenticated shell
  → qiankun activeRule=/app/admin
  → VITE_ADMIN_APP_ENTRY
  → #subapp-container + auth bridge props
```

### 2.2 构建、部署和环境示例

- [`Dockerfile`](../Dockerfile)、[`docker-compose.yml`](../docker-compose.yml)：构建参数由 `VITE_MFE_APP_ENTRY` 改为 `VITE_ADMIN_APP_ENTRY`，默认本地入口为 `//127.0.0.1:7201/`；
- [` .github/workflows/deploy.yml`](../.github/workflows/deploy.yml)：服务器构建、远程参数传递和生成部署 `.env` 使用 `VITE_ADMIN_APP_ENTRY`；
- [`apps/main/src/vite-env.d.ts`](../apps/main/src/vite-env.d.ts)、[`apps/main/.env.example`](../apps/main/.env.example)、[` .env.deploy.example`](../.env.deploy.example)：同步新变量；
- [`README.md`](../README.md)：同步本地管理员访问路径、部署变量和 `/app/**`/`/subapps/**` 的 Nginx 职责说明。

本阶段没有新增 npm 依赖、数据迁移或 API 公共契约。

## 3. 关键设计结果

1. 用户业务页面统一使用 `/app/<name>`，所有 `/app/**` 页面由主应用 7200 响应；
2. qiankun 子应用资源使用 `/subapps/<name>/`，管理员资源规划为 `/subapps/admin/` → 7201；
3. 主应用 entry 使用 `VITE_ADMIN_APP_ENTRY`，测试环境建议为 `https://test.tusz.online/subapps/admin/`；
4. 管理员子应用当前 qiankun 技术注册名 `mfe-app` 未在主应用阶段改动，以保持与 `tsuz-web-admin` 当前生命周期插件的兼容；
5. 后端 API 仍由独立 `https://test-api.tusz.online` 提供，主应用不增加 `/api` 反代逻辑。

## 4. 与阶段计划的差异

实现与阶段计划的主范围一致。阶段计划原本明确不修改管理员子应用仓库和真实 Nginx；根据该边界，这些工作保留给第二、三阶段。

一个实现细节调整是默认 entry 固定为 `//127.0.0.1:7201/`，而不是根据当前 hostname 动态拼接端口。原因是主应用访问测试域名时，默认动态拼接会指向公网域名 7201，无法表达本地管理员服务；部署环境必须显式注入 `VITE_ADMIN_APP_ENTRY`。

## 5. 测试与验证结果

### 5.1 验证汇总

| 检查 | 命令或方法 | 结果 | 证据/说明 |
| --- | --- | --- | --- |
| 主应用单元测试 | `pnpm --filter tsuz-web-main test` | 通过 | 10 个测试文件、35 个测试通过 |
| 主应用 lint | `pnpm --filter tsuz-web-main lint` | 通过 | TypeScript 无错误 |
| 主应用生产构建 | `pnpm --filter tsuz-web-main build` | 通过 | Vite 构建成功；存在既有大 chunk warning |
| Diff 检查 | `git diff --check` | 通过 | 未发现 whitespace 错误 |
| Prettier | `pnpm exec prettier --check ...` | 未完全执行 | `.env` 无 parser，方案/README 存在格式提示；不影响 TypeScript/build |
| 真实 qiankun 集成 | `MFE_INTEGRATION_E2E=true ...` | 未执行 | 当前未启动管理员 7201 与完整受控环境 |
| 真实 Nginx/部署 | 服务器操作 | 未执行 | 本阶段不执行外部副作用操作 |

### 5.2 失败与未执行项

- 首次运行主应用测试时，新增 header 测试分别渲染 Ant Design 响应式组件，触发测试环境 `matchMedia` 订阅问题；已合并为单个渲染场景后，`pnpm --filter tsuz-web-main test` 全部通过。
- Prettier 不能解析 `.env` 文件；README 和方案文档在未格式化时有 Markdown 表格/换行提示，需后续单独格式化或按仓库文档风格调整。
- 集成 E2E、管理员生产 `base=/subapps/admin/`、服务器 Nginx 和真实部署均未执行。

### 5.3 真实环境或人工验证

| 验证项 | 环境 | 副作用/授权 | 结果 |
| --- | --- | --- | --- |
| `test.tusz.online` 的 Nginx 路由 | 测试服务器 | 需要服务器配置变更授权 | 未执行，待第三阶段 |
| 管理员 entry 与静态资源 | 测试服务器 + 7201 | 需要管理员镜像和构建配置 | 未执行，待第二、三阶段 |
| 后端 `https://test-api.tusz.online` | 测试 API 域名 | 只读探测已在前序会话验证 | 当前未因本阶段改动重复执行 |

## 6. 阶段验收结果

| 编号 | 验收标准 | 结果 | 验证证据 |
| --- | --- | --- | --- |
| AC-1-01 | 管理员按钮和受保护路由使用 `/app/admin` | 通过 | `App.tsx`、`AppHeader.test.tsx` |
| AC-1-02 | qiankun activeRule/basename 为 `/app/admin`，entry 从 `VITE_ADMIN_APP_ENTRY` 读取 | 通过 | shared/config 单测 |
| AC-1-03 | Docker、Compose、远程服务器构建传递 `VITE_ADMIN_APP_ENTRY` | 通过 | Docker/workflow 静态检查、主应用 build |
| AC-1-04 | 主应用不再把管理员入口描述为通用 `/apps/mfe-app` | 通过 | 活跃代码、README 和 E2E 已同步；历史计划记录保留历史事实 |
| AC-1-05 | 认证和 host props 逻辑保持不变 | 通过 | `pnpm --filter tsuz-web-main test` |
| AC-1-06 | `/app/**` 与 `/subapps/**` 路由职责在文档中明确，Nginx 真实配置留后续阶段 | 通过 | 总方案、阶段计划和 README |

## 7. 安全、兼容性与可观测性核对

### 安全

- `/app/admin` 仍处于主应用 `RequireAuth` 保护范围内；未把该页面路径直接代理到 7201；
- CCR token、SSH 私钥等 Secret 未写入应用 `.env` 示例或代码；
- API 继续使用 HTTPS 独立域名，具体 CORS 和 18080 反代属于后端/服务器环境配置。

### 兼容性

- qiankun 技术注册名 `mfe-app` 与管理员子应用当前实现保持兼容；业务路由已升级为 `/app/admin`；
- 旧镜像可通过不可变 tag 回滚；旧镜像会继续使用构建时的旧 entry，这是预期行为；
- 未宣称旧 `/apps/mfe-app` 页面路由继续兼容，因为该路径属于旧通用示例契约。

### 可观测性

- 未新增日志或指标；部署 workflow 保留服务器构建和镜像 inspect 输出；
- 真实 qiankun/Nginx 加载错误需在后续浏览器 Network 和容器日志中验证。

## 8. 遗留问题与后续阶段入口

| 问题 | 影响 | 负责人/条件 | 处理阶段 |
| --- | --- | --- | --- |
| 管理员子应用 Vite 资源 base 尚未改为 `/subapps/admin/` | 同域部署可能请求错误的 `/assets/*` | 修改 `tsuz-web-admin` 并构建新镜像 | 第二阶段 |
| 外层 Nginx 尚未增加 `/subapps/admin/` → 7201 | 测试域名无法加载管理员 entry | 测试服务器 Nginx 配置授权 | 第三阶段 |
| 真实双应用 qiankun 联调未执行 | 尚无端到端通过证据 | 两个容器和测试账号就绪 | 第三阶段 |

下一阶段可复用：

- `/app/admin`、`ADMIN_APP_ROUTE`、`adminAppMeta` 和 `VITE_ADMIN_APP_ENTRY` 已成为主应用契约；
- 后续子应用必须使用独立 `/app/<name>` 页面路由、`/subapps/<name>/` 资源入口和独立端口；
- 不能把 `/app/<name>` 直接反代到子应用端口。

## 9. 文档同步记录

- [`SUBAPP_ROUTING_IMPLEMENTATION_PLAN.md`](./SUBAPP_ROUTING_IMPLEMENTATION_PLAN.md)：已创建总体路由、资源代理、环境和分阶段方案；
- [`SUBAPP_ROUTING_IMPLEMENTATION_PHASE_1_PLAN.md`](./SUBAPP_ROUTING_IMPLEMENTATION_PHASE_1_PLAN.md)：已更新为已完成并记录实际边界；
- [`11.md`](./11.md)：已链接新总体方案，并更新当前主应用管理员入口现状；原第一阶段历史记录未覆盖；
- 本执行记录：记录主应用阶段实际改动、验证结果和第二/三阶段遗留项。

## 10. 阶段结论

第一阶段主应用改造已完成，但总体阶段交付标记为部分完成：

- 主应用管理员路由、构建配置、测试和文档已落地；
- 主应用验证通过；
- 管理员子应用子路径构建和服务器 Nginx/真实联调仍待后续阶段；
- 可以进入第二阶段，但不能把当前提交直接视为测试环境双应用端到端验收完成。
