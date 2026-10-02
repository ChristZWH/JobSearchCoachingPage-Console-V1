# 2026-10-02 学员案例内容仅英文校验

## 变更概述

控制台学员案例表单（新增/编辑）增加"内容仅英文"约束：表单顶部常驻提示（"填写内容请使用英文输入 (English only)"）+ 全部内容字段接入中文拦截校验，输入中文即红框报错"XX仅支持英文，请勿输入中文"并阻止保存；标题字段豁免（允许中文）。同时把原先长在 MentorForm 内部的 `noChineseRule` 抽取为公共校验器 `src/utils/validators.ts`，两表单共用，MentorForm 行为不变。示范中文的 placeholder 全部改为英文示范。

原因：这些字段值会原样显示在官网（英文站无翻译层），混入中文会直接外显到官网筛选下拉与案例卡片，故在控制台源头拦截。

## 影响范围

- 仓库：JobSearchCoachingPage-Console-V1，分支 `feature/english-only-case-content`
  - `src/pages/cases/CaseForm.tsx`（顶部提示 + 13 个字段校验 + 英文 placeholder）
  - `src/utils/validators.ts`（新增，公共 `noChineseRule`）
  - `src/pages/mentors/MentorForm.tsx`（改为引用公共校验器，无行为变化）
- 官网前端（FrontSide_v2）与后端（BackenSide_v1）代码零改动。

## 数据库变更

- 无表结构变更，无迁移脚本。
- 存量数据清理（测试库 maridiancareer-test，已执行）：`student_cases.industry` 中文值 → 英文，对照：金融→Finance（6 条）、咨询→Consulting、软件开发→Technology（与导师数据行业用词一致）。
- workspace 根目录种子文件 `seed-student-case-filters-test.sql`（不在任何 git 仓库内）同步改为英文值，防止重新导入回灌中文。

## 部署/上线步骤

1. 合并本分支，按常规流程发布控制台静态资源即可，无迁移、无执行顺序要求。
2. **正式库需手动执行存量清理**：若正式库 `student_cases.industry` 存在中文历史值，上线后按上面对照表 UPDATE，否则官网案例筛选下拉仍会显示中文。
3. 已有其他字段含中文的记录，编辑保存时会被新校验拦下，需先改为英文再保存。

## 回滚方式

revert 本次合并即可恢复原表单；校验纯前端行为，不涉及数据结构，无数据回滚需求。
