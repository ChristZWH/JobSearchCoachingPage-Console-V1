/**
 * 案例标签 → 筛选维度映射表（与官网 FrontSide 的 `src/config/case-filter-tags.ts` 保持一致）。
 *
 * 官网案例页按三个维度筛选：role（职能）、function（业务线）、topic（主题）。
 * 本表决定每个标签归属哪个维度；未命中的标签在官网上会归入 topic。
 * 控制台录入新标签时建议优先从本表 + 现有案例标签中选择；确需新标签时，
 * 应同步在官网 `CASE_TAG_MAP` 中补充维度映射，避免新标签全部落入 topic。
 */
export const CASE_TAG_MAP: Record<string, string[]> = {
  // === role: 职能/岗位类型 ===
  role: ['IB', 'S&T', 'PE', 'Consulting', 'MBB', 'Internship'],

  // === function: 业务线/专长方向 ===
  function: ['M&A', 'Energy IB', 'Case Interview', 'Interview Strategy', 'Networking', 'Email'],

  // === topic: 主题/话题 ===
  topic: [
    'Career Pivot',
    'Career Switch',
    'Non-Target',
    'Non-Finance Major',
    'Campus Strategy',
    'Early Prep',
    'Video',
    'Hong Kong',
    'Goldman Sachs',
    'Moelis',
    'Evercore',
  ],
};
