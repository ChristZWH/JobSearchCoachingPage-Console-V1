import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Space, message, Popconfirm, Typography, Upload, Image, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadProps, TableColumnsType } from 'antd';
import { getCompanyLogos, createCompanyLogo, updateCompanyLogo, deleteCompanyLogo, type CompanyLogo } from '../../api/companies';
import { useAuth } from '../../hooks/useAuth';
import { getAccessToken } from '../../utils/storage';

const { Title } = Typography;

function LogoUploadField({ value, onChange }: { value?: string; onChange?: (url: string) => void }) {
  const [urlInput, setUrlInput] = useState(value || '');

  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/admin/upload',
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    showUploadList: false,
    onChange(info) {
      if (info.file.status === 'done') {
        const url = info.file.response?.data?.url || info.file.response?.url;
        if (url) {
          onChange?.(url);
          setUrlInput(url);
          message.success('上传成功');
        }
      } else if (info.file.status === 'error') {
        message.error('上传失败');
      }
    },
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {value && <Image src={value} width={64} height={64} style={{ borderRadius: 6, objectFit: 'contain' }} />}
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />}>上传</Button>
      </Upload>
      <Input
        style={{ width: 200 }}
        placeholder="或粘贴URL"
        value={urlInput}
        onChange={(e) => { setUrlInput(e.target.value); onChange?.(e.target.value); }}
        allowClear
      />
    </div>
  );
}

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
            <LogoUploadField />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
