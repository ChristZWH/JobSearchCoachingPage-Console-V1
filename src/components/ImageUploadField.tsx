import { useState } from 'react';
import { Button, Input, Upload, Image, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { getAccessToken } from '../utils/storage';

interface ImageUploadFieldProps {
  value?: string;
  onChange?: (url: string) => void;
  /** Preview image width (default 80) */
  previewWidth?: number;
  /** Preview image height (default 80) */
  previewHeight?: number;
  /** CSS object-fit for preview (default 'cover') */
  objectFit?: 'cover' | 'contain';
  /** Placeholder text for URL input (default '或粘贴URL') */
  urlPlaceholder?: string;
  /** Upload button text (default '上传文件') */
  uploadText?: string;
}

/**
 * Reusable image upload field — supports file upload and URL paste.
 * Used by MentorForm (avatar), CompanyList (logo), and anywhere an image URL is needed.
 */
export default function ImageUploadField({
  value,
  onChange,
  previewWidth = 80,
  previewHeight = 80,
  objectFit = 'cover',
  urlPlaceholder = '或粘贴URL',
  uploadText = '上传文件',
}: ImageUploadFieldProps) {
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
      {value && (
        <Image
          src={value}
          width={previewWidth}
          height={previewHeight}
          style={{ borderRadius: 8, objectFit }}
        />
      )}
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />}>{uploadText}</Button>
      </Upload>
      <Input
        style={{ width: 200 }}
        placeholder={urlPlaceholder}
        value={urlInput}
        onChange={(e) => {
          setUrlInput(e.target.value);
          onChange?.(e.target.value);
        }}
        allowClear
      />
    </div>
  );
}
