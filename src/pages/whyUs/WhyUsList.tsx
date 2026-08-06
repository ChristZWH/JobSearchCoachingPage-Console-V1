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
    catch { message.error('加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (record: WhyUsFeature) => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); };

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      editing ? await updateWhyUsFeature(editing.id, values) : await createWhyUsFeature(values);
      message.success(editing ? '更新成功' : '创建成功');
      setModalOpen(false); load();
    } catch { message.error('保存失败'); }
  };

  const handleDelete = async (id: number) => {
    try { await deleteWhyUsFeature(id); message.success('删除成功'); load(); }
    catch { message.error('删除失败'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '图标', dataIndex: 'icon', key: 'icon', width: 100 },
  ];

  if (isOperatorOrAdmin) {
    columns.push({
      title: '操作', key: 'actions', width: 120,
      render: (_: unknown, record: WhyUsFeature) => (
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
        <Title level={4}>为什么选择我们</Title>
        {isOperatorOrAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增</Button>}
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal title={editing ? '编辑特色' : '新增特色'} open={modalOpen} onOk={handleOk} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="描述" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="icon" label="图标（emoji或图标名称）" rules={[{ required: true }]}><Input /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
