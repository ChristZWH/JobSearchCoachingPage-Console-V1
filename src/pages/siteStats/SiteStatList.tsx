import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Space, message, Popconfirm, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getSiteStats, createSiteStat, updateSiteStat, deleteSiteStat, type SiteStat } from '../../api/siteStats';
import { useAuth } from '../../hooks/useAuth';

const { Title } = Typography;

export default function SiteStatList() {
  const [data, setData] = useState<SiteStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SiteStat | null>(null);
  const [form] = Form.useForm();
  const { isOperatorOrAdmin } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await getSiteStats(); setData(res); }
    catch { message.error('加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (record: SiteStat) => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); };

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      editing ? await updateSiteStat(editing.id, values) : await createSiteStat(values);
      message.success(editing ? '更新成功' : '创建成功');
      setModalOpen(false); load();
    } catch { message.error('保存失败'); }
  };

  const handleDelete = async (id: number) => {
    try { await deleteSiteStat(id); message.success('删除成功'); load(); }
    catch { message.error('删除失败'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '标签', dataIndex: 'label', key: 'label' },
    { title: '数值', dataIndex: 'value', key: 'value', width: 120 },
    { title: '后缀', dataIndex: 'suffix', key: 'suffix', width: 100 },
  ];

  if (isOperatorOrAdmin) {
    columns.push({
      title: '操作', key: 'actions', width: 120,
      render: (_: unknown, record: SiteStat) => (
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
        <Title level={4}>网站统计</Title>
        {isOperatorOrAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增</Button>}
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal title={editing ? '编辑统计' : '新增统计'} open={modalOpen} onOk={handleOk} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="label" label="标签" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="value" label="数值" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="suffix" label="后缀"><Input /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
