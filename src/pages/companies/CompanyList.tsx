import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Space, message, Popconfirm, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getCompanyLogos, createCompanyLogo, updateCompanyLogo, deleteCompanyLogo, type CompanyLogo } from '../../api/companies';
import { useAuth } from '../../hooks/useAuth';

const { Title } = Typography;

export default function CompanyList() {
  const [data, setData] = useState<CompanyLogo[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyLogo | null>(null);
  const [form] = Form.useForm();
  const { isOperatorOrAdmin } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCompanyLogos();
      setData(res);
    } catch { message.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: CompanyLogo) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await updateCompanyLogo(editing.id, values);
        message.success('Updated');
      } else {
        await createCompanyLogo(values);
        message.success('Created');
      }
      setModalOpen(false);
      load();
    } catch { message.error('Failed to save'); }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCompanyLogo(id);
      message.success('Deleted');
      load();
    } catch { message.error('Failed to delete'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Logo URL', dataIndex: 'logo_url', key: 'logo_url', ellipsis: true },
  ];

  if (isOperatorOrAdmin) {
    columns.push({
      title: 'Actions', key: 'actions', width: 120,
      render: (_: unknown, record: CompanyLogo) => (
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
        <Title level={4}>Company Logos</Title>
        {isOperatorOrAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add</Button>}
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editing ? 'Edit Company' : 'Add Company'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="logo_url" label="Logo URL" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
