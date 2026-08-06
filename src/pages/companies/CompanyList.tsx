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
    } catch { message.error('加载失败'); }
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
        message.success('更新成功');
      } else {
        await createCompanyLogo(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      load();
    } catch { message.error('保存失败'); }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCompanyLogo(id);
      message.success('删除成功');
      load();
    } catch { message.error('删除失败'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: 'Logo链接', dataIndex: 'logo_url', key: 'logo_url', ellipsis: true },
  ];

  if (isOperatorOrAdmin) {
    columns.push({
      title: '操作', key: 'actions', width: 120,
      render: (_: unknown, record: CompanyLogo) => (
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
        <Title level={4}>合作企业</Title>
        {isOperatorOrAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增</Button>}
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editing ? '编辑企业' : '新增企业'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="logo_url" label="Logo链接" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
