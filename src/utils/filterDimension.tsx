import type { CSSProperties, ReactNode } from 'react';
import { FilterOutlined } from '@ant-design/icons';

/**
 * 官网导师筛选维度（industry / company / department / region / targetRole）。
 * 这些字段直接决定官网导师列表的筛选结果，控制台表单中用维度色 + 筛选图标
 * 高亮标识，与普通字段区分（颜色与标签管理页的分类颜色一致）。
 */
export const WEBSITE_FILTER_DIMENSIONS = ['industry', 'company', 'department', 'region', 'targetRole'] as const;

type FilterDimension = (typeof WEBSITE_FILTER_DIMENSIONS)[number];

// 主色（-6 档）用于标签文字，浅色（-1 档）用于控件底色
const dimensionColors: Record<FilterDimension, { text: string; bg: string }> = {
  industry: { text: '#1677ff', bg: '#e6f4ff' },
  company: { text: '#52c41a', bg: '#f6ffed' },
  department: { text: '#fa8c16', bg: '#fff7e6' },
  region: { text: '#f5222d', bg: '#fff1f0' },
  targetRole: { text: '#faad14', bg: '#fffbe6' },
};

/** 高亮标签：维度色文字 + 筛选图标 */
export function filterFieldLabel(field: FilterDimension, text: ReactNode): ReactNode {
  const c = dimensionColors[field];
  return (
    <span style={{ color: c.text, fontWeight: 500 }}>
      <FilterOutlined style={{ marginRight: 4, fontSize: 12 }} /> {text}
    </span>
  );
}

/** 高亮控件底色：包住 TagSelect/Input 的浅色圆角盒子 */
export function filterControlBox(field: FilterDimension): CSSProperties {
  const c = dimensionColors[field];
  return {
    display: 'inline-block',
    background: c.bg,
    border: `1px solid ${c.text}40`,
    borderRadius: 8,
    padding: '4px 8px',
  };
}
