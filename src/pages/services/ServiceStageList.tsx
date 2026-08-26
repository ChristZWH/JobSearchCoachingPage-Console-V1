import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Space, message, Popconfirm, Typography, Tooltip } from 'antd';
import type { TableColumnsType } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  getServiceStages, createServiceStage, updateServiceStage, deleteServiceStage,
  type ServiceStage,
} from '../../api/services';
import { useAuth } from '../../hooks/useAuth';
import { StringListEditor } from '../../components/JsonEditor';
import ImageUploadField from '../../components/ImageUploadField';

const { Title } = Typography;

export default function ServiceStageList() {
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

  const columns: TableColumnsType<ServiceStage> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '详情', dataIndex: 'details', key: 'details',
      render: (v: string[]) => {
        const list = v ?? [];
        return list.slice(0, 3).join('、') + (list.length > 3 ? `…（共${list.length}条）` : '');
      },
    },
  ];

  if (isOperatorOrAdmin) {
    columns.push({
      title: '操作', key: 'actions', width: 100,
      render: (_: unknown, record: ServiceStage) => (
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
        <Title level={4} style={{ marginBottom: 0 }}>服务阶段</Title>
        {isOperatorOrAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增</Button>}
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal title={editing ? '编辑阶段' : '新增阶段'} open={modalOpen} onOk={handleOk} onCancel={() => setModalOpen(false)} width={600} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="subtitle" label="副标题"><Input /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="image" label="背景图（官网阶段卡片背景）">
            <ImageUploadField previewWidth={160} previewHeight={90} objectFit="cover" />
          </Form.Item>
          <Form.Item name="details" label="要点列表（官网详情区展示）">
            <StringListEditor />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
