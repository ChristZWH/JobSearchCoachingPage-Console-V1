import { Button, Input, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

interface JsonEditorProps {
  value?: Record<string, string>[];
  onChange?: (value: Record<string, string>[]) => void;
  keyLabel?: string;
  valueLabel?: string;
  readonly?: boolean;
}

/**
 * Generic JSON key-value array editor.
 * Used for fields like reviews, languages, key_skills, teaching_clips, tags, etc.
 */
export default function JsonEditor({
  value = [],
  onChange,
  keyLabel = 'Key',
  valueLabel = 'Value',
  readonly = false,
}: JsonEditorProps) {
  const handleAdd = () => {
    const next = [...value, { key: '', value: '' }];
    onChange?.(next);
  };

  const handleRemove = (index: number) => {
    const next = value.filter((_, i) => i !== index);
    onChange?.(next);
  };

  const handleChange = (index: number, field: 'key' | 'value', val: string) => {
    const next = [...value];
    next[index] = { ...next[index], [field]: val };
    onChange?.(next);
  };

  if (readonly && (!value || value.length === 0)) {
    return <span style={{ color: '#999' }}>—</span>;
  }

  return (
    <div>
      {value.map((item, index) => (
        <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="start">
          <Input
            placeholder={keyLabel}
            value={item.key || ''}
            onChange={(e) => handleChange(index, 'key', e.target.value)}
            disabled={readonly}
            style={{ width: 160 }}
          />
          <Input
            placeholder={valueLabel}
            value={item.value || ''}
            onChange={(e) => handleChange(index, 'value', e.target.value)}
            disabled={readonly}
            style={{ width: 260 }}
          />
          {!readonly && (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemove(index)}
            />
          )}
        </Space>
      ))}
      {!readonly && (
        <Button type="dashed" onClick={handleAdd} icon={<PlusOutlined />} style={{ marginTop: 4 }}>
          添加条目
        </Button>
      )}
    </div>
  );
}

/** String array editor — for languages, key_skills etc. */
export function StringArrayEditor({
  value = [],
  onChange,
  placeholder = 'Enter value',
  readonly = false,
}: {
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  readonly?: boolean;
}) {
  const handleAdd = () => {
    onChange?.([...value, '']);
  };

  const handleRemove = (index: number) => {
    onChange?.(value.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, val: string) => {
    const next = [...value];
    next[index] = val;
    onChange?.(next);
  };

  if (readonly && (!value || value.length === 0)) {
    return <span style={{ color: '#999' }}>—</span>;
  }

  return (
    <div>
      {value.map((item, index) => (
        <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="start">
          <Input
            placeholder={placeholder}
            value={item}
            onChange={(e) => handleChange(index, e.target.value)}
            disabled={readonly}
            style={{ width: 380 }}
          />
          {!readonly && (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemove(index)}
            />
          )}
        </Space>
      ))}
      {!readonly && (
        <Button type="dashed" onClick={handleAdd} icon={<PlusOutlined />} style={{ marginTop: 4 }}>
          添加
        </Button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Structured editors — admin-friendly forms for complex JSON
// ═══════════════════════════════════════════════════════════

/** Review editor: name + content pairs */
export function ReviewListEditor({
  value = [],
  onChange,
}: {
  value?: { name?: string; content?: string }[];
  onChange?: (v: { name?: string; content?: string }[]) => void;
}) {
  const handleAdd = () => onChange?.([...value, { name: '', content: '' }]);
  const handleRemove = (i: number) => onChange?.(value.filter((_, idx) => idx !== i));

  return (
    <div>
      {value.map((item, i) => (
        <Space key={i} style={{ display: 'flex', marginBottom: 8 }} align="start">
          <Input
            placeholder="评价人姓名"
            value={item.name || ''}
            onChange={(e) => {
              const next = [...value]; next[i] = { ...next[i], name: e.target.value }; onChange?.(next);
            }}
            style={{ width: 140 }}
          />
          <Input
            placeholder="评价内容"
            value={item.content || ''}
            onChange={(e) => {
              const next = [...value]; next[i] = { ...next[i], content: e.target.value }; onChange?.(next);
            }}
            style={{ width: 320 }}
          />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemove(i)} />
        </Space>
      ))}
      <Button type="dashed" onClick={handleAdd} icon={<PlusOutlined />}>添加评价</Button>
    </div>
  );
}

/** Teaching clip editor: title + url pairs */
export function ClipListEditor({
  value = [],
  onChange,
}: {
  value?: { title?: string; url?: string }[];
  onChange?: (v: { title?: string; url?: string }[]) => void;
}) {
  const handleAdd = () => onChange?.([...value, { title: '', url: '' }]);
  const handleRemove = (i: number) => onChange?.(value.filter((_, idx) => idx !== i));

  return (
    <div>
      {value.map((item, i) => (
        <Space key={i} style={{ display: 'flex', marginBottom: 8 }} align="start">
          <Input
            placeholder="片段标题"
            value={item.title || ''}
            onChange={(e) => {
              const next = [...value]; next[i] = { ...next[i], title: e.target.value }; onChange?.(next);
            }}
            style={{ width: 180 }}
          />
          <Input
            placeholder="链接URL"
            value={item.url || ''}
            onChange={(e) => {
              const next = [...value]; next[i] = { ...next[i], url: e.target.value }; onChange?.(next);
            }}
            style={{ width: 280 }}
          />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemove(i)} />
        </Space>
      ))}
      <Button type="dashed" onClick={handleAdd} icon={<PlusOutlined />}>添加片段</Button>
    </div>
  );
}

/** Sub-services editor: name + price + description */
export function SubServiceListEditor({
  value = [],
  onChange,
}: {
  value?: { name?: string; price?: string; description?: string }[];
  onChange?: (v: { name?: string; price?: string; description?: string }[]) => void;
}) {
  const handleAdd = () => onChange?.([...value, { name: '', price: '', description: '' }]);
  const handleRemove = (i: number) => onChange?.(value.filter((_, idx) => idx !== i));

  return (
    <div>
      {value.map((item, i) => (
        <Space key={i} style={{ display: 'flex', marginBottom: 8, alignItems: 'flex-start' }} wrap>
          <Input
            placeholder="服务名称"
            value={item.name || ''}
            onChange={(e) => {
              const next = [...value]; next[i] = { ...next[i], name: e.target.value }; onChange?.(next);
            }}
            style={{ width: 180 }}
          />
          <Input
            placeholder="价格"
            value={item.price || ''}
            onChange={(e) => {
              const next = [...value]; next[i] = { ...next[i], price: e.target.value }; onChange?.(next);
            }}
            style={{ width: 120 }}
          />
          <Input
            placeholder="描述"
            value={item.description || ''}
            onChange={(e) => {
              const next = [...value]; next[i] = { ...next[i], description: e.target.value }; onChange?.(next);
            }}
            style={{ width: 220 }}
          />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemove(i)} />
        </Space>
      ))}
      <Button type="dashed" onClick={handleAdd} icon={<PlusOutlined />}>添加子服务</Button>
    </div>
  );
}
