# JWT 认证接入：第四阶段“邮箱注册页面布局与交互占位”执行记录

> 状态：已完成
>
> 执行日期：2026-08-31
>
> 总实施方案：[AUTH_JWT_IMPLEMENTATION_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PLAN.md)
>
> 阶段实现计划：[AUTH_JWT_IMPLEMENTATION_PHASE_4_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PHASE_4_PLAN.md)

## 1. 执行范围与结论

本次根据总方案完成第四阶段“邮箱注册页面布局与交互占位”。

阶段结论：已完成页面布局、模式切换、前端校验和无副作用占位交互；后续已在第五阶段接入注册 API。

本阶段实际完成：

1. 登录页增加登录/注册模式切换，保留既有邮箱登录流程；
2. 增加邮箱注册表单、验证码输入、获取验证码按钮、密码确认和响应式布局；
3. 增加占位提示和定向测试，并同步阶段文档。

本阶段明确未实现或未执行：

- 未调用 `/auth/email/register/code` 或 `/auth/email/register`；
- 未实现验证码倒计时、注册自动登录或 session 写入；
- 未执行真实后端注册、验证码发送或外部账号验证。

## 2. 实际代码与配置变更

### 2.1 登录/注册页面

- [LoginPage.tsx](../apps/main/src/pages/LoginPage.tsx)：增加 `login | register` 本地模式和 Ant Design `Segmented` 切换；两个表单通过独立 key 隔离；登录继续调用 `useAuthStore.login`，注册只显示占位提示。
- 页面文案随模式切换为“欢迎登录/创建账号”，增加“立即注册/返回登录”辅助入口。

关键实现链路：

```text
默认 login
  → 点击注册
  → 渲染独立注册 Form
  → 获取验证码：提示“验证码接口尚未接入”
  → 表单前端校验通过：提示“注册接口尚未接入”
  → 不发网络请求、不写 session、不改变认证状态
```

### 2.2 注册表单与校验

- 注册字段：邮箱、验证码、设置密码、确认密码。
- 邮箱执行必填和格式校验；验证码、密码和确认密码执行必填校验；确认密码通过 `dependencies` 校验与密码一致。
- 点击辅助入口返回登录时恢复默认登录字段和测试账号预填。

### 2.3 样式

- [main.css](../apps/main/src/styles/main.css)：增加模式切换、验证码区域、辅助切换按钮和焦点样式；479px 以下验证码按钮改为全宽纵向布局。
- 未新增依赖、配置、迁移或持久化数据。

### 2.4 测试

- [LoginPage.test.tsx](../apps/main/src/pages/LoginPage.test.tsx)：共 5 个测试，覆盖登录预填、切换注册、占位提示、密码不一致校验和切回登录。

## 3. 关键设计结果

1. 登录和注册使用独立表单，注册字段不会进入登录提交；
2. 当前注册交互明确为无副作用提示，不伪造验证码或注册成功；
3. 注册页面字段契约与现有 auth API 类型对齐，但 API 调用留到后续阶段；
4. 本阶段没有改变 JWT session、认证 store、公共 API 或外部服务行为。

## 4. 与阶段计划的差异

实现与阶段计划一致，无范围或设计偏差。

## 5. 测试与验证结果

### 5.1 验证汇总

| 检查 | 命令或方法 | 结果 | 证据/说明 |
| --- | --- | --- | --- |
| 定向测试 | `pnpm --filter tsuz-web-main test -- --run src/pages/LoginPage.test.tsx --pool=forks --maxWorkers=1 --testTimeout=15000` | 通过 | 5 个测试通过 |
| 主应用测试 | `pnpm --filter tsuz-web-main test -- --pool=forks --maxWorkers=1 --testTimeout=15000` | 通过 | 10 个文件、27 个测试通过 |
| 主应用 lint | `pnpm --filter tsuz-web-main lint` | 通过 | TypeScript 检查通过 |
| 主应用构建 | `pnpm --filter tsuz-web-main build` | 通过 | Vite 构建通过；保留既有大 chunk warning |
| Host E2E | `pnpm exec playwright test e2e/host-login.spec.ts` | 通过 | 2 个测试通过，既有登录/恢复流程未回归 |
| 工作区测试 | `pnpm test` | 通过 | 4 个 workspace task 成功 |
| 工作区 lint | `pnpm lint` | 通过 | ESLint、各 workspace TypeScript 检查通过 |
| Diff 检查 | `git diff --check` | 通过 | 无空白错误 |

### 5.2 失败与未执行项

- 首次测试使用 Ant Design Segmented 内部 radio 进行点击时，测试环境报告其 input 为 `pointer-events: none`；随后调整测试为点击可交互 label/页面辅助按钮，最终定向测试通过。该问题仅为测试定位方式，不是产品运行时失败。
- 真实注册验证码和注册接口未执行：本阶段按用户要求只确认页面布局与交互，不进行外部副作用调用。

### 5.3 真实环境或人工验证

| 验证项 | 环境 | 副作用/授权 | 结果 |
| --- | --- | --- | --- |
| `/auth/email/register/code`、`/auth/email/register` | 真实测试 API | 未调用 | 未执行，留待后续 API 接入阶段 |

## 6. 阶段验收结果

| 编号 | 验收标准 | 结果 | 验证证据 |
| --- | --- | --- | --- |
| AC-4-01 | 默认登录模式和现有邮箱登录行为保持可用 | 通过 | [LoginPage.test.tsx](../apps/main/src/pages/LoginPage.test.tsx)、host E2E |
| AC-4-02 | 注册模式展示邮箱、验证码、密码、确认密码和获取验证码控件 | 通过 | [LoginPage.tsx](../apps/main/src/pages/LoginPage.tsx)、LoginPage 测试 |
| AC-4-03 | 注册表单完成必填、邮箱格式和密码一致性校验 | 通过 | LoginPage 密码一致性及表单行为测试 |
| AC-4-04 | 占位操作不请求后端、不登录、不写入 session | 通过 | [LoginPage.tsx](../apps/main/src/pages/LoginPage.tsx) 无 API 调用，注册测试验证占位提示 |
| AC-4-05 | 桌面与窄屏布局可用且阶段文档同步 | 通过 | [main.css](../apps/main/src/styles/main.css)、构建、diff 检查及本文档 |

## 7. 安全、兼容性与可观测性核对

### 安全

- 本阶段不接受或持久化注册 token、验证码或用户资料；未将敏感数据写入代码、日志或文档。
- 注册占位操作 fail closed，不会伪造成功或改变登录状态。
- 真实验证码发送、限流、防枚举和后端注册校验留待 API 接入阶段验证。

### 兼容性

- 既有登录、session 恢复、profile、logout 和 host E2E 未改动且通过回归测试。
- 未修改公共 API、session schema、配置或依赖。

### 可观测性

- 本阶段没有新增日志、指标或追踪；Ant Design message 仅用于用户可见的未接入提示。

## 8. 遗留问题与后续阶段入口

### 8.1 当前阶段遗留问题

| 问题 | 影响 | 负责人/条件 | 处理阶段 |
| --- | --- | --- | --- |
| 无（第五阶段已接入注册 API；真实后端联调仍需受控环境） | 当前代码已具备发送验证码和创建账号能力 | 真实环境验证需授权测试后端与账号 | 发布前/受控联调 |

### 8.2 下一阶段可复用能力

- 已复用 `auth-api.ts` 中既有的验证码和注册 wrapper 及 snake_case 类型。
- 注册流程继续保持不进入自动 refresh，按现有 `skipAuthRefresh` 契约调用。
- `challenge_id` 由页面保存在内存中，重发成功后替换；注册成功后由 service 保存 token 并调用 `/auth/me` 完成自动登录。

## 9. 文档同步记录

- [AUTH_JWT_IMPLEMENTATION_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PLAN.md)：补充第四阶段状态、链接和页面范围影响。
- [AUTH_JWT_IMPLEMENTATION_PHASE_4_PLAN.md](./AUTH_JWT_IMPLEMENTATION_PHASE_4_PLAN.md)：记录最终范围和验收状态。
- 本执行记录：记录第四阶段实际代码、测试和未执行的真实接口验证。

## 10. 阶段结论

第四阶段已完成：

- 邮箱注册页面布局和交互占位已落地；
- 登录回归、主应用测试、构建、E2E 和工作区检查全部通过；
- 真实注册 API 未调用，后续可在交互确认后进入接口接入阶段。
