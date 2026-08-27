import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Space, message, Popconfirm, Typography, Image, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { getCompanyLogos, createCompanyLogo, updateCompanyLogo, deleteCompanyLogo, type CompanyLogo } from '../../api/companies';
import { useAuth } from '../../hooks/useAuth';
import ImageUploadField from '../../components/ImageUploadField';

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

  const columns: TableColumnsType<CompanyLogo> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: 'Logo', dataIndex: 'logo', key: 'logo_url', width: 80,
      render: (_v: string, record: CompanyLogo) => record.logo ? <Image src={record.logo} width={40} height={40} style={{ borderRadius: 4, objectFit: 'contain' }} /> : <span style={{ color: '#ccc' }}>—</span>,
    },
  ];

  if (isOperatorOrAdmin) {
    columns.push({
      title: '操作', key: 'actions', width: 100,
      render: (_: unknown, record: CompanyLogo) => (
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
          <Form.Item name="logo" label="Logo" rules={[{ required: true }]}>
            <ImageUploadField uploadDir="logos" previewWidth={64} previewHeight={64} objectFit="contain" uploadText="上传" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
