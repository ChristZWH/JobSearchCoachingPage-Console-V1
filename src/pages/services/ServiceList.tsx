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
    catch { message.error('加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (record: ServiceCategory) => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); };

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      editing ? await updateServiceCategory(editing.id, values) : await createServiceCategory(values);
      message.success(editing ? '更新成功' : '创建成功');
      setModalOpen(false); load();
    } catch { message.error('保存失败'); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteServiceCategory(id); message.success('删除成功'); load(); }
    catch { message.error('删除失败'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '子服务', dataIndex: 'sub_services', key: 'sub_services',
      render: (v: Record<string, unknown>[]) => v?.length ?? 0,
    },
  ];

  if (isOperatorOrAdmin) {
    columns.push({
      title: '操作', key: 'actions', width: 120,
      render: (_: unknown, record: ServiceCategory) => (
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
        <Title level={4}>服务分类</Title>
        {isOperatorOrAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增</Button>}
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal title={editing ? '编辑分类' : '新增分类'} open={modalOpen} onOk={handleOk} onCancel={() => setModalOpen(false)} width={600} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="id" label="ID (标识)" rules={[{ required: true }]}><Input disabled={!!editing} /></Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="sub_services" label="子服务 (JSON)">
            <JsonEditor keyLabel="名称" valueLabel="价格/描述" />
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
    catch { message.error('加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (record: ServiceStage) => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); };

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      editing ? await updateServiceStage(editing.id, values) : await createServiceStage(values);
      message.success(editing ? '更新成功' : '创建成功');
      setModalOpen(false); load();
    } catch { message.error('保存失败'); }
  };

  const handleDelete = async (id: number) => {
    try { await deleteServiceStage(id); message.success('删除成功'); load(); }
    catch { message.error('删除失败'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '详情', dataIndex: 'details', key: 'details',
      render: (v: Record<string, unknown>[]) => JSON.stringify(v).substring(0, 80) + (JSON.stringify(v).length > 80 ? '...' : ''),
    },
  ];

  if (isOperatorOrAdmin) {
    columns.push({
      title: '操作', key: 'actions', width: 120,
      render: (_: unknown, record: ServiceStage) => (
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
        <Title level={4}>服务阶段</Title>
        {isOperatorOrAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增</Button>}
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal title={editing ? '编辑阶段' : '新增阶段'} open={modalOpen} onOk={handleOk} onCancel={() => setModalOpen(false)} width={600} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="details" label="详情 (JSON)">
            <JsonEditor keyLabel="键" valueLabel="值" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default function ServiceList() {
  return (
    <Tabs defaultActiveKey="categories" items={[
      { key: 'categories', label: '分类', children: <CategoryPanel /> },
      { key: 'stages', label: '阶段', children: <StagePanel /> },
    ]} />
  );
}
