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
