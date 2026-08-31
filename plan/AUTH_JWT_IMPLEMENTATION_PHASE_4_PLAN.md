# JWT 认证接入：第四阶段“邮箱注册页面布局与交互占位”实现计划

> 状态：已完成
>
> 总实施方案：[AUTH_JWT_IMPLEMENTATION_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PLAN.md)
>
> 阶段执行记录：[AUTH_JWT_IMPLEMENTATION_PHASE_4_EXECUTION.md](./AUTH_JWT_IMPLEMENTATION_PHASE_4_EXECUTION.md)
>
> 范围：在现有邮箱登录页增加登录/注册模式切换和邮箱注册表单布局；本阶段不调用注册验证码或注册接口。

## 1. 背景与阶段基准

### 1.1 前置阶段状态

- 第一至第三阶段已经落地共享 API refresh、主应用 JWT session、邮箱登录和 host 回归，详见[总方案](./AUTH_JWT_IMPLEMENTATION_PLAN.md)及前三阶段执行记录。
- [auth-api.ts](../apps/main/src/services/auth-api.ts) 已提供 `/auth/email/register/code` 和 `/auth/email/register` wrapper，本阶段仅以其字段契约设计页面，不实际调用。
- [LoginPage.tsx](../apps/main/src/pages/LoginPage.tsx) 原有登录认证、错误展示、loading、重定向和测试账号预填行为继续复用。

### 1.2 当前仓库事实

- 登录页面采用 React、Ant Design Form 和现有双栏品牌布局；登录状态由 `useAuthStore.login` 管理。
- 注册 API 类型已存在：验证码请求使用 `email`，注册请求使用 `email`、`challenge_id`、`code`、`password`。
- 当前工作区已有认证相关改动；本阶段只修改登录页、其测试和样式，不覆盖其他工作区变更。

### 1.3 本阶段目标

1. 提供登录/注册两种可访问的页面模式，并默认保持登录模式；
2. 提供邮箱、验证码、密码、确认密码和获取验证码的注册布局；
3. 完成前端字段校验和无副作用占位提示，为后续接口接入固定交互契约。

## 2. 范围与约束

### 2.1 本阶段实现

- 登录页的登录/注册模式切换；
- 注册字段布局、邮箱格式校验、必填校验和确认密码一致性校验；
- 获取验证码与注册提交的“接口尚未接入”提示；
- 登录页定向测试、响应式样式和阶段文档。

### 2.2 本阶段明确不实现

- 不发送 `/auth/email/register/code` 或 `/auth/email/register` 请求；
- 不实现验证码倒计时、注册成功后的自动登录或 token/session 写入；
- 不实现忘记密码、密码重置或其他认证页面；
- 不改变现有 auth API、认证 store 和 JWT 生命周期。

### 2.3 已确认约束

- 默认显示登录模式，登录测试账号预填行为保持不变；注册模式不预填测试账号密码；
- 点击获取验证码仅提示“验证码接口尚未接入”，不启动倒计时；注册表单通过前端校验后仅提示“注册接口尚未接入”；
- 注册提交不得调用登录 store、改变 URL 或改变认证状态；
- 沿用 React、Ant Design 和现有 CSS，不新增依赖。

### 2.4 数据、迁移与外部服务

本阶段不涉及数据结构、持久状态、数据库、缓存、生产部署或真实外部服务调用。测试只使用非生产占位值。

## 3. 详细设计与修改文件

### 3.1 登录/注册页面模式

- [LoginPage.tsx](../apps/main/src/pages/LoginPage.tsx)：使用本地 `login | register` 状态和 Ant Design `Segmented` 控件；按模式隔离两个 Form，保留登录原有提交链路。
- 注册提交使用本地表单回调，只显示提示，不调用 `useAuthStore.login` 或 auth service。

### 3.2 注册表单

- 注册字段为邮箱、验证码、设置密码、确认密码；验证码按钮与输入框组成响应式布局。
- 复用 Ant Design Form 校验：邮箱格式、字段必填以及 `dependencies` 驱动的密码一致性校验。
- 切换回登录时重新显示预填登录表单，避免注册字段混入登录提交。

### 3.3 样式与可访问性

- [main.css](../apps/main/src/styles/main.css)：增加模式切换、验证码横排/窄屏换行和底部模式提示样式，复用现有颜色及断点。
- 使用原生 button 作为辅助切换入口，并保留键盘焦点可见样式；Ant Design 控件保留可访问标签。

### 3.4 测试

- [LoginPage.test.tsx](../apps/main/src/pages/LoginPage.test.tsx)：覆盖模式切换、注册字段、占位提示、密码不一致校验和切回登录；保留登录预填测试。

## 4. 实施步骤

1. 核对前三阶段文档、现有 LoginPage 和注册 API 类型；
2. 增加页面模式、注册表单和无副作用占位交互；
3. 增加响应式样式与可访问性测试；
4. 执行定向测试、lint、构建、E2E、工作区测试和 diff 检查；
5. 根据真实结果更新总方案、阶段计划和执行记录。

## 5. 测试与验证计划

```bash
pnpm --filter tsuz-web-main lint
pnpm --filter tsuz-web-main test -- --pool=forks --maxWorkers=1 --testTimeout=15000
pnpm --filter tsuz-web-main build
pnpm exec playwright test e2e/host-login.spec.ts
pnpm test
pnpm lint
git diff --check
```

真实验证码发送、真实注册和外部测试账号验证不进入本阶段自动化测试。

## 6. 验收标准与追踪

| 编号 | 验收标准 | 实现位置 | 验证方式 | 状态 |
| --- | --- | --- | --- | --- |
| AC-4-01 | 默认登录模式和现有邮箱登录行为保持可用 | `apps/main/src/pages/LoginPage.tsx` | LoginPage 单测、host E2E | 已满足 |
| AC-4-02 | 注册模式展示邮箱、验证码、密码、确认密码和获取验证码控件 | `apps/main/src/pages/LoginPage.tsx` | LoginPage 单测、人工检查 | 已满足 |
| AC-4-03 | 注册表单完成必填、邮箱格式和密码一致性校验 | `apps/main/src/pages/LoginPage.tsx` | LoginPage 单测 | 已满足 |
| AC-4-04 | 占位操作不请求后端、不登录、不写入 session | `apps/main/src/pages/LoginPage.tsx` | LoginPage 单测、代码检查 | 已满足 |
| AC-4-05 | 桌面与窄屏布局可用且阶段文档同步 | `apps/main/src/styles/main.css`、plan 文档 | 构建、diff 检查、文档核对 | 已满足 |

## 7. 风险、回滚与异常处理

- 注册接口尚未接入：通过明确提示避免用户误以为注册成功；后续接入时替换本地回调即可。
- 表单字段变更：使用独立注册表单和 `key` 隔离，避免影响已有登录字段和认证状态。
- 窄屏空间不足：验证码区域在 479px 以下改为纵向布局，避免按钮溢出。
- 回滚方式：撤销本阶段 LoginPage、测试、样式和阶段文档变更，不涉及数据迁移或外部资源。

## 8. 阶段交付物

- 登录页注册模式布局、前端校验和占位交互；
- LoginPage 单元测试和响应式 CSS；
- [阶段执行记录](./AUTH_JWT_IMPLEMENTATION_PHASE_4_EXECUTION.md)及[总方案](./AUTH_JWT_IMPLEMENTATION_PLAN.md)同步。

## 9. 计划调整记录

无。实现与已确认的“提示待接入”交互一致。
