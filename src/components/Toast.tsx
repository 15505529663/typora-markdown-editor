import React from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: ToastMessage | null;
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: TriangleAlert,
};

const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast) return null;

  const Icon = icons[toast.type];

  return (
    <div className={`app-toast app-toast-${toast.type}`} role="status" aria-live="polite">
      <Icon size={17} />
      <span>{toast.message}</span>
    </div>
  );
};

export default Toast;
