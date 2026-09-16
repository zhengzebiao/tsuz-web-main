# 子应用路由与资源代理实施方案

> 状态：实施中
>
> 本方案基于 `tsuz-web-main` 主应用、`tsuz-web-admin` 管理员子应用、现有 qiankun 集成、Docker 部署和测试环境 Nginx 约束制定。
>
> 相关阶段：[第一阶段实现计划](./SUBAPP_ROUTING_IMPLEMENTATION_PHASE_1_PLAN.md)；[第四阶段“金铲铲主应用接入”实现计划](./SUBAPP_ROUTING_IMPLEMENTATION_PHASE_4_PLAN.md)

## 1. 已确认业务配置与关键决策

| 项目                 | 决策或配置                                                         | 状态/来源                                |
| -------------------- | ------------------------------------------------------------------ | ---------------------------------------- |
| 管理员用户入口       | `https://test.tusz.online/app/admin`                               | 已确认；用户要求                         |
| 主应用端口           | `127.0.0.1:7200`                                                   | 已确认；当前部署配置                     |
| 管理员子应用本地端口 | `127.0.0.1:7201`                                                   | 已确认；管理员子应用配置                 |
| 金铲铲注册名/字段    | `jcc`                                                              | 已确认；用户要求                         |
| 金铲铲用户页面路由   | `/app/jcc`                                                         | 已确认；用户要求，与子应用 basename 一致 |
| 金铲铲子应用本地端口 | `127.0.0.1:7202`                                                   | 已确认；用户要求                         |
| 后端测试 API         | `https://test-api.tusz.online`，服务器内部代理到 `127.0.0.1:18080` | 已确认；用户提供并已验证                 |
| 主应用页面路由       | `/app/<name>`，统一由主应用处理                                    | 已确认；方案决策                         |
| 子应用资源路径       | `/subapps/<name>/`，由 Nginx 按子应用代理                          | 已确认；方案决策                         |
| 管理员资源入口       | `https://test.tusz.online/subapps/admin/`                          | 已确认；本方案推荐                       |
| 金铲铲生产资源入口   | 尚未提供                                                           | 待环境阶段确认；本阶段不得假定已就绪     |
| 子应用集成方式       | qiankun，主应用传递 API 和认证 bridge                              | 已确认；现有代码                         |
| 构建时配置           | Entry/API/base 等 Vite 变量修改后必须使用新不可变 tag 构建         | 已确认；Docker/Vite 约束                 |

## 2. 背景与现状

### 2.1 背景

第一阶段已经把管理员入口接入 `/app/admin` qiankun 路由，并建立 `/app/<name>` 页面与 `/subapps/<name>/` 资源分离规范。应用中心随后调整为唯一的金铲铲入口；其本地子应用运行在 7202，但主应用尚未提供 `/app/jcc` 路由、独立 entry 和卡片导航，需要复用既有管理员接入链路完成扩展。

### 2.2 当前架构

- 主应用路由集中在 [`apps/main/src/App.tsx`](../apps/main/src/App.tsx)，通过 `RequireAuth` 保护认证后的页面。
- qiankun 注册和认证 props 由 [`apps/main/src/micro-apps/config.ts`](../apps/main/src/micro-apps/config.ts) 生成。
- 路由、basename、端口等共享契约位于 [`packages/shared/src/index.ts`](../packages/shared/src/index.ts)。
- 主应用 Docker 构建通过 [`Dockerfile`](../Dockerfile) 编译 Vite 静态资源，运行时由容器内 Nginx 提供 SPA fallback。
- 主应用部署 workflow 在部署服务器构建镜像并推送 CCR，见 [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)。
- 后端对外 API 使用独立域名，前端构建变量可直接配置为 `https://test-api.tusz.online`。

### 2.3 现状差距

- 管理员主应用接入已落地，但其生产资源 base、服务器 Nginx 与真实部署联调仍待第二、三阶段。
- 金铲铲卡片点击仍显示“正在建设中”，尚未导航到业务路由。
- shared metadata 和主应用 qiankun 注册当前只有管理员应用，不能在 `/app/jcc` 激活 7202 子应用。
- Docker/Compose/部署 workflow 尚未传递独立的 `VITE_JCC_APP_ENTRY`。
- 金铲铲生产资源 entry/base 和服务器代理尚未确认，本阶段只能完成主应用契约与本地联调。

## 3. 目标与非目标

### 3.1 目标

1. 保持管理员 `/app/admin` 和 `VITE_ADMIN_APP_ENTRY` 既有契约。
2. 点击应用中心的金铲铲卡片后进入 `/app/jcc`，并在认证后通过 qiankun 挂载本地 7202 子应用。
3. 为金铲铲增加独立 `VITE_JCC_APP_ENTRY`，同步主应用 Docker、Compose、服务器构建 workflow、环境示例和测试。
4. 所有子应用继续遵循 `/app/**` 由主应用处理、`/subapps/<name>/` 由 Nginx 代理的扩展模型。

### 3.2 非目标

- 不实现管理员或金铲铲子应用内部业务功能。
- 不修改独立子应用的 Vite `base`、Docker 或生产部署配置；管理员部分属于第二阶段，金铲铲部分待后续环境阶段确认。
- 不将 `/app/admin` 或 `/app/jcc` 直接反代到子应用端口，不绕过主应用鉴权和 auth bridge。
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

| 类型                 | 规范               | 示例                             |
| -------------------- | ------------------ | -------------------------------- |
| 用户页面             | `/app/<name>`      | `/app/admin`                     |
| 用户嵌套路由         | `/app/<name>/**`   | `/app/admin/users`               |
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
activeRule=/app/admin
basename=/app/admin
port=7201

name=jcc
activeRule=/app/jcc
basename=/app/jcc
port=7202
```

主应用构建变量：

```dotenv
VITE_API_BASE_URL=https://test-api.tusz.online
VITE_ADMIN_APP_ENTRY=https://test.tusz.online/subapps/admin/
VITE_JCC_APP_ENTRY=<待确认的金铲铲生产资源入口>
VITE_APP_ENV=test
```

`VITE_JCC_APP_ENTRY` 本地默认值为 `//127.0.0.1:7202/`；生产值未确认前不得把占位内容用于构建或部署。

管理员子应用第二阶段构建变量：

```dotenv
VITE_PUBLIC_BASE=/subapps/admin/
```

这两个 entry/base 变量职责不同：主应用 entry 指向子应用 HTML，子应用 base 控制其静态资源前缀。

## 7. 配置、依赖与外部服务

本阶段不新增 npm 依赖、数据库迁移或 API。需要同步的非敏感配置包括：

- `VITE_ADMIN_APP_ENTRY`：管理员 qiankun entry；本地默认为 `//127.0.0.1:7201/`，测试环境指向 `/subapps/admin/`。
- `VITE_JCC_APP_ENTRY`：金铲铲 qiankun entry；本地默认为 `//127.0.0.1:7202/`，生产资源入口待确认。
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

不要配置 `location /app/admin` 到 7201，也不要配置 `location /app/jcc` 到 7202。金铲铲生产资源前缀确认后，应增加独立 `/subapps/<name>/` resource location；所有 `/app/**` 页面仍由 7200 主应用处理。

部署前确认：

- 主应用和管理员应用使用独立 `DEPLOY_PATH`、`DEPLOY_REPO_PATH`、容器名和端口。
- 管理员 entry HTML、JS、CSS 和动态 chunk 都带 `/subapps/admin/` 前缀（第二阶段验收）。
- API 域名反代到 18080，CORS 允许 `https://test.tusz.online` 和 credentials。
- 修改 Vite 变量后重新构建新的不可变 tag，不能只重启旧容器。

## 9. 分阶段实施顺序

### 第一阶段：主应用管理员入口接入

> 状态：部分完成
>
> 阶段计划：[SUBAPP_ROUTING_IMPLEMENTATION_PHASE_1_PLAN.md](./SUBAPP_ROUTING_IMPLEMENTATION_PHASE_1_PLAN.md)
>
> 执行记录：[SUBAPP_ROUTING_IMPLEMENTATION_PHASE_1_EXECUTION.md](./SUBAPP_ROUTING_IMPLEMENTATION_PHASE_1_EXECUTION.md)

修改主应用路由、metadata、entry 环境变量、Docker/Compose、部署 workflow、测试和文档；不修改管理员子应用资源 base。

### 第二阶段：管理员子应用子路径构建

> 状态：未开始

修改 `tsuz-web-admin` 的 Vite base、环境示例、Docker build args 和测试，确保 `/subapps/admin/` 下资源可加载。

### 第三阶段：Nginx 与双应用真实联调

> 状态：未开始

配置测试服务器的主应用、管理员资源和 API 反代，完成登录、挂载、刷新、动态 chunk 和 API 的真实验证。

### 第四阶段：金铲铲主应用接入

> 状态：部分完成
>
> 阶段计划：[SUBAPP_ROUTING_IMPLEMENTATION_PHASE_4_PLAN.md](./SUBAPP_ROUTING_IMPLEMENTATION_PHASE_4_PLAN.md)
>
> 执行记录：[SUBAPP_ROUTING_IMPLEMENTATION_PHASE_4_EXECUTION.md](./SUBAPP_ROUTING_IMPLEMENTATION_PHASE_4_EXECUTION.md)

在应用中心保留唯一的金铲铲卡片，点击后进入受保护的 `/app/jcc`；主应用注册 `jcc` qiankun 应用，本地默认加载 `//127.0.0.1:7202/`，并同步独立的 `VITE_JCC_APP_ENTRY` 构建配置。主应用代码和本地 qiankun 挂载已验证，但当前真实 JCC API 返回 401 并触发 host logout；生产资源 base、服务器 Nginx 和真实部署也未完成，因此本阶段结论为部分完成。

## 10. 风险与回滚

| 风险                                            | 影响                                              | 缓解措施                                                         | 回滚                                                    |
| ----------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| 子应用仍生成 `/assets/*`                        | 资源被主应用接收，qiankun 挂载失败                | 第二阶段配置子应用 `base=/subapps/admin/` 并检查动态 chunk       | 回滚主/子应用旧镜像                                     |
| `/app/admin` 或 `/app/jcc` 被误代理到子应用端口 | 绕过主应用鉴权和 auth bridge                      | Nginx 只代理子应用资源前缀，所有 `/app/**` 保持在 7200           | 恢复 `/` → 7200                                         |
| JCC API 返回 401                                | 金铲铲现有客户端会调用 host `logout` 并回到登录页 | 真实联调使用有效登录会话；失败时通过 Network 区分挂载与 API 授权 | 修复 API 授权后重试，不把 API 失败误判为 qiankun 未挂载 |
| entry/API 配置未重新构建                        | 浏览器继续使用旧地址                              | 每次配置变更创建新不可变 tag                                     | workflow 回滚历史 tag                                   |
| 多子应用端口映射错误                            | 资源加载到错误应用                                | 每个 `/subapps/<name>/` 使用显式 location 和独立端口             | 删除新增 location 并回滚对应镜像                        |

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

第四阶段主应用完成标准为：金铲铲卡片导航到 `/app/jcc`，认证路由创建 qiankun 容器，`jcc` 注册从独立 entry 加载并接收 `/app/jcc` basename 与 auth bridge。真实生产资源/Nginx 仍保留到后续环境阶段；本地真实联调必须把“子应用已挂载”和“业务 API 已授权”分别记录。
