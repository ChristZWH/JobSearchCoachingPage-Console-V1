# 2026-10-01 学员案例筛选字段改造（五维度）

## 变更概述

官网「学员案例」页筛选由 tags 标签三维度（role/function/topic）改为五个结构化字段：**从业行业方向、入职公司名称、Offer 岗位、毕业院校名称、学员专业名称**。机制仿照导师页：选项从案例数据提取去重、客户端过滤、URL 参数同步。tags 列保留仅作卡片展示，不再参与筛选。

方案文档：飞书《学员案例筛选字段改造》（含新旧表结构对比，同事评审用）

## 影响范围

| 仓库 | 分支 | PR | 状态 |
|---|---|---|---|
| JobSearchCoachingPage_BackenSide_v1 | `feature/student-case-filter-fields` | [#2](https://github.com/ChristZWH/JobSearchCoachingPage_BackenSide_v1/pull/2) | OPEN，待合并（reviewer: QikaiZhang） |
| JobSearchCoachingPage_FrontSide_v2 | `feat/student-case-filter-fields` | [#5](https://github.com/ChristZWH/JobSearchCoachingPage_FrontSide_v2/pull/5) | OPEN，待合并（reviewer: QikaiZhang） |
| JobSearchCoachingPage-Console-V1 | `feature/student-case-filter-fields-v2` | [#3](https://github.com/ChristZWH/JobSearchCoachingPage-Console-V1/pull/3) | OPEN，待合并（QikaiZhang 非该仓库协作者，暂未指派） |

> Console 历史：原 PR #1 曾合并又被 #2 revert（内容回到改前），#3 为 cherry-pick 重新提交；旧分支 `feature/student-case-filter-fields` 及 revert 分支已删除。

## 数据库变更

`student_cases` 新增 3 列（纯 ADD COLUMN，不碰存量数据。DDL 执行方式：MySQL 8.0.29+ 为 INSTANT；更早 8.0.x 带 AFTER 为 INPLACE——重建表但允许并发读写，本表量级小均无阻塞风险）：

```sql
offer_position VARCHAR(200) DEFAULT '' COMMENT 'Offer岗位'
school         VARCHAR(100) DEFAULT '' COMMENT '毕业院校名称'
major          VARCHAR(100) DEFAULT '' COMMENT '学员专业名称'
```

- 迁移脚本：`JobSearchCoachingPage_BackenSide_v1/scripts/migrate_student_case_filters.sql`（幂等：information_schema + PREPARE，重复执行自动跳过，兼容中途态）
- `schema.sql` 已同步；本地两个库（maridiancareer / -test）已于 2026-10-01 执行
- `industry` / `company` 复用现有列，列定义不变，语义在后台改为「从业行业方向 / 入职公司」

## 部署 / 上线步骤

> ⚠️ 顺序有讲究（Review #2 修正）：后端 Update 是全量覆盖契约（`Select("*").Save`），**旧版控制台先于新后端部署时，更新案例会把 offer_position/school/major 抹成空串**。而新版控制台打旧后端只会静默丢新字段编辑、不抹老数据——所以控制台必须先于后端上线。

1. 合并：三个 PR 顺序随意；**部署顺序必须是：DB 加列 → 控制台 → 后端 → 官网前端**
2. 服务器执行迁移：`mysql -u<user> -p maridiancareer < scripts/migrate_student_case_filters.sql`（幂等，重复执行自动跳过）
3. 部署控制台，再部署后端二进制（现有 systemd 流程），最后官网前端
4. 按 `audit-student-case-filters.sql` 审计脏值 → 控制台补录五个维度 + 整理 tags → `cleanup` 清洗 → 复审，**通过审计脚本头部的"干净验收门禁"才算完成**

> 本地联调种子（8 条测试案例）不随仓库分发：文件在仓库外（`JobSearchCoachingPage/seed-student-case-filters-test.sql`），仅用于本地库造数，服务器迁移用不到它。

## Review 修正（2026-10-01，同事 review PR #2）

1. **迁移脚本幂等化**：原脚本"非幂等，报错即已迁移"，不符合仓库惯例（其余迁移脚本均幂等）。已用 `information_schema` + `PREPARE` 重写为幂等版，并在本地完整演练：未迁移表首跑加列 ✓ → 重跑三列全部 skip ✓ → 数据恢复无损 ✓。
2. **Update 全量覆盖风险**：已在 `student_case_repo.go` 的 `Update()` 补契约注释（部署顺序约束），PR 描述、`scripts/README.md`、本文档三处同步写明"控制台先于后端"的部署顺序。未做 partial update（保持既有模式，review 认可最低要求是 PR 描述提醒）。

## 回滚方式

- 代码：三个仓库各自 revert 对应 PR 即可，互相独立
- 数据库：`ALTER TABLE student_cases DROP COLUMN offer_position, DROP COLUMN school, DROP COLUMN major;`（上线初期三列为空值，无数据损失）

## 补充决策（数据质量与防脏，2026-10-01 定稿）

1. **筛选机制定稿**：与导师页逻辑一致——接口不加筛选参数，前端全量拉取后客户端过滤。字段"既筛选又展示"。
2. **脏值风险结论**：加列本身不产生脏值；脏值来源是老数据 `industry`/`company` 的语义变化（目标→从业/入职）与写法变体（英文值、大小写、首尾空格）。筛选选项是数据实时提取的，"数据干净=下拉干净"，不存在不可逆脏数据。
3. **新增 `scripts/audit-student-case-filters.sql`**（后端仓库）：五维度 distinct 值+行数的只读审计，上线加列后跑一遍看老值，补录/清洗后复查归零。
4. **新增 `scripts/cleanup-student-case-filters.sql`**（后端仓库）：清洗 UPDATE 模板（全部默认注释，按审计结果启用；含备份与执行纪律说明）。
5. **控制台防脏加固**：案例表单维度下拉补齐 TagSelect 同款归一化——失焦时去首尾空白/控制字符，大小写不敏感命中已有写法自动回填。
6. **tags 旧标签：不留旧值，补录时一并清理**（修订：原定"保留"，按"数据库不留脏值"要求升级）。tags 已不参与筛选、仅卡片角标展示；运营补录五个维度字段时把 tags 整理为纯展示标签（公司名/亮点词），清洗模板提供按值删除/清空两种 SQL（默认注释，先审计再启用）。
7. **干净验收门禁（硬性）**：清洗脚本 ①（TRIM 去首尾空格）默认执行；审计脚本头部定义验收标准——五维度无同义变体、industry 全部落在官网分类、无空值、tags 无旧维度残留。**未达标不得关闭本次改造**。

## 已知边界（2026-10-01，Review ⚠️2）

- **案例列表"显式全量"约定**：官网固定传 `limit=1000`，后端案例端点上限同步放宽 100 → 1000（原先缺省只返回 20、上限 100，案例超量会**静默截断**且无任何报错）。案例超过 1000 条时再引入分页。
- **导师页是同款"前端全量过滤"模式且未传 limit**（缺省 20、上限 100）——本 PR 范围外未动；导师量级逼近 20 时需照此同样处理。

## 本地联调环境备忘

- 官网 `.env`：`USE_MOCK=false` + `GO_API_BASE_URL=http://localhost:8081`（连本地后端+本地 MySQL；切回 mock 改 `USE_MOCK=true`）
- 本地种子：案例 `JobSearchCoachingPage/seed-student-case-filters-test.sql`（仓库外）；`/tmp/seed-local-dev.sql`（6 导师+首页辅助表+9 洞察，临时文件）
- 已知边界：导师 tags/教育经历等子表无种子，导师详情页对应区块为空
