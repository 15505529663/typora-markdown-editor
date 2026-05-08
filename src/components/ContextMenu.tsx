import React, { useEffect, useRef } from 'react';
import { CommandId } from '../lib/editorCommands';
import { SavedSelection } from '../lib/executeCommand';

interface ContextMenuProps {
  x: number;
  y: number;
  selection: SavedSelection;
  onClose: () => void;
  onCommand: (id: CommandId, selection?: SavedSelection) => void;
}

interface ContextMenuItem {
  id: CommandId;
  label: string;
  shortcut?: string;
}

const groups: Array<{ name: string; items: ContextMenuItem[] }> = [
  {
    name: '基础格式',
    items: [
      { id: 'bold', label: '加粗', shortcut: 'Ctrl+B' },
      { id: 'italic', label: '斜体', shortcut: 'Ctrl+I' },
      { id: 'underline', label: '下划线', shortcut: 'Ctrl+U' },
      { id: 'strike', label: '删除线', shortcut: 'Alt+Shift+5' },
      { id: 'inlineCode', label: '行内代码', shortcut: 'Ctrl+Shift+`' },
      { id: 'clearFormat', label: '清除格式', shortcut: 'Ctrl+\\' },
    ],
  },
  {
    name: '段落和标题',
    items: [
      { id: 'paragraph', label: '段落', shortcut: 'Ctrl+0' },
      { id: 'h1', label: '一级标题', shortcut: 'Ctrl+1' },
      { id: 'h2', label: '二级标题', shortcut: 'Ctrl+2' },
      { id: 'h3', label: '三级标题', shortcut: 'Ctrl+3' },
      { id: 'h4', label: '四级标题', shortcut: 'Ctrl+4' },
      { id: 'h5', label: '五级标题', shortcut: 'Ctrl+5' },
      { id: 'h6', label: '六级标题', shortcut: 'Ctrl+6' },
    ],
  },
  {
    name: '块级元素',
    items: [
      { id: 'quote', label: '引用', shortcut: 'Ctrl+Shift+Q' },
      { id: 'codeBlock', label: '代码块', shortcut: 'Ctrl+Shift+K' },
      { id: 'mathBlock', label: '数学块', shortcut: 'Ctrl+Shift+M' },
      { id: 'orderedList', label: '有序列表', shortcut: 'Ctrl+Shift+[' },
      { id: 'unorderedList', label: '无序列表', shortcut: 'Ctrl+Shift+]' },
      { id: 'taskList', label: '任务列表' },
      { id: 'doneTask', label: '已完成任务' },
      { id: 'table', label: '表格', shortcut: 'Ctrl+T' },
      { id: 'divider', label: '分割线' },
    ],
  },
  {
    name: '插入',
    items: [
      { id: 'insertLink', label: '插入链接', shortcut: 'Ctrl+K' },
      { id: 'image', label: '插入图片', shortcut: 'Ctrl+Shift+I' },
      { id: 'table', label: '插入表格', shortcut: 'Ctrl+T' },
      { id: 'codeBlock', label: '插入代码块', shortcut: 'Ctrl+Shift+K' },
    ],
  },
  {
    name: '编辑',
    items: [
      { id: 'copy', label: '复制', shortcut: 'Ctrl+C' },
      { id: 'cut', label: '剪切', shortcut: 'Ctrl+X' },
      { id: 'paste', label: '粘贴', shortcut: 'Ctrl+V' },
      { id: 'selectAll', label: '全选', shortcut: 'Ctrl+A' },
      { id: 'selectLine', label: '选择当前行', shortcut: 'Ctrl+L' },
      { id: 'selectWord', label: '选择当前单词', shortcut: 'Ctrl+D' },
    ],
  },
];

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, selection, onClose, onCommand }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 240);
  const adjustedY = Math.min(y, window.innerHeight - 520);

  return (
    <div
      ref={menuRef}
      className="editor-context-menu fixed z-[9500] min-w-[228px] max-h-[min(520px,calc(100vh-20px))] overflow-y-auto rounded-md border border-gray-200 bg-white/95 py-1 shadow-2xl backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95 select-none"
      style={{ left: adjustedX, top: Math.max(10, adjustedY) }}
    >
      {groups.map((group, index) => (
        <React.Fragment key={group.name}>
          {index > 0 && <div className="my-1 mx-2 border-t border-gray-100 dark:border-gray-700" />}
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            {group.name}
          </div>
          {group.items.map((cmd) => (
            <button
              key={`${group.name}-${cmd.id}`}
              className="editor-context-menu-item flex w-full items-center justify-between px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-blue-500/15 dark:hover:text-blue-200"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onCommand(cmd.id, selection);
                onClose();
              }}
            >
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <span className="ml-4 font-mono text-[10px] text-gray-400 dark:text-gray-500">
                  {cmd.shortcut}
                </span>
              )}
            </button>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ContextMenu;
