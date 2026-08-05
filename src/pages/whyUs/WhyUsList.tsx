import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Space, message, Popconfirm, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getWhyUsFeatures, createWhyUsFeature, updateWhyUsFeature, deleteWhyUsFeature, type WhyUsFeature } from '../../api/whyUs';
import { useAuth } from '../../hooks/useAuth';

const { Title } = Typography;

export default function WhyUsList() {
  const [data, setData] = useState<WhyUsFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WhyUsFeature | null>(null);
  const [form] = Form.useForm();
  const { isOperatorOrAdmin } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await getWhyUsFeatures(); setData(res); }
    catch { message.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (record: WhyUsFeature) => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); };

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      editing ? await updateWhyUsFeature(editing.id, values) : await createWhyUsFeature(values);
      message.success(editing ? 'Updated' : 'Created');
      setModalOpen(false); load();
    } catch { message.error('Failed to save'); }
  };

  const handleDelete = async (id: number) => {
    try { await deleteWhyUsFeature(id); message.success('Deleted'); load(); }
    catch { message.error('Failed to delete'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Icon', dataIndex: 'icon', key: 'icon', width: 100 },
  ];

  if (isOperatorOrAdmin) {
    columns.push({
      title: 'Actions', key: 'actions', width: 120,
      render: (_: unknown, record: WhyUsFeature) => (
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
        <Title level={4}>Why Us Features</Title>
        {isOperatorOrAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add</Button>}
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal title={editing ? 'Edit Feature' : 'Add Feature'} open={modalOpen} onOk={handleOk} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="icon" label="Icon (emoji or icon name)" rules={[{ required: true }]}><Input /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
