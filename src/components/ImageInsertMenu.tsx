import React, { useEffect, useRef, useState } from 'react';
import { ImageIcon, Link2, Upload } from 'lucide-react';

interface ImageInsertMenuProps {
  onChooseFile: (file: File) => void | Promise<void>;
  onInsertUrl: (url: string, altText: string) => void;
  disabled?: boolean;
}

const ImageInsertMenu: React.FC<ImageInsertMenuProps> = ({ onChooseFile, onInsertUrl, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setIsUploading(true);
      await onChooseFile(file);
      setIsOpen(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlInsert = () => {
    const url = prompt('请输入图片 URL');
    if (!url || !url.trim()) return;
    const altText = prompt('请输入图片描述', '图片描述') || '图片描述';
    onInsertUrl(url.trim(), altText);
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        disabled={disabled || isUploading}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setIsOpen((open) => !open)}
        className="toolbar-icon-button h-8 w-8 inline-flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400 disabled:cursor-wait disabled:opacity-60 flex-shrink-0"
        title="插入图片"
        aria-label="插入图片"
      >
        <ImageIcon size={18} />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
          <button
            type="button"
            disabled={isUploading}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-blue-500 hover:text-white disabled:cursor-wait disabled:opacity-60 dark:text-gray-200 dark:hover:bg-blue-600"
          >
            <Upload size={16} />
            <span>{isUploading ? '上传中...' : '选择本地图片'}</span>
          </button>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleUrlInsert}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-blue-500 hover:text-white dark:text-gray-200 dark:hover:bg-blue-600"
          >
            <Link2 size={16} />
            <span>插入图片链接</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageInsertMenu;
