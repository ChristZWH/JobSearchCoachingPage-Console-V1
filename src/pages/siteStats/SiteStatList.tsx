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
    catch { message.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (record: SiteStat) => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); };

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      editing ? await updateSiteStat(editing.id, values) : await createSiteStat(values);
      message.success(editing ? 'Updated' : 'Created');
      setModalOpen(false); load();
    } catch { message.error('Failed to save'); }
  };

  const handleDelete = async (id: number) => {
    try { await deleteSiteStat(id); message.success('Deleted'); load(); }
    catch { message.error('Failed to delete'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Label', dataIndex: 'label', key: 'label' },
    { title: 'Value', dataIndex: 'value', key: 'value', width: 120 },
    { title: 'Suffix', dataIndex: 'suffix', key: 'suffix', width: 100 },
  ];

  if (isOperatorOrAdmin) {
    columns.push({
      title: 'Actions', key: 'actions', width: 120,
      render: (_: unknown, record: SiteStat) => (
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
        <Title level={4}>Site Stats</Title>
        {isOperatorOrAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add</Button>}
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal title={editing ? 'Edit Stat' : 'Add Stat'} open={modalOpen} onOk={handleOk} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="label" label="Label" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="value" label="Value" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="suffix" label="Suffix"><Input /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
