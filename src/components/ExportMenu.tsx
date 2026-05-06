import React, { useEffect, useRef, useState } from 'react';
import { Download, FileCode2, FileText, FileType, FileWarning, Loader2 } from 'lucide-react';

export type ExportFormat = 'md' | 'txt' | 'html' | 'pdf' | 'docx';

interface ExportMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: ExportFormat) => void | Promise<void>;
  disabled?: boolean;
}

const exportItems = [
  { format: 'md' as const, label: '导出为 Markdown (.md)', icon: FileText, disabled: false },
  { format: 'txt' as const, label: '导出为纯文本 (.txt)', icon: FileType, disabled: false },
  { format: 'html' as const, label: '导出为 HTML (.html)', icon: FileCode2, disabled: false },
  { format: 'pdf' as const, label: '导出为 PDF (.pdf)', icon: FileType, disabled: false },
  { format: 'docx' as const, label: '导出为 Word (.docx)', icon: FileWarning, disabled: true },
];

const ExportMenu: React.FC<ExportMenuProps> = ({ isOpen, onOpenChange, onExport, disabled = false }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onOpenChange]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onOpenChange(!isOpen)}
        className="app-action-button inline-flex items-center gap-1.5 px-2.5 py-2 text-sm rounded-md text-blue-600 dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        title="导出当前文档"
      >
        <Download size={18} />
        <span className="hidden sm:inline">导出</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-2xl dark:border-gray-700 dark:bg-gray-800 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-bottom dark:border-gray-700 dark:text-gray-400 uppercase tracking-wider">
            导出当前文档
          </div>
          {exportItems.map((item) => {
            const Icon = item.icon;
            const isExporting = exportingFormat === item.format;
            return (
              <button
                key={item.format}
                type="button"
                disabled={item.disabled || isExporting}
                onMouseDown={(event) => event.preventDefault()}
                onClick={async () => {
                  if (item.disabled || isExporting) return;
                  setExportingFormat(item.format);
                  try {
                    await onExport(item.format);
                    onOpenChange(false);
                  } finally {
                    setExportingFormat(null);
                  }
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-blue-500 hover:text-white disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent disabled:hover:text-gray-400 dark:text-gray-200 dark:hover:bg-blue-600 dark:disabled:text-gray-500"
              >
                {isExporting ? (
                  <Loader2 size={16} className="animate-spin text-blue-500 group-hover:text-white" />
                ) : (
                  <Icon size={16} className={item.disabled ? 'opacity-40' : ''} />
                )}
                <div className="flex flex-col">
                  <span>{item.label}</span>
                  {item.disabled && <span className="text-[10px] opacity-60">暂未实现</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
