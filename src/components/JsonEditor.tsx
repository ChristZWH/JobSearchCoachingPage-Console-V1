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
 * Used for legacy key-value fields (e.g. service meta).
 */
export default function JsonEditor({
  value = [],
  onChange,
  keyLabel = 'Key',
  valueLabel = 'Value',
  readonly = false,
}: JsonEditorProps) {
  // Normalise null (from backend NULL JSON fields) to empty array
  const list: Record<string, string>[] = value ?? [];

  const handleAdd = () => {
    const next = [...list, { key: '', value: '' }];
    onChange?.(next);
  };

  const handleRemove = (index: number) => {
    const next = list.filter((_, i) => i !== index);
    onChange?.(next);
  };

  const handleChange = (index: number, field: 'key' | 'value', val: string) => {
    const next = [...list];
    next[index] = { ...next[index], [field]: val };
    onChange?.(next);
  };

  if (readonly && list.length === 0) {
    return <span style={{ color: '#999' }}>—</span>;
  }

  return (
    <div>
      {list.map((item, index) => (
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

/** Sub-services editor: name + price + description */
export function SubServiceListEditor({
  value = [],
  onChange,
}: {
  value?: { name?: string; price?: string; description?: string }[];
  onChange?: (v: { name?: string; price?: string; description?: string }[]) => void;
}) {
  // Normalise null (from backend NULL JSON fields) to empty array
  type SubService = { name?: string; price?: string; description?: string };
  const list: SubService[] = value ?? [];

  const handleAdd = () => onChange?.([...list, { name: '', price: '', description: '' }]);
  const handleRemove = (i: number) => onChange?.(list.filter((_, idx) => idx !== i));

  return (
    <div>
      {list.map((item, i) => (
        <Space key={i} style={{ display: 'flex', marginBottom: 8, alignItems: 'flex-start' }} wrap>
          <Input
            placeholder="服务名称"
            value={item.name || ''}
            onChange={(e) => {
              const next = [...list]; next[i] = { ...next[i], name: e.target.value }; onChange?.(next);
            }}
            style={{ width: 180 }}
          />
          <Input
            placeholder="价格"
            value={item.price || ''}
            onChange={(e) => {
              const next = [...list]; next[i] = { ...next[i], price: e.target.value }; onChange?.(next);
            }}
            style={{ width: 120 }}
          />
          <Input
            placeholder="描述"
            value={item.description || ''}
            onChange={(e) => {
              const next = [...list]; next[i] = { ...next[i], description: e.target.value }; onChange?.(next);
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

/** String-list editor: one input per line (e.g. service stage details). */
export function StringListEditor({
  value = [],
  onChange,
}: {
  value?: string[];
  onChange?: (v: string[]) => void;
}) {
  // Normalise null (from backend NULL JSON fields) to empty array
  const list: string[] = value ?? [];

  const handleAdd = () => onChange?.([...list, '']);
  const handleRemove = (i: number) => onChange?.(list.filter((_, idx) => idx !== i));

  return (
    <div>
      {list.map((item, i) => (
        <Space key={i} style={{ display: 'flex', marginBottom: 8 }}>
          <Input
            placeholder={`要点 ${i + 1}`}
            value={item}
            onChange={(e) => {
              const next = [...list]; next[i] = e.target.value; onChange?.(next);
            }}
          />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemove(i)} />
        </Space>
      ))}
      <Button type="dashed" onClick={handleAdd} icon={<PlusOutlined />}>添加要点</Button>
    </div>
  );
}
