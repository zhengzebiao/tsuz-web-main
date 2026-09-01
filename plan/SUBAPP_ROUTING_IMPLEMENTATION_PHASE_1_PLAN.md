# 子应用路由与资源代理：第一阶段实现计划

> 状态：已完成
>
> 总实施方案：[SUBAPP_ROUTING_IMPLEMENTATION_PLAN.md](./SUBAPP_ROUTING_IMPLEMENTATION_PLAN.md)
>
> 阶段执行记录：[SUBAPP_ROUTING_IMPLEMENTATION_PHASE_1_EXECUTION.md](./SUBAPP_ROUTING_IMPLEMENTATION_PHASE_1_EXECUTION.md)
>
> 范围：主应用管理员 qiankun 入口接入和构建配置同步；不提前实现管理员子应用 `/subapps/admin/` 资源 base 或服务器 Nginx 真实联调。

## 1. 阶段基准

### 1.1 前置状态

- 主应用已有 `RequireAuth`、`createMicroApps`、`matchesActiveRoute` 和 auth bridge。
- 主应用当前管理员按钮进入 `/admin` 占位页，qiankun 仍使用 `/apps/mfe-app`。
- 管理员子应用 `tsuz-web-admin` 当前生命周期注册名为 `mfe-app`，本地 dev server 使用 7201；第一阶段保留该技术注册名以维持兼容。

### 1.2 阶段目标

1. 登录后的管理员入口和 qiankun activeRule 统一为 `/app/admin`。
2. 主应用 entry 通过 `VITE_ADMIN_APP_ENTRY` 配置，本地默认指向 `//127.0.0.1:7201/`。
3. 主应用 Dockerfile、Compose、服务器构建 workflow 和环境示例传递新变量。
4. 更新测试和文档，明确 `/app/**` 页面由主应用处理、`/subapps/**` 资源由 Nginx 代理。

## 2. 范围与约束

### 2.1 本阶段实现

- shared admin metadata、activeRule、basename 和默认 entry；
- 主应用管理员路由、header、qiankun outlet 文案；
- `VITE_ADMIN_APP_ENTRY` 类型、Docker build arg、Compose 和远程构建 workflow；
- 主应用单元/E2E 测试和方案/执行文档。

### 2.2 本阶段不实现

- 不修改 `tsuz-web-admin` 仓库；
- 不实现管理员业务页面、权限模型或新的 API；
- 不配置或执行服务器 Nginx、CCR、真实生产部署；
- 不实现动态子应用 manifest 或其他 `/app/**` 子应用。

### 2.3 已确认约束

- 用户访问路由为 `/app/admin`；不能将该路径直接反代到 7201。
- 子应用资源前缀采用 `/subapps/admin/`，但其 Vite `base` 属于第二阶段。
- 后端 API 使用 `https://test-api.tusz.online`，内部端口 18080；主应用仅同步 entry，不改变 API 机制。
- 配置是 Vite 构建时变量，变更后使用新不可变 tag。

## 3. 详细设计与修改文件

### 3.1 Shared 子应用契约

- `packages/shared/src/index.ts`：将现有业务 metadata 语义改为 `admin`，路由和 basename 改 `/app/admin`，默认 entry 改 `//127.0.0.1:7201/`。
- `packages/shared/src/index.test.ts`：验证 metadata 和路由边界。

保留 `mfeAppMeta` 导出名或同步所有调用方，避免无意义的技术注册兼容破坏；对外业务 `name/title` 使用 admin 语义。

### 3.2 主应用路由与配置

- `apps/main/src/App.tsx`：删除管理员占位 `AdminPage`，将 `app/admin/*` 指向现有 `MicroAppOutlet`；更新显示文案和错误提示。
- `apps/main/src/components/AppHeader.tsx`、测试：按钮导航改 `/app/admin`。
- `apps/main/src/micro-apps/config.ts`、测试：环境类型和 entry 读取改 `VITE_ADMIN_APP_ENTRY`，保留认证/容器 guard 和 host props。
- `apps/main/src/vite-env.d.ts`、`apps/main/.env.example`：声明和示例改用新变量。

### 3.3 Docker 与部署

- `Dockerfile`：将 build arg/env 从 `VITE_MFE_APP_ENTRY` 改为 `VITE_ADMIN_APP_ENTRY`。
- `docker-compose.yml`：同步 build args。
- `.github/workflows/deploy.yml`：服务器构建脚本、生成 `.env` 和环境声明同步新变量；继续使用既有服务器构建/CCR 逻辑。
- `.env.deploy.example`：同步主应用测试示例，不写入真实 Secret。

### 3.4 测试和文档

- `e2e/host-load-subapp.spec.ts`：更新管理员路由、basename 和文案。
- `README.md`：本地/部署变量、访问路径和 `/subapps/` 方案说明。
- `plan/11.md`、本阶段执行记录：同步阶段状态和真实验证结果。

## 4. 实施步骤

1. 修改 shared metadata 和主应用配置读取；
2. 替换 `/admin` 占位路由并更新 header/outlet 文案；
3. 同步 Docker、Compose、workflow 和环境示例；
4. 更新定向测试、E2E 路径及 README；
5. 运行定向测试、lint、format、build；
6. 创建执行记录并同步总方案、计划状态。

## 5. 验收标准

| 编号 | 验收标准 | 验证方式 |
| --- | --- | --- |
| AC-1-01 | 管理员按钮和受保护路由使用 `/app/admin` | Header/App 单测和 E2E |
| AC-1-02 | qiankun activeRule/basename 为 `/app/admin`，entry 从 `VITE_ADMIN_APP_ENTRY` 读取 | shared/config 单测 |
| AC-1-03 | Docker、Compose、远程服务器构建传递 `VITE_ADMIN_APP_ENTRY` | 静态检查和 build |
| AC-1-04 | 主应用不再把管理员入口描述为通用 `/apps/mfe-app` | grep、README 和 E2E 检查 |
| AC-1-05 | 认证和 host props 逻辑保持不变 | 现有主应用测试 |
| AC-1-06 | `/app/**` 与 `/subapps/**` 路由职责在文档中明确，Nginx 真实配置留后续阶段 | 文档检查 |

## 6. 风险、回滚和环境限制

- 第一阶段改动主应用的编译 entry；旧镜像仍可通过不可变 tag 回滚。
- 若管理员子应用尚未按 `/subapps/admin/` 配置 Vite base，真实同域资源加载可能失败；这不在第一阶段宣称已解决，交由第二阶段。
- 未执行真实 Nginx/CCR/双应用联调时，执行记录必须标记为待环境验证。

## 7. 交付物

- 主应用代码、测试、Docker/Compose、workflow 和环境示例；
- `SUBAPP_ROUTING_IMPLEMENTATION_PLAN.md` 总方案；
- 本阶段执行记录 `SUBAPP_ROUTING_IMPLEMENTATION_PHASE_1_EXECUTION.md`；
- `plan/11.md`、原第一阶段文档不改写历史事实。
