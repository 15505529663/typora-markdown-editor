import React from 'react';
import { FileText, Clock, Hash, AlignLeft } from 'lucide-react';

interface StatusBarProps {
  filename: string | null;
  isSaved: boolean;
  content: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ filename, isSaved, content }) => {
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const lineCount = content.split('\n').length;

  return (
    <div className="status-bar h-6 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 text-[11px] text-gray-500 dark:text-gray-400 select-none">
      <div className="flex items-center space-x-4 truncate">
        <div className="flex items-center space-x-1 truncate">
          <FileText size={12} />
          <span className="truncate">{filename || 'No file selected'}</span>
        </div>
        {!isSaved && (
          <div className="save-state-unsaved flex items-center space-x-1 text-amber-600 dark:text-amber-500 font-bold">
            <Clock size={12} />
            <span>Unsaved changes</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <Hash size={12} />
          <span>{wordCount} words / {charCount} chars</span>
        </div>
        <div className="flex items-center space-x-1">
          <AlignLeft size={12} />
          <span>{lineCount} lines</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
