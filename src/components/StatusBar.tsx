import React from 'react';
import { FileText, Clock, Hash, AlignLeft } from 'lucide-react';
import { formatSaveTime, SaveStatus } from '../lib/autoSave';

interface StatusBarProps {
  filename: string | null;
  isSaved: boolean;
  content: string;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
}

const statusText: Record<SaveStatus, string> = {
  saved: '已保存',
  unsaved: '未保存',
  autoSaving: '正在自动保存...',
  autoSaved: '已自动保存',
  autoSaveFailed: '自动保存失败',
  draftSaved: '草稿已保存',
};

const StatusBar: React.FC<StatusBarProps> = ({ filename, isSaved, content, saveStatus, lastSavedAt }) => {
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const lineCount = content.split('\n').length;
  const effectiveStatus = isSaved && saveStatus === 'unsaved' ? 'saved' : saveStatus;
  const isWarning = effectiveStatus === 'unsaved' || effectiveStatus === 'draftSaved';
  const isError = effectiveStatus === 'autoSaveFailed';
  const saveTime = formatSaveTime(lastSavedAt);

  return (
    <div className="status-bar h-6 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 text-[11px] text-gray-500 dark:text-gray-400 select-none">
      <div className="flex items-center space-x-4 truncate">
        <div className="flex items-center space-x-1 truncate">
          <FileText size={12} />
          <span className="truncate">{filename || '未选择文件'}</span>
        </div>
        <div
          className={`auto-save-state flex items-center space-x-1 font-bold ${
            isError
              ? 'text-red-600 dark:text-red-400'
              : isWarning
                ? 'text-amber-600 dark:text-amber-500'
                : 'text-emerald-600 dark:text-emerald-400'
          }`}
          title={saveTime ? `上次保存：${saveTime}` : '尚未保存'}
        >
          <Clock size={12} />
          <span>{statusText[effectiveStatus]}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <Hash size={12} />
          <span>{wordCount} 词 / {charCount} 字符</span>
        </div>
        <div className="flex items-center space-x-1">
          <AlignLeft size={12} />
          <span>{lineCount} 行</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
