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

`student_cases` 新增 3 列（纯 ADD COLUMN，MySQL 8 instant DDL，不锁表、不碰存量数据）：

```sql
offer_position VARCHAR(200) DEFAULT '' COMMENT 'Offer岗位'
school         VARCHAR(100) DEFAULT '' COMMENT '毕业院校名称'
major          VARCHAR(100) DEFAULT '' COMMENT '学员专业名称'
```

- 迁移脚本：`JobSearchCoachingPage_BackenSide_v1/scripts/migrate_student_case_filters.sql`（一次性，重复执行报 Duplicate column 属预期）
- `schema.sql` 已同步；本地两个库（maridiancareer / -test）已于 2026-10-01 执行
- `industry` / `company` 复用现有列，列定义不变，语义在后台改为「从业行业方向 / 入职公司」

## 部署 / 上线步骤

1. 合并顺序：**后端 → 前端 / 控制台**（后端不上，前端读不到新字段）
2. 服务器执行迁移：`mysql -u<user> -p maridiancareer < scripts/migrate_student_case_filters.sql`
3. 部署后端二进制（现有 systemd 流程），前端、控制台随后部署
4. 控制台给存量案例**补录五个维度的值**（此前为空，筛选下拉会缺项）
5. ⚠️ `scripts/seed-student-case-filters-test.sql`（8 条测试案例，TRUNCATE 覆盖式）**仅用于本地/测试库，勿在线上执行**

## 回滚方式

- 代码：三个仓库各自 revert 对应 PR 即可，互相独立
- 数据库：`ALTER TABLE student_cases DROP COLUMN offer_position, DROP COLUMN school, DROP COLUMN major;`（上线初期三列为空值，无数据损失）

## 本地联调环境备忘

- 官网 `.env`：`USE_MOCK=false` + `GO_API_BASE_URL=http://localhost:8081`（连本地后端+本地 MySQL；切回 mock 改 `USE_MOCK=true`）
- 本地种子：`scripts/seed-student-case-filters-test.sql`（8 条案例）；`/tmp/seed-local-dev.sql`（6 导师+首页辅助表+9 洞察，未入库到 git，临时文件）
- 已知边界：导师 tags/教育经历等子表无种子，导师详情页对应区块为空
