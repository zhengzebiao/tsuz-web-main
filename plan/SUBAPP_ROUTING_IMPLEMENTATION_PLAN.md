# 子应用路由与资源代理实施方案

> 状态：实施中
>
> 本方案基于 `tsuz-web-main` 主应用、`tsuz-web-admin` 管理员子应用、现有 qiankun 集成、Docker 部署和测试环境 Nginx 约束制定。
>
> 相关阶段： [第一阶段实现计划](./SUBAPP_ROUTING_IMPLEMENTATION_PHASE_1_PLAN.md)

## 1. 已确认业务配置与关键决策

| 项目 | 决策或配置 | 状态/来源 |
| --- | --- | --- |
| 管理员用户入口 | `https://test.tusz.online/app/admin` | 已确认；用户要求 |
| 主应用端口 | `127.0.0.1:7200` | 已确认；当前部署配置 |
| 管理员子应用本地端口 | `127.0.0.1:7201` | 已确认；管理员子应用配置 |
| 后端测试 API | `https://test-api.tusz.online`，服务器内部代理到 `127.0.0.1:18080` | 已确认；用户提供并已验证 |
| 主应用页面路由 | `/app/<name>`，统一由主应用处理 | 已确认；方案决策 |
| 子应用资源路径 | `/subapps/<name>/`，由 Nginx 按子应用代理 | 已确认；方案决策 |
| 管理员资源入口 | `https://test.tusz.online/subapps/admin/` | 已确认；本方案推荐 |
| 子应用集成方式 | qiankun，主应用传递 API 和认证 bridge | 已确认；现有代码 |
| 构建时配置 | Entry/API/base 等 Vite 变量修改后必须使用新不可变 tag 构建 | 已确认；Docker/Vite 约束 |

## 2. 背景与现状

### 2.1 背景

主应用目前将管理员入口显示为 `/admin` 占位页，已有 qiankun 插槽仍使用 `/apps/mfe-app` 通用路径。管理员子应用已经独立运行在 7201 端口，需要接入主应用并为未来订单、数据等子应用建立一致的访问和资源代理规范。

### 2.2 当前架构

- 主应用路由集中在 [`apps/main/src/App.tsx`](../apps/main/src/App.tsx)，通过 `RequireAuth` 保护认证后的页面。
- qiankun 注册和认证 props 由 [`apps/main/src/micro-apps/config.ts`](../apps/main/src/micro-apps/config.ts) 生成。
- 路由、basename、端口等共享契约位于 [`packages/shared/src/index.ts`](../packages/shared/src/index.ts)。
- 主应用 Docker 构建通过 [`Dockerfile`](../Dockerfile) 编译 Vite 静态资源，运行时由容器内 Nginx 提供 SPA fallback。
- 主应用部署 workflow 在部署服务器构建镜像并推送 CCR，见 [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)。
- 后端对外 API 使用独立域名，前端构建变量可直接配置为 `https://test-api.tusz.online`。

### 2.3 现状差距

- `/admin` 是占位页面，不能挂载管理员子应用。
- 主应用 metadata、测试和文档仍使用 `/apps/mfe-app` 与 `VITE_MFE_APP_ENTRY`。
- 主应用 Docker/Compose/部署 workflow 需要将 entry 变量改为管理员语义。
- 同域部署子应用时，后续阶段还必须让管理员子应用生产构建支持 `/subapps/admin/` 静态资源 base；本阶段不修改管理员子应用仓库。

## 3. 目标与非目标

### 3.1 目标

1. 将主应用管理员入口统一为 `/app/admin`，并在认证后通过 qiankun 挂载管理员子应用。
2. 将主应用的管理员 entry 配置统一为 `VITE_ADMIN_APP_ENTRY`，本地默认值为 `//127.0.0.1:7201/`。
3. 将主应用 Docker、Compose、服务器构建 workflow、环境示例和测试同步到新的配置契约。
4. 规定 `/app/**` 由主应用处理、`/subapps/<name>/` 由 Nginx 代理的多子应用扩展模型。

### 3.2 非目标

- 本阶段不实现管理员子应用内部业务功能。
- 本阶段不修改 `tsuz-web-admin` 的 Vite `base`、Docker 或部署配置；这些属于第二阶段。
- 不将 `/app/admin` 直接反代到 7201，不绕过主应用鉴权和 auth bridge。
- 不新增 manifest 服务、动态端口网关或后端 API。

## 4. 核心流程

```text
浏览器访问 https://test.tusz.online/app/admin
  ↓
外层 Nginx 的通用 location 转发到 127.0.0.1:7200
  ↓
主应用 RequireAuth + activeRule=/app/admin
  ↓
qiankun 使用 VITE_ADMIN_APP_ENTRY 加载管理员 entry
  ↓
/subapps/admin/ 由外层 Nginx 转发到 127.0.0.1:7201
  ↓
管理员子应用挂载，接收 apiBaseUrl、accessToken、currentUser、logout
```

页面路由与静态资源入口分离：

| 类型 | 规范 | 示例 |
| --- | --- | --- |
| 用户页面 | `/app/<name>` | `/app/admin` |
| 用户嵌套路由 | `/app/<name>/**` | `/app/admin/users` |
| 子应用 HTML/静态资源 | `/subapps/<name>/` | `/subapps/admin/assets/index.js` |

## 5. 当前架构适配与总体设计

### 5.1 设计原则

- 复用现有 `RequireAuth`、`createMicroApps`、`matchesActiveRoute` 和 auth bridge。
- `/app/**` 永远先进入主应用，统一处理登录状态和布局。
- 每个子应用拥有独立 entry、端口、容器和构建配置；资源路径不与主应用 `/assets/` 冲突。
- 对外资源前缀使用业务中性的 `/subapps/`，不绑定 qiankun/MFE 技术名。
- 保留管理员子应用当前 qiankun lifecycle 技术注册名 `mfe-app` 的兼容性，主应用业务 metadata 使用 `admin`。

### 5.2 目标架构

```text
主域名 test.tusz.online
├── /app/**             → 主应用 127.0.0.1:7200
└── /subapps/admin/**   → 管理员子应用 127.0.0.1:7201

API 域名 test-api.tusz.online
└── /                   → 后端 127.0.0.1:18080
```

### 5.3 兼容策略

- 本地旧的通用 `mfe-app` 示例路径改为管理员语义，不保留旧 `/apps/mfe-app` 业务入口，避免两个激活规则同时匹配。
- 主应用现有根路径 `/`、`/apps`、`/profile` 保持不变。
- 管理员子应用独立运行仍可使用 7201 根路径；主应用挂载时由 host 传入 `/app/admin` basename。
- 已发布旧镜像可通过 workflow 的历史 tag 回滚；旧镜像仍使用旧编译 entry，符合不可变构建规则。

## 6. 公共契约

主应用共享 metadata：

```text
name=admin
title=Admin
activeRule=/app/admin
basename=/app/admin
port=7201
```

主应用构建变量：

```dotenv
VITE_API_BASE_URL=https://test-api.tusz.online
VITE_ADMIN_APP_ENTRY=https://test.tusz.online/subapps/admin/
VITE_APP_ENV=test
```

管理员子应用第二阶段构建变量：

```dotenv
VITE_PUBLIC_BASE=/subapps/admin/
```

这两个 entry/base 变量职责不同：主应用 entry 指向子应用 HTML，子应用 base 控制其静态资源前缀。

## 7. 配置、依赖与外部服务

本阶段不新增 npm 依赖、数据库迁移或 API。需要同步的非敏感配置包括：

- `VITE_ADMIN_APP_ENTRY`：主应用 qiankun entry；本地默认为 `//127.0.0.1:7201/`，测试环境指向 `/subapps/admin/`。
- `DOCKER_REGISTRY`：`ccr.ccs.tencentyun.com`。
- `VITE_API_BASE_URL`：测试环境为 `https://test-api.tusz.online`。
- SSH、CCR token 等 Secret 继续由 GitHub Environment 安全注入，不进入应用 `.env` 示例的真实值。

## 8. Nginx 与部署检查清单

测试环境外层 Nginx：

```nginx
location ^~ /subapps/admin/ {
    proxy_pass http://127.0.0.1:7201/;
}

location / {
    proxy_pass http://127.0.0.1:7200;
}
```

不要配置 `location /app/admin` 到 7201。未来新增子应用只需增加对应资源 location，例如 `/subapps/order/` → 7202；所有 `/app/order` 页面仍由 7200 处理。

部署前确认：

- 主应用和管理员应用使用独立 `DEPLOY_PATH`、`DEPLOY_REPO_PATH`、容器名和端口。
- 管理员 entry HTML、JS、CSS 和动态 chunk 都带 `/subapps/admin/` 前缀（第二阶段验收）。
- API 域名反代到 18080，CORS 允许 `https://test.tusz.online` 和 credentials。
- 修改 Vite 变量后重新构建新的不可变 tag，不能只重启旧容器。

## 9. 分阶段实施顺序

### 第一阶段：主应用管理员入口接入

> 状态：实施中
>
> 阶段计划：[SUBAPP_ROUTING_IMPLEMENTATION_PHASE_1_PLAN.md](./SUBAPP_ROUTING_IMPLEMENTATION_PHASE_1_PLAN.md)
>
> 执行记录：待创建

修改主应用路由、metadata、entry 环境变量、Docker/Compose、部署 workflow、测试和文档；不修改管理员子应用资源 base。

### 第二阶段：管理员子应用子路径构建

> 状态：未开始

修改 `tsuz-web-admin` 的 Vite base、环境示例、Docker build args 和测试，确保 `/subapps/admin/` 下资源可加载。

### 第三阶段：Nginx 与双应用真实联调

> 状态：未开始

配置测试服务器的主应用、管理员资源和 API 反代，完成登录、挂载、刷新、动态 chunk 和 API 的真实验证。

## 10. 风险与回滚

| 风险 | 影响 | 缓解措施 | 回滚 |
| --- | --- | --- | --- |
| 子应用仍生成 `/assets/*` | 资源被主应用接收，qiankun 挂载失败 | 第二阶段配置子应用 `base=/subapps/admin/` 并检查动态 chunk | 回滚主/子应用旧镜像 |
| `/app/admin` 被误代理到 7201 | 绕过主应用鉴权和 auth bridge | Nginx 仅对 `/subapps/admin/` 配置 7201 location | 恢复 `/` → 7200 |
| entry/API 配置未重新构建 | 浏览器继续使用旧地址 | 每次配置变更创建新不可变 tag | workflow 回滚历史 tag |
| 多子应用端口映射错误 | 资源加载到错误应用 | 每个 `/subapps/<name>/` 使用显式 location 和独立端口 | 删除新增 location 并回滚对应镜像 |

## 11. 完成标准

```text
用户访问 /app/admin
  ↓
主应用鉴权并匹配 admin activeRule
  ↓
加载 /subapps/admin/ entry
  ↓
管理员子应用通过 auth bridge 挂载
  ↓
API 请求使用 https://test-api.tusz.online
```

第一阶段完成要求主应用代码、配置、测试和文档同步；真实 Nginx、管理员生产 base 和跨应用联调保留到后续阶段并如实记录。
