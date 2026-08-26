import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Space, message, Popconfirm, Typography, Tooltip } from 'antd';
import type { TableColumnsType } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  getServiceCategories, createServiceCategory, updateServiceCategory, deleteServiceCategory,
  type ServiceCategory,
} from '../../api/services';
import { useAuth } from '../../hooks/useAuth';
import { SubServiceListEditor } from '../../components/JsonEditor';

const { Title } = Typography;

export default function ServiceCategoryList() {
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

  const columns: TableColumnsType<ServiceCategory> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 100 },
    { title: '名称', dataIndex: 'title', key: 'title' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '子服务', dataIndex: 'subServices', key: 'sub_services',
      render: (v: Record<string, unknown>[]) => v?.length ?? 0,
    },
  ];

  if (isOperatorOrAdmin) {
    columns.push({
      title: '操作', key: 'actions', width: 100,
      render: (_: unknown, record: ServiceCategory) => (
        <Space size={0}>
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Tooltip title="删除">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    });
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 0 }}>服务分类</Title>
        {isOperatorOrAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增</Button>}
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal title={editing ? '编辑分类' : '新增分类'} open={modalOpen} onOk={handleOk} onCancel={() => setModalOpen(false)} width={600} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="id" label="ID (标识)" rules={[{ required: true }]}><Input disabled={!!editing} /></Form.Item>
          <Form.Item name="title" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="subServices" label="子服务">
            <SubServiceListEditor />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
