import { App, Button, Upload, Image } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { getAccessToken } from '../utils/storage';

interface ImageUploadFieldProps {
  value?: string;
  onChange?: (url: string) => void;
  /** Upload subdirectory (backend allowlist, e.g. "student-cases"); omit for the default date-based storage */
  uploadDir?: string;
  /** Preview image width (default 80) */
  previewWidth?: number;
  /** Preview image height (default 80) */
  previewHeight?: number;
  /** CSS object-fit for preview (default 'cover') */
  objectFit?: 'cover' | 'contain';
  /** Upload button text (default '上传文件') */
  uploadText?: string;
}

/**
 * Reusable image upload field — file upload only, no URL paste.
 * Used by MentorForm (avatar), CompanyList (logo), and anywhere an image URL is needed.
 */
export default function ImageUploadField({
  value,
  onChange,
  uploadDir,
  previewWidth = 80,
  previewHeight = 80,
  objectFit = 'cover',
  uploadText = '上传文件',
}: ImageUploadFieldProps) {
  // 用 App 上下文里的 message，避免静态方法在 antd v5 + React 19 下弹不出提示
  const { message } = App.useApp();

  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/admin/upload',
    data: uploadDir ? { dir: uploadDir } : undefined,
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    showUploadList: false,
    beforeUpload: (file) => {
      // file.type 是浏览器按扩展名推断的（可为空、也不可信），此处只做 UX 过滤；
      // 真正的安全校验在后端 http.DetectContentType。加扩展名兜底，避免空 type 误拦截。
      const isJpgPng =
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        /\.(jpe?g|png)$/i.test(file.name || '');
      if (!isJpgPng) {
        message.error('只支持 JPG / PNG 图片');
        return Upload.LIST_IGNORE;
      }
      if (file.size / 1024 / 1024 > 3) {
        message.error('图片不能超过 3MB');
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    onChange(info) {
      if (info.file.status === 'done') {
        const url = info.file.response?.data?.url || info.file.response?.url;
        if (url) {
          onChange?.(url);
          message.success('上传成功');
        }
      } else if (info.file.status === 'error') {
        // 把服务端返回的具体原因带上，避免只显示笼统的“上传失败”
        const errMsg = (info.file.error as { status?: number; message?: string })?.message;
        message.error(errMsg ? `上传失败：${errMsg}` : '上传失败');
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
    </div>
  );
}
