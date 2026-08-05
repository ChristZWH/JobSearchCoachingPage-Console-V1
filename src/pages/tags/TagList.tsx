import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Typography, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getTags, createTag, updateTag, deleteTag, type Tag as TagType } from '../../api/tags';
import { useAuth } from '../../hooks/useAuth';

const { Title } = Typography;

const categoryColors: Record<string, string> = {
  industry: 'blue',
  company: 'green',
  department: 'orange',
  school: 'purple',
};

export default function TagList() {
  const [data, setData] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TagType | null>(null);
  const [form] = Form.useForm();
  const { isOperatorOrAdmin } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await getTags({ page_size: 200 }); setData(res.data); }
    catch { message.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldValue('category', 'industry'); setModalOpen(true); };
  const openEdit = (record: TagType) => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); };

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      editing ? await updateTag(editing.id, values) : await createTag(values);
      message.success(editing ? 'Updated' : 'Created');
      setModalOpen(false); load();
    } catch { message.error('Failed to save'); }
  };

  const handleDelete = async (id: number) => {
    try { await deleteTag(id); message.success('Deleted'); load(); }
    catch { message.error('Failed to delete'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', dataIndex: 'category', key: 'category', width: 140,
      render: (v: string) => <Tag color={categoryColors[v] || 'default'}>{v}</Tag>,
    },
  ];

  if (isOperatorOrAdmin) {
    columns.push({
      title: 'Actions', key: 'actions', width: 120,
      render: (_: unknown, record: TagType) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    });
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>Tags</Title>
        {isOperatorOrAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add</Button>}
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal title={editing ? 'Edit Tag' : 'Add Tag'} open={modalOpen} onOk={handleOk} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select options={[
              { label: 'Industry', value: 'industry' },
              { label: 'Company', value: 'company' },
              { label: 'Department', value: 'department' },
              { label: 'School', value: 'school' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
