import axios from 'axios';

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;

export const API_BASE = (env?.VITE_API_BASE || '/api').replace(/\/+$/, '');

export const apiUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};

export interface ImportDocumentResult {
  fileName: string;
  path: string;
}

export interface UploadAssetResult {
  fileName: string;
  relativePath: string;
}

export const getApiErrorMessage = (error: unknown, fallback = '操作失败') => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export const importDocument = async (fileName: string, content: string) => {
  const res = await axios.post<{ success: boolean; data: ImportDocumentResult; error?: string }>(
    apiUrl('/files/import'),
    { fileName, content, overwrite: false }
  );

  if (!res.data.success) {
    throw new Error(res.data.error || '导入失败');
  }

  return res.data.data;
};

export const uploadAsset = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axios.post<{ success: boolean; data: UploadAssetResult; error?: string }>(
    apiUrl('/assets/upload'),
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );

  if (!res.data.success) {
    throw new Error(res.data.error || '图片上传失败');
  }

  return res.data.data.relativePath;
};
