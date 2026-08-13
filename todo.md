# JobSearchCoachingPage — 后台管理控制台 实现计划

> 基于 [schema.sql](../JobSearchCoachingPage_BackendSide_v1/scripts/schema.sql) + GORM AutoMigrate 的 12 张业务表，构建 React + Ant Design 管理控制台，集成 JWT RBAC 权限与全量操作审计。

---

## 一、总体架构

```
┌─────────────────────────────────────────────────────────┐
│  Console (React 18 + Vite + Ant Design 5 + React Router) │
│  端口: 5173 (dev)                                        │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP (axios + JWT Bearer Token)
┌──────────────────────▼──────────────────────────────────┐
│  Backend API (Gin + GORM — 现有项目扩展)                  │
│  端口: 8080                                              │
│                                                          │
│  新增:                                                    │
│  ├─ Auth 模块 (login / refresh / me)                     │
│  ├─ JWT 中间件 (token 验证 + 角色鉴权)                     │
│  ├─ Audit 中间件 (操作自动记录)                             │
│  ├─ Admin 路由组 (用户管理 / 审计日志查看)                   │
│  └─ 写操作路由 (POST / PUT / DELETE — 现有 12 张表)        │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  MySQL (maridiancareer)                                  │
│                                                          │
│  现有 12 表 + 新增 2 表:                                   │
│  ├─ users          (用户与角色)                            │
│  └─ audit_logs     (操作审计)                              │
└─────────────────────────────────────────────────────────┘
```

---

## 二、数据模型设计

### 2.1 现有 12 张业务表（只读 → 读写）

| # | 表名 | 说明 | 关键字段 |
|---|------|------|---------|
| 1 | `mentors` | 导师 | JSON字段: languages, key_skills, reviews, teaching_clips 等 |
| 2 | `mentor_educations` | 导师学历 | mentor_id(FK), school_name, degree, major |
| 3 | `tags` | 统一标签 | name, category (industry/company/department/school) |
| 4 | `mentor_tags` | 导师↔标签 | mentor_id + tag_id 复合主键 |
| 5 | `student_cases` | 学员案例 | title, category, content(LONGTEXT), challenge/strategy/outcome |
| 6 | `industry_insights` | 行业洞察 | title, slug(UNIQUE), content(LONGTEXT) |
| 7 | `service_categories` | 服务分类 | id VARCHAR(50) 主键, sub_services(JSON) |
| 8 | `service_stages` | 服务阶段 | title, details(JSON) |
| 9 | `site_stats` | 站点统计 | label, value, suffix |
| 10 | `company_logos` | 合作企业Logo | name, logo_url |
| 11 | `why_us_features` | WhyUs亮点 | title, description, icon |
| 12 | `contact_submissions` | 联系表单 | name, email, message, processed |

### 2.2 新增: users 表

```sql
CREATE TABLE users (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(100)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    display_name  VARCHAR(200)  NOT NULL DEFAULT '',
    role          ENUM('admin','operator','normal') NOT NULL DEFAULT 'normal',
    status        TINYINT(1)    NOT NULL DEFAULT 1,          -- 1=active 0=disabled
    refresh_token VARCHAR(255)  DEFAULT NULL,                 -- JWT refresh token
    last_login_at DATETIME(3)   DEFAULT NULL,
    created_at    DATETIME(3)   DEFAULT CURRENT_TIMESTAMP(3),
    updated_at    DATETIME(3)   DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.3 新增: audit_logs 表

```sql
CREATE TABLE audit_logs (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED DEFAULT NULL,
    username    VARCHAR(100)  DEFAULT '',
    action      VARCHAR(50)   NOT NULL,     -- CREATE / UPDATE / DELETE / LOGIN / LOGOUT
    resource    VARCHAR(100)  NOT NULL,     -- mentors / users / student_cases ...
    resource_id VARCHAR(200)  DEFAULT '',   -- 被操作资源 ID（可为复合键, 如 "1,2"）
    detail      JSON          DEFAULT NULL, -- old/new values diff
    ip_address  VARCHAR(45)   DEFAULT '',
    created_at  DATETIME(3)   DEFAULT CURRENT_TIMESTAMP(3),

    INDEX idx_audit_user     (user_id),
    INDEX idx_audit_resource (resource),
    INDEX idx_audit_action   (action),
    INDEX idx_audit_created  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 三、RBAC 权限模型

### 3.1 角色与权限矩阵

| 操作 | admin | operator | normal |
|------|:-----:|:--------:|:------:|
| 查看业务数据 | ✅ | ✅ | ✅ |
| 创建/编辑/删除业务数据 | ✅ | ✅ | ❌ |
| 查看用户列表 | ✅ | ❌ | ❌ |
| 创建/编辑/删除用户 | ✅ | ❌ | ❌ |
| 查看审计日志 | ✅ | ✅ | ❌ |
| 标记联系表单为已处理 | ✅ | ✅ | ❌ |

### 3.2 Token 设计

- **Access Token**: JWT, 2 小时过期, payload = `{user_id, username, role}`
- **Refresh Token**: 随机 UUID, 7 天过期, 存储于 `users` 表（可扩展为独立 `refresh_tokens` 表）
- 前端在请求拦截器中自动附带 `Authorization: Bearer <token>`
- Token 过期自动用 refresh token 刷新

---

## 四、后端新增 API

### 4.1 Auth 模块

| Method | Path | 说明 |
|--------|------|------|
| POST | `/api/auth/login` | 登录, 返回 access + refresh token（公开） |
| POST | `/api/auth/refresh` | 刷新 access token（公开） |
| GET | `/api/auth/me` | 获取当前用户信息 **[需 JWT]** |

### 4.2 业务表写操作（需 JWT, admin/operator）

为每张业务表新增写端点:

| Method | Path | 权限 | 说明 |
|--------|------|------|------|
| POST | `/api/admin/mentors` | operator+ | 创建导师 |
| PUT | `/api/admin/mentors/:id` | operator+ | 更新导师 |
| DELETE | `/api/admin/mentors/:id` | operator+ | 软删除导师 |
| POST | `/api/admin/mentors/:id/educations` | operator+ | 添加学历 |
| PUT | `/api/admin/mentors/:id/educations/:eduId` | operator+ | 更新学历 |
| DELETE | `/api/admin/mentors/:id/educations/:eduId` | operator+ | 删除学历 |
| POST | `/api/admin/cases` | operator+ | 创建案例 |
| PUT | `/api/admin/cases/:id` | operator+ | 更新案例 |
| DELETE | `/api/admin/cases/:id` | operator+ | 软删除案例 |
| POST | `/api/admin/insights` | operator+ | 创建洞察 |
| PUT | `/api/admin/insights/:id` | operator+ | 更新洞察 |
| DELETE | `/api/admin/insights/:id` | operator+ | 软删除洞察 |
| POST | `/api/admin/services` | operator+ | 创建服务分类 |
| PUT | `/api/admin/services/:id` | operator+ | 更新服务分类 |
| DELETE | `/api/admin/services/:id` | operator+ | 删除服务分类 |
| POST | `/api/admin/service-stages` | operator+ | 创建服务阶段 |
| PUT | `/api/admin/service-stages/:id` | operator+ | 更新服务阶段 |
| DELETE | `/api/admin/service-stages/:id` | operator+ | 删除服务阶段 |
| POST | `/api/admin/site-stats` | operator+ | 创建统计 |
| PUT | `/api/admin/site-stats/:id` | operator+ | 更新统计 |
| DELETE | `/api/admin/site-stats/:id` | operator+ | 删除统计 |
| POST | `/api/admin/companies` | operator+ | 创建Logo |
| PUT | `/api/admin/companies/:id` | operator+ | 更新Logo |
| DELETE | `/api/admin/companies/:id` | operator+ | 删除Logo |
| POST | `/api/admin/why-us` | operator+ | 创建Feature |
| PUT | `/api/admin/why-us/:id` | operator+ | 更新Feature |
| DELETE | `/api/admin/why-us/:id` | operator+ | 删除Feature |
| POST | `/api/admin/tags` | operator+ | 创建标签 |
| PUT | `/api/admin/tags/:id` | operator+ | 更新标签 |
| DELETE | `/api/admin/tags/:id` | operator+ | 删除标签 |
| PUT | `/api/admin/contacts/:id/process` | operator+ | 标记联系表单已处理 |

### 4.3 用户与审计管理（需 JWT, admin only）

| Method | Path | 权限 | 说明 |
|--------|------|------|------|
| GET | `/api/admin/users` | admin | 用户列表 |
| POST | `/api/admin/users` | admin | 创建用户 |
| PUT | `/api/admin/users/:id` | admin | 更新用户（含角色变更） |
| DELETE | `/api/admin/users/:id` | admin | 禁用/删除用户 |
| GET | `/api/admin/audit-logs` | operator+ | 审计日志（分页、筛选） |

---

## 五、后端实现计划（子任务）

### Phase B1: 数据库 & 模型层
- [ ] B1.1 在 `scripts/schema.sql` 中追加 `users` 和 `audit_logs` 建表 DDL
- [ ] B1.2 创建 `internal/model/user.go` — User struct
- [ ] B1.3 创建 `internal/model/audit_log.go` — AuditLog struct
- [ ] B1.4 在 `internal/database/database.go` 的 AutoMigrate 中加入新模型
- [ ] B1.5 创建 `internal/repository/user_repo.go` — 用户 CRUD
- [ ] B1.6 创建 `internal/repository/audit_repo.go` — 审计日志写入 + 分页查询

### Phase B2: JWT & 中间件
- [ ] B2.1 创建 `pkg/auth/jwt.go` — JWT 生成/验证/刷新
- [ ] B2.2 创建 `pkg/auth/password.go` — bcrypt 密码哈希
- [ ] B2.3 创建 `internal/middleware/auth.go` — JWT 提取 + 验证中间件
- [ ] B2.4 创建 `internal/middleware/rbac.go` — 角色鉴权中间件工厂函数 `RequireRole(roles ...string)`
- [ ] B2.5 创建 `internal/middleware/audit.go` — 审计日志中间件（拦截写操作自动记录）

### Phase B3: Auth 服务 & Handler
- [ ] B3.1 创建 `internal/service/auth_service.go` — 登录/刷新逻辑
- [ ] B3.2 创建 `internal/handler/auth_handler.go` — login/refresh/me 端点
- [ ] B3.3 在 `main.go` 中注册 Auth 路由

### Phase B4: Admin CRUD 扩展
- [ ] B4.1 为每张业务表新增 Service 层的 Create/Update/Delete 方法（含 `mentors` 的嵌套学历管理 + `mentor_tags` 多对多关系同步）
- [ ] B4.2 为每张业务表新增 Handler 层的写端点
- [ ] B4.3 创建 `internal/handler/admin_user_handler.go` — 用户管理端点
- [ ] B4.4 创建 `internal/handler/admin_audit_handler.go` — 审计日志查看端点
- [ ] B4.5 在 `main.go` 中注册 `/api/admin/*` 路由组（挂载 JWT + 角色中间件）
- [ ] B4.6 确认现有公开 GET 端点 `/api/mentors`、`/api/cases` 等接口可用；若缺失则补充

### Phase B5: 测试 & 文档
- [ ] B5.1 更新 `docs/api-spec.md` 补充 admin 端点文档
- [ ] B5.2 用 curl/Postman 验证完整 auth → CRUD → audit 链路
- [ ] B5.3 验证 RBAC 边界（normal 不能写, operator 不能管理用户）

---

## 六、前端控制台实现计划（子任务）

> 项目路径: `/home/zwhmi/secondInternship/JobSearchCoachingPage-Console-V1`  
> 技术栈: React 18 + Vite + TypeScript + Ant Design 5 + React Router 6 + axios

### Phase F1: 项目初始化
- [ ] F1.1 `npm create vite@latest . -- --template react-ts` 初始化项目
- [ ] F1.2 安装依赖: `antd @ant-design/icons react-router-dom axios @ant-design/pro-components dayjs`
- [ ] F1.3 配置 Vite 代理 (开发代理到 `localhost:8080`)
- [ ] F1.4 创建目录结构 (见下方)

### 目录结构
```
src/
├── api/                  # axios 封装 + 各模块 API 函数
│   ├── client.ts         # axios 实例 (baseURL, interceptor, JWT)
│   ├── auth.ts           # login / refresh / me
│   ├── mentors.ts
│   ├── cases.ts
│   ├── insights.ts
│   ├── services.ts
│   ├── siteStats.ts
│   ├── companies.ts
│   ├── whyUs.ts
│   ├── tags.ts
│   ├── contacts.ts
│   ├── users.ts          # 用户管理 (admin only)
│   └── auditLogs.ts      # 审计日志
├── components/           # 公共组件
│   ├── ProtectedRoute.tsx # 路由守卫 (登录 + 角色)
│   ├── JsonEditor.tsx    # JSON 字段编辑器
│   └── AuditLog.tsx      # 审计日志查看组件
├── contexts/
│   └── AuthContext.tsx    # 认证上下文 (user, login, logout)
├── hooks/
│   └── useAuth.ts
├── layouts/
│   └── AdminLayout.tsx   # 主布局 (Sidebar + Header + Content)
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx     # 概览仪表盘
│   ├── mentors/
│   │   ├── MentorList.tsx
│   │   └── MentorForm.tsx  # 创建/编辑 (含学历、标签、JSON字段)
│   ├── cases/
│   │   ├── CaseList.tsx
│   │   └── CaseForm.tsx
│   ├── insights/
│   │   ├── InsightList.tsx
│   │   └── InsightForm.tsx
│   ├── services/
│   │   ├── ServiceList.tsx
│   │   ├── ServiceForm.tsx
│   │   ├── StageList.tsx
│   │   └── StageForm.tsx
│   ├── siteStats/
│   │   └── SiteStatList.tsx
│   ├── companies/
│   │   └── CompanyList.tsx
│   ├── whyUs/
│   │   └── WhyUsList.tsx
│   ├── tags/
│   │   └── TagList.tsx
│   ├── contacts/
│   │   └── ContactList.tsx
│   ├── users/             # admin only
│   │   ├── UserList.tsx
│   │   └── UserForm.tsx
│   └── audit/
│       └── AuditLogList.tsx
├── utils/
│   └── storage.ts         # localStorage token 管理
├── App.tsx
└── main.tsx
```

### Phase F2: 基础设施
- [ ] F2.1 实现 `api/client.ts` — axios 实例, 请求拦截器挂 JWT, 响应拦截器处理 401 自动刷新
- [ ] F2.2 实现 `utils/storage.ts` — access/refresh token 存取
- [ ] F2.3 实现 `contexts/AuthContext.tsx` — 登录状态管理, 用户信息, 角色
- [ ] F2.4 实现 `components/ProtectedRoute.tsx` — 路由守卫 (未登录跳转 /login, 权限不足显示 403)

### Phase F3: 登录 & 布局
- [ ] F3.1 实现 `pages/Login.tsx` — 登录表单 (username + password, Ant Design Form)
- [ ] F3.2 实现 `layouts/AdminLayout.tsx` — Sider 菜单 (根据角色动态显示/隐藏), Header 显示用户信息 + 退出
- [ ] F3.3 实现 `App.tsx` 路由配置 — React Router 路由表

### Phase F4: 业务 CRUD 页面（12 张表 × 列表 + 表单）

每张表的实现模式:
- **List 页**: Ant Design Table + 搜索栏 + 分页 + 新增/编辑/删除按钮（根据角色显示/隐藏操作按钮）
- **Form 页**: Ant Design Modal 或独立页面，Form 表单绑定所有字段

| 子任务 | 表 / 页面 |
|--------|----------|
| F4.1 | mentors — 列表 + 表单 (复杂: JSON字段编辑器, 学历子表, 标签多选) |
| F4.2 | student_cases — 列表 + 表单 (长文本编辑器 content/challenge/strategy/outcome) |
| F4.3 | industry_insights — 列表 + 表单 (slug 唯一校验) |
| F4.4 | service_categories — 列表 + 表单 (sub_services JSON) |
| F4.5 | service_stages — 列表 + 表单 (details JSON) |
| F4.6 | site_stats — 列表 (inline 编辑) |
| F4.7 | company_logos — 列表 + 表单 |
| F4.8 | why_us_features — 列表 + 表单 |
| F4.9 | tags — 列表 + 表单 (category 下拉: industry/company/department/school) |
| F4.10 | contact_submissions — 列表 (只读 + "标记已处理" 按钮) |

### Phase F5: 用户管理（admin only）
- [ ] F5.1 `pages/users/UserList.tsx` — Table + 创建/编辑/禁用操作
- [ ] F5.2 `pages/users/UserForm.tsx` — 表单 (role 下拉选择, 重置密码功能)
- [ ] F5.3 角色选择器: admin / operator / normal

### Phase F6: 审计日志查看
- [ ] F6.1 `pages/audit/AuditLogList.tsx` — Table + 筛选 (按用户/操作类型/资源/时间范围) + 分页
- [ ] F6.2 点击查看 JSON diff 详情（Modal 展示 detail 字段）

### Phase F7: 仪表盘
- [ ] F7.1 `pages/Dashboard.tsx` — 统计卡片 (mentor数, case数, insight数, 用户数)
- [ ] F7.2 最近操作审计日志列表

### Phase F8: 特殊字段处理
- [ ] F8.1 `components/JsonEditor.tsx` — 通用 JSON 数组编辑器（用于 reviews, languages, key_skills, teaching_clips, tags, sub_services, details 等字段）
- [ ] F8.2 图片上传组件（avatar, image, background_image, logo_url 字段）
- [ ] F8.3 富文本编辑器（content, challenge, strategy, outcome — 可用 @ant-design/pro-components 的 ProFormTextArea 或集成 Quill/TinyMCE）

---

## 七、路由设计

### 7.1 后端路由规划

```
/api
├── /auth
│   ├── POST   /login
│   ├── POST   /refresh
│   └── GET    /me                [JWT]
├── /mentors                       (公开读)
├── /cases                         (公开读)
├── /insights                      (公开读)
├── ... (其他公开读端点)
├── /admin                         [JWT]
│   ├── /mentors                  [JWT + operator]
│   │   ├── POST   /
│   │   ├── PUT    /:id
│   │   └── DELETE /:id
│   │   ├── /:id/educations       [JWT + operator]
│   ├── /service-stages             [JWT + operator]
│   │   ├── POST   /
│   │   ├── PUT    /:id
│   │   └── DELETE /:id
│   ├── /cases                    [JWT + operator]
│   │   ├── POST   /
│   │   ├── PUT    /:id
│   │   └── DELETE /:id
│   ├── ... (其他 admin 写端点)
│   ├── /users                    [JWT + admin]
│   │   ├── GET    /
│   │   ├── POST   /
│   │   ├── PUT    /:id
│   │   └── DELETE /:id
│   └── /audit-logs               [JWT + operator]
│       └── GET    /
```

### 7.2 前端路由规划

```
/login                           # 登录页 (无需登录)
/                                # Dashboard (需登录)
/mentors                         # 导师列表 (需登录)
/mentors/new                     # 新增 (operator+)
/mentors/:id/edit                # 编辑 (operator+)
/cases                           # 案例列表
/cases/new                       # 新增 (operator+)
/cases/:id/edit                  # 编辑 (operator+)
/insights                         # 洞察列表
/insights/new                     # 新增 (operator+)
/insights/:id/edit                # 编辑 (operator+)
/services                         # 服务分类 + 阶段
/services/stages/new               # 新增阶段 (operator+)
/services/stages/:id/edit          # 编辑阶段 (operator+)
/site-stats                       # 站点统计
/companies                        # 企业Logo (Modal 弹窗编辑)
/companies/new                    # 新增 (operator+)
/companies/:id/edit               # 编辑 (operator+)
/why-us                           # WhyUs (Modal 弹窗编辑)
/why-us/new                       # 新增 (operator+)
/why-us/:id/edit                  # 编辑 (operator+)
/tags                             # 标签 (Modal 弹窗编辑)
/tags/new                         # 新增 (operator+)
/tags/:id/edit                    # 编辑 (operator+)
/contacts                         # 联系表单
/users                            # 用户管理 (admin only)
/audit-logs                       # 审计日志 (operator+)
```

---

## 八、关键实现细节

### 8.1 axios 拦截器

```
请求拦截: 从 localStorage 取 access_token → Authorization header
响应拦截: 
  - 401 + refresh_token 存在 → 自动调用 /api/auth/refresh → 重试原请求
  - 401 + refresh_token 过期 → 清除 token → 跳转 /login
```

### 8.2 权限控制三层

| 层 | 机制 | 说明 |
|----|------|------|
| 路由层 | ProtectedRoute 组件 | 未登录跳转, 角色不足显示 403 |
| UI 层 | `role === 'admin'` 条件渲染 | 隐藏操作按钮、菜单项 |
| API 层 | 后端 JWT + 角色中间件 | 最终防线, 拒绝越权请求 |

### 8.3 审计日志自动采集

在 Gin 中间件层包装 `c.Writer`, 拦截所有写请求 (POST/PUT/DELETE) 的响应:
- 从 `c.Get("user")` 获取当前用户信息
- 从 `c.Request.URL.Path` 提取 resource 名称
- 记录 action + resource + resource_id + ip_address
- 异步写入 audit_logs (不阻塞请求响应)

**注意**: 登录 (`LOGIN`) 和登出 (`LOGOUT`) 操作不经过 CRUD 中间件，需在 Auth handler 内**手动调用**审计写入逻辑。

### 8.4 密码安全

- bcrypt cost = 12
- 创建用户时默认生成随机密码, 强制首次登录修改 (MVP 阶段可简化为管理员预设密码)
- 密码最小长度 8 位

---

## 九、实施顺序（建议）

```
Phase 1 (后端基础) → B1 → B2 → B3
Phase 2 (后端扩展) → B4 → B5
Phase 3 (前端基础) → F1 → F2 → F3
Phase 4 (前端业务) → F4 (按表顺序逐个实现)
Phase 5 (前端权限) → F5 → F6 → F7
Phase 6 (联调打磨) → F8 + 全链路测试
```

**预计总工时**: 后端约 2-3 天, 前端约 4-5 天, 联调 1 天。

---

## 十、初始化种子数据

系统部署后需执行:
1. 创建默认 admin 用户: `admin / Admin@123` (首次登录强制修改)
2. 创建默认 operator 用户: `operator / Operator@123`
3. 创建默认 normal 用户: `viewer / Viewer@123`
4. 在 `schema.sql` 末尾追加 INSERT 语句

---

## 十一、导师图片上传功能（新增）

> 目标：让 Mentor 表单里的「头像」以及 Company 表单里的「Logo」真正能通过**本地上传图片**实现，前后端打通。

### 11.1 现状（已排查）

| 层 | 现状 |
|----|------|
| 前端组件 | [ImageUploadField.tsx](../JobSearchCoachingPage-Console-V1/src/components/ImageUploadField.tsx) 已实现，`POST /api/admin/upload`，字段名 `file`，带 Bearer Token，期望响应 `data.url` |
| 前端使用处 | `MentorForm`（头像）、`CompanyList`（Logo）均已接入该组件 |
| 后端 | **完全没有** `/api/admin/upload` 路由，也没有任何静态文件服务（`grep upload/static/multipart` 无结果） |
| 数据库 | `mentors.avatar` / `company_logos.logo_url` 字段已存在（`varchar(500)`），**无需迁移** |
| Vite 代理 | 只代理了 `/api`，未代理图片访问路径 `/uploads` |

**结论**：前端 UI 已就绪，缺的是后端上传接口 + 静态文件托管 + 前端图片访问代理。这是一个「补齐后端 + 打通访问链路」的任务，前端 `ImageUploadField` 主体不用重写。

### 11.2 图片路径存在哪里（核心决策）

**文件实体** → 存放于**后端项目**（`JobSearchCoachingPage_BackendSide_v1`）的磁盘目录，**不是**前端 `src/` 目录。路径由环境变量 `UPLOAD_DIR` 配置，**代码不写死路径**：

| 场景 | `UPLOAD_DIR` 取值 | 说明 |
|------|------------------|------|
| 本地开发 | `./uploads`（默认，后端项目根目录下） | 零权限零配置，`go run` 直接跑 |
| 生产部署 | `/srv/maridiancareer/uploads` | 符合 FHS 规范（`/srv` = 本系统对外提供的服务数据），由部署脚本建目录+赋权 |

> ⚠️ 为什么不放前端 `src/`：`src/` 是前端源代码目录，会被 Vite 编译打包；上传的图片是**运行时产生的用户数据**，不属于源代码。图片由后端接收落盘，应放在后端可写目录，再由后端静态路由对外提供访问。可按资源分子目录（`uploads/mentors/`、`uploads/logos/`）便于分类管理。
>
> ⚠️ 生产切换到 `/srv` 时需 root 建目录并赋权：`sudo mkdir -p /srv/maridiancareer/uploads && sudo chown -R <运行用户> /srv/maridiancareer`。

**数据库字段**（`mentors.avatar`、`company_logos.logo_url`）→ 存**相对 URL 路径**，形如：

```
/uploads/2026/08/13/9f2c1a7e3b...jpg
```

而非绝对路径或 base64。理由：

1. **部署域名/端口可变**：绝对 URL（`http://x.x.x.x:8080/uploads/...`）换环境即失效；相对路径天然可迁移。
2. **前后端同源访问**：开发时走 Vite 代理，生产时由 Nginx 统一反代 `/uploads` 与 `/api`，相对路径两端都通。
3. **数据库不膨胀**：存 base64 会让 `avatar` 字段从几十字节暴涨到几十 KB，且破坏缓存；存文件路径只占几十字节。
4. **可替换 / 可迁移**：换 CDN 或对象存储时，只需把 URL 前缀换成 CDN 域名，`avatar` 字段里的相对路径不用改。

### 11.3 后端修改

#### (1) 配置项 —— [config.go](../JobSearchCoachingPage_BackendSide_v1/config/config.go)

`Config` 结构体新增：

```go
UploadDir       string // 上传文件存储目录，默认 ./uploads
MaxUploadSizeMB int64  // 单文件大小上限(MB)，默认 3
```

`Load()` 中读取：

```go
UploadDir:       getEnv("UPLOAD_DIR", "./uploads"),
MaxUploadSizeMB: int64(getEnvInt("MAX_UPLOAD_SIZE_MB", 3)),
```

#### (2) 环境变量 —— [.env](../JobSearchCoachingPage_BackendSide_v1/.env) 与 `.env.example`

```env
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=3
```

#### (3) 新增上传 Handler —— `internal/handler/upload_handler.go`

```go
type UploadHandler struct {
    uploadDir string
    maxSize   int64 // bytes
}
func NewUploadHandler(uploadDir string, maxSizeMB int64) *UploadHandler

// Upload handles POST /api/admin/upload (multipart, field "file")
func (h *UploadHandler) Upload(c *gin.Context) {
    // 1. c.FormFile("file") 取文件，失败 → 400
    // 2. 大小校验：file.Size > maxSize → 413（用 utils.ErrorResponse）
    // 3. 打开文件，用 http.DetectContentType 读取真实内容判断类型（白名单：image/jpeg、image/png、image/webp、image/gif）
    // 4. 生成文件名：time.Now().Format("2006/01/02") 子目录 + crypto/rand 随机名 + 原扩展名
    // 5. os.MkdirAll(uploadDir/YYYY/MM/DD) 后 c.SaveUploadedFile 落盘
    // 6. 返回 utils.Success(c, gin.H{"url": "/uploads/YYYY/MM/DD/xxx.ext"})
}
```

**要点**：
- 文件名用**服务端生成**（随机 + 日期子目录），**不信任**用户原始文件名，杜绝路径穿越与重名覆盖。
- 返回的 `url` 是相对路径，与前端 `info.file.response.data.url` 的解析逻辑匹配。

#### (4) 静态文件托管 + 路由注册 —— [main.go](../JobSearchCoachingPage_BackendSide_v1/main.go)

启动时确保目录存在：

```go
if err := os.MkdirAll(cfg.UploadDir, 0o755); err != nil {
    log.Fatalf("failed to create upload dir: %v", err)
}
```

路由区新增（放在 `api` 分组之外、`r.Use(...)` 之后即可）：

```go
r.Static("/uploads", cfg.UploadDir)
```

`adminGroup` 内注册上传接口（复用现有 `AuthRequired` + `Audit` 中间件）：

```go
uploadH := handler.NewUploadHandler(cfg.UploadDir, cfg.MaxUploadSizeMB)
// ...
adminGroup.POST("/upload",
    middleware.RequireRole(model.RoleAdmin, model.RoleOperator),
    uploadH.Upload)
```

> 这样只有 **operator / admin** 能上传，且每次上传自动写入审计日志。

### 11.4 前端修改

#### (1) Vite 代理 —— [vite.config.ts](../JobSearchCoachingPage-Console-V1/vite.config.ts)

`/uploads` 也需要反代到后端，否则 `<Image src="/uploads/...">` 会 404：

```ts
proxy: {
  '/api': { target: 'http://localhost:8080', changeOrigin: true, /* 原有 Origin strip 逻辑保留 */ },
  '/uploads': { target: 'http://localhost:8080', changeOrigin: true },
}
```

#### (2) [ImageUploadField.tsx](../JobSearchCoachingPage-Console-V1/src/components/ImageUploadField.tsx) —— 小幅健壮化（可选）

核心已通，只需补两点：

```ts
// beforeUpload 校验：仅允许 JPG / PNG，且 ≤ 3MB（只做 UX 过滤，真实校验在后端 DetectContentType）
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];
beforeUpload: (file) => {
  if (!ACCEPTED_TYPES.includes(file.type)) { message.error('只支持 JPG / PNG 图片'); return Upload.LIST_IGNORE; }
  if (file.size / 1024 / 1024 > 3) { message.error('图片不能超过 3MB'); return Upload.LIST_IGNORE; }
  return true;
},
```

> ⚠️ `file.type` 是浏览器按扩展名推断的，**不可信**（`.exe` 改名 `.jpg` 也能绕过）。前端此处只挡普通误操作，真正的安全校验在后端 `http.DetectContentType`。

其余（`action`、`name: 'file'`、响应解析 `data.url`）保持不变。

### 11.5 注意事项

- **清空头像的坑**：`mentors.avatar` 是 `string`，GORM `Updates()` 会跳过空字符串零值 → 用户在表单里清空头像 URL 时**不会**真正清空数据库。若需要支持，参考 `model.Mentor.Featured` 的既有注释，在 repo.Update 中对 `avatar` 用 `.Select("avatar")` 显式处理（本期可先不做，仅记录）。
- **生产部署**：Nginx 需同时反代 `/api` 与 `/uploads` 到 8080，并给 `uploads/` 目录写权限。
- **静态目录写入权限**：后端进程需对 `UPLOAD_DIR` 有读写权限，部署时注意。

### 11.6 验收标准

1. `POST /api/admin/upload` 上传一张图片 → 返回 `{"data":{"url":"/uploads/..."}}`。
2. 浏览器直接访问返回的 `/uploads/...` 能显示图片。
3. Mentor 表单上传头像 → 预览显示 → 保存 → 列表 `Avatar` 正常展示。
4. 非 operator/admin 调用上传接口 → 返回 401/403。
5. 上传非图片文件或超 3MB → 返回 4xx 且不落盘。

---

*此文档为规划阶段输出，具体实施时可能根据实际情况调整。*  
*最后更新: 2026-08-13*
