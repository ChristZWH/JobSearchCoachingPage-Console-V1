import { useEffect, useState, useCallback } from 'react';
import { Tabs, Table, Button, Modal, Form, Input, Space, message, Popconfirm, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  getServiceCategories, createServiceCategory, updateServiceCategory, deleteServiceCategory,
  getServiceStages, createServiceStage, updateServiceStage, deleteServiceStage,
  type ServiceCategory, type ServiceStage,
} from '../../api/services';
import { useAuth } from '../../hooks/useAuth';
import JsonEditor from '../../components/JsonEditor';

const { Title } = Typography;

function CategoryPanel() {
  const [data, setData] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCategory | null>(null);
  const [form] = Form.useForm();
  const { isOperatorOrAdmin } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await getServiceCategories(); setData(res); }
    catch { message.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (record: ServiceCategory) => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); };

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      editing ? await updateServiceCategory(editing.id, values) : await createServiceCategory(values);
      message.success(editing ? 'Updated' : 'Created');
      setModalOpen(false); load();
    } catch { message.error('Failed to save'); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteServiceCategory(id); message.success('Deleted'); load(); }
    catch { message.error('Failed to delete'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 100 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Sub Services', dataIndex: 'sub_services', key: 'sub_services',
      render: (v: Record<string, unknown>[]) => v?.length ?? 0,
    },
  ];

  if (isOperatorOrAdmin) {
    columns.push({
      title: 'Actions', key: 'actions', width: 120,
      render: (_: unknown, record: ServiceCategory) => (
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
        <Title level={4}>Service Categories</Title>
        {isOperatorOrAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add</Button>}
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal title={editing ? 'Edit Category' : 'Add Category'} open={modalOpen} onOk={handleOk} onCancel={() => setModalOpen(false)} width={600} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="id" label="ID (slug)" rules={[{ required: true }]}><Input disabled={!!editing} /></Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="sub_services" label="Sub Services (JSON)">
            <JsonEditor keyLabel="Name" valueLabel="Price/Desc" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

function StagePanel() {
  const [data, setData] = useState<ServiceStage[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceStage | null>(null);
  const [form] = Form.useForm();
  const { isOperatorOrAdmin } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await getServiceStages(); setData(res); }
    catch { message.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (record: ServiceStage) => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); };

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      editing ? await updateServiceStage(editing.id, values) : await createServiceStage(values);
      message.success(editing ? 'Updated' : 'Created');
      setModalOpen(false); load();
    } catch { message.error('Failed to save'); }
  };

  const handleDelete = async (id: number) => {
    try { await deleteServiceStage(id); message.success('Deleted'); load(); }
    catch { message.error('Failed to delete'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Details', dataIndex: 'details', key: 'details',
      render: (v: Record<string, unknown>[]) => JSON.stringify(v).substring(0, 80) + (JSON.stringify(v).length > 80 ? '...' : ''),
    },
  ];

  if (isOperatorOrAdmin) {
    columns.push({
      title: 'Actions', key: 'actions', width: 120,
      render: (_: unknown, record: ServiceStage) => (
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
        <Title level={4}>Service Stages</Title>
        {isOperatorOrAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add</Button>}
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal title={editing ? 'Edit Stage' : 'Add Stage'} open={modalOpen} onOk={handleOk} onCancel={() => setModalOpen(false)} width={600} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="details" label="Details (JSON)">
            <JsonEditor keyLabel="Key" valueLabel="Value" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default function ServiceList() {
  return (
    <Tabs defaultActiveKey="categories" items={[
      { key: 'categories', label: 'Categories', children: <CategoryPanel /> },
      { key: 'stages', label: 'Stages', children: <StagePanel /> },
    ]} />
  );
}
