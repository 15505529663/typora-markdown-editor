import React, { useState } from 'react';
import { FileInfo } from '../types';
import { Edit2, FileText, FolderOpen, List, Plus, Trash2, Upload } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import DocumentOutline from './DocumentOutline';
import { OutlineItem } from '../lib/outline';
import { safeGetStorageItem, safeSetStorageItem } from '../lib/storage';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  files: FileInfo[];
  selectedFile: string | null;
  onSelect: (filename: string) => void;
  onCreate: () => void;
  onImport: () => void;
  isImporting: boolean;
  onDelete: (filename: string) => void;
  onRename: (filename: string) => void;
  outline: OutlineItem[];
  currentLine: number;
  onOutlineItemClick: (item: OutlineItem) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  files,
  selectedFile,
  onSelect,
  onCreate,
  onImport,
  isImporting,
  onDelete,
  onRename,
  outline,
  currentLine,
  onOutlineItemClick,
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'outline'>(() => {
    const saved = safeGetStorageItem(localStorage, 'sidebar_active_tab');
    return saved === 'outline' ? 'outline' : 'files';
  });

  const handleTabChange = (tab: 'files' | 'outline') => {
    setActiveTab(tab);
    safeSetStorageItem(localStorage, 'sidebar_active_tab', tab);
  };

  return (
    <div className="app-sidebar flex flex-col bg-gray-50 dark:bg-gray-800 h-full w-full overflow-hidden">
      <div className="sidebar-tabs flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <button
          type="button"
          onClick={() => handleTabChange('files')}
          className={cn(
            'sidebar-tab flex-1 flex items-center justify-center space-x-2 py-3 text-xs font-bold transition-colors border-b-2',
            activeTab === 'files'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          )}
        >
          <FolderOpen size={14} />
          <span>文件</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('outline')}
          className={cn(
            'sidebar-tab flex-1 flex items-center justify-center space-x-2 py-3 text-xs font-bold transition-colors border-b-2',
            activeTab === 'outline'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          )}
        >
          <List size={14} />
          <span>大纲</span>
        </button>
      </div>

      {activeTab === 'files' ? (
        <>
          <div className="sidebar-section-head p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white/50 dark:bg-gray-900/50">
            <div className="text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider">
              我的笔记
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onImport}
                disabled={isImporting}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-blue-600 dark:text-blue-400 disabled:cursor-wait disabled:opacity-60"
                title="导入文档"
              >
                <Upload size={18} />
              </button>
              <button
                type="button"
                onClick={onCreate}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-blue-600 dark:text-blue-400"
                title="新建笔记 (Ctrl+N)"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className="sidebar-panel flex-1 overflow-y-auto p-2 space-y-1">
            {files.length === 0 ? (
              <div className="text-center text-sm text-gray-400 mt-10">
                暂无文件
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.name}
                  className={cn(
                    'sidebar-file-item group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors text-sm',
                    selectedFile === file.name
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                  )}
                  onClick={() => onSelect(file.name)}
                >
                  <div className="flex items-center space-x-2 truncate flex-1 min-w-0">
                    <FileText size={16} className="flex-shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRename(file.name);
                      }}
                      className="p-1 hover:text-blue-500"
                      title="重命名"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(file.name);
                      }}
                      className="p-1 hover:text-red-500"
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <DocumentOutline
          outline={outline}
          currentLine={currentLine}
          onItemClick={onOutlineItemClick}
        />
      )}
    </div>
  );
};

export default Sidebar;
