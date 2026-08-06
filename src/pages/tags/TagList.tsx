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
    catch { message.error('加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldValue('category', 'industry'); setModalOpen(true); };
  const openEdit = (record: TagType) => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); };

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      editing ? await updateTag(editing.id, values) : await createTag(values);
      message.success(editing ? '更新成功' : '创建成功');
      setModalOpen(false); load();
    } catch { message.error('保存失败'); }
  };

  const handleDelete = async (id: number) => {
    try { await deleteTag(id); message.success('删除成功'); load(); }
    catch { message.error('删除失败'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category', width: 140,
      render: (v: string) => <Tag color={categoryColors[v] || 'default'}>{v}</Tag>,
    },
  ];

  if (isOperatorOrAdmin) {
    columns.push({
      title: '操作', key: 'actions', width: 120,
      render: (_: unknown, record: TagType) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    });
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>标签管理</Title>
        {isOperatorOrAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增</Button>}
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal title={editing ? '编辑标签' : '新增标签'} open={modalOpen} onOk={handleOk} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select options={[
              { label: '行业', value: 'industry' },
              { label: '公司', value: 'company' },
              { label: '部门', value: 'department' },
              { label: '学校', value: 'school' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
