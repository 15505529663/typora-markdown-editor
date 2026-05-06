import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CommandId } from '../lib/editorCommands';

type MenuAction =
  | { type: 'command'; id: CommandId; label: string; shortcut?: string }
  | { type: 'custom'; action: string; label: string; shortcut?: string }
  | { type: 'separator' };

interface MenuGroup {
  title: string;
  items: MenuAction[];
}

interface TopMenuBarProps {
  onCommand: (id: CommandId) => void;
  onImport: () => void;
  onExport: () => void;
  onThemeChange: (mode: 'light' | 'dark' | 'system') => void;
  onShowWelcome: () => void;
  onInfo: (message: string) => void;
  isDarkMode: boolean;
}

const menus: MenuGroup[] = [
  {
    title: '文件(F)',
    items: [
      { type: 'command', id: 'newFile', label: '新建笔记', shortcut: 'Ctrl+N' },
      { type: 'command', id: 'openFile', label: '打开文件', shortcut: 'Ctrl+O' },
      { type: 'command', id: 'quickOpen', label: '快速打开', shortcut: 'Ctrl+P' },
      { type: 'separator' },
      { type: 'command', id: 'save', label: '保存', shortcut: 'Ctrl+S' },
      { type: 'command', id: 'saveAs', label: '另存为...', shortcut: 'Ctrl+Shift+S' },
      { type: 'separator' },
      { type: 'command', id: 'exportMarkdown', label: '导出为 Markdown' },
      { type: 'command', id: 'exportText', label: '导出为纯文本' },
      { type: 'command', id: 'exportHtml', label: '导出为 HTML' },
      { type: 'command', id: 'exportPdf', label: '导出为 PDF', shortcut: 'Ctrl+Shift+P' },
      { type: 'separator' },
      { type: 'command', id: 'importFile', label: '导入文档' },
      { type: 'separator' },
      { type: 'command', id: 'closeFile', label: '关闭文件', shortcut: 'Ctrl+W' },
      { type: 'command', id: 'settings', label: '设置', shortcut: 'Ctrl+,' },
    ],
  },
  {
    title: '编辑(E)',
    items: [
      { type: 'command', id: 'undo', label: '撤销', shortcut: 'Ctrl+Z' },
      { type: 'command', id: 'redo', label: '重做', shortcut: 'Ctrl+Y' },
      { type: 'separator' },
      { type: 'command', id: 'cut', label: '剪切', shortcut: 'Ctrl+X' },
      { type: 'command', id: 'copy', label: '复制', shortcut: 'Ctrl+C' },
      { type: 'command', id: 'paste', label: '粘贴', shortcut: 'Ctrl+V' },
      { type: 'separator' },
      { type: 'command', id: 'selectAll', label: '全选', shortcut: 'Ctrl+A' },
      { type: 'command', id: 'selectLine', label: '选择当前行', shortcut: 'Ctrl+L' },
      { type: 'command', id: 'selectWord', label: '选择当前单词', shortcut: 'Ctrl+D' },
      { type: 'separator' },
      { type: 'command', id: 'find', label: '查找', shortcut: 'Ctrl+F' },
      { type: 'command', id: 'replace', label: '替换', shortcut: 'Ctrl+H' },
    ],
  },
  {
    title: '段落(P)',
    items: [
      { type: 'command', id: 'paragraph', label: '段落', shortcut: 'Ctrl+0' },
      { type: 'command', id: 'h1', label: '一级标题', shortcut: 'Ctrl+1' },
      { type: 'command', id: 'h2', label: '二级标题', shortcut: 'Ctrl+2' },
      { type: 'command', id: 'h3', label: '三级标题', shortcut: 'Ctrl+3' },
      { type: 'command', id: 'h4', label: '四级标题', shortcut: 'Ctrl+4' },
      { type: 'command', id: 'h5', label: '五级标题', shortcut: 'Ctrl+5' },
      { type: 'command', id: 'h6', label: '六级标题', shortcut: 'Ctrl+6' },
      { type: 'separator' },
      { type: 'command', id: 'quote', label: '引用', shortcut: 'Ctrl+Shift+Q' },
      { type: 'command', id: 'orderedList', label: '有序列表', shortcut: 'Ctrl+Shift+[' },
      { type: 'command', id: 'unorderedList', label: '无序列表', shortcut: 'Ctrl+Shift+]' },
      { type: 'command', id: 'taskList', label: '任务列表' },
      { type: 'command', id: 'doneTask', label: '已完成任务' },
      { type: 'separator' },
      { type: 'command', id: 'codeBlock', label: '代码块', shortcut: 'Ctrl+Shift+K' },
      { type: 'command', id: 'mathBlock', label: '数学块', shortcut: 'Ctrl+Shift+M' },
      { type: 'command', id: 'table', label: '表格', shortcut: 'Ctrl+T' },
      { type: 'command', id: 'divider', label: '分割线' },
    ],
  },
  {
    title: '格式(O)',
    items: [
      { type: 'command', id: 'bold', label: '加粗', shortcut: 'Ctrl+B' },
      { type: 'command', id: 'italic', label: '斜体', shortcut: 'Ctrl+I' },
      { type: 'command', id: 'underline', label: '下划线', shortcut: 'Ctrl+U' },
      { type: 'command', id: 'strike', label: '删除线', shortcut: 'Alt+Shift+5' },
      { type: 'command', id: 'inlineCode', label: '行内代码', shortcut: 'Ctrl+Shift+`' },
      { type: 'separator' },
      { type: 'command', id: 'link', label: '插入链接', shortcut: 'Ctrl+K' },
      { type: 'command', id: 'image', label: '插入图片', shortcut: 'Ctrl+Shift+I' },
      { type: 'separator' },
      { type: 'command', id: 'clearFormat', label: '清除格式', shortcut: 'Ctrl+\\' },
    ],
  },
  {
    title: '视图(V)',
    items: [
      { type: 'command', id: 'toggleSidebar', label: '显示/隐藏文件面板', shortcut: 'Ctrl+Shift+L' },
      { type: 'command', id: 'outlineView', label: '显示/隐藏大纲面板', shortcut: 'Ctrl+Shift+1' },
      { type: 'separator' },
      { type: 'command', id: 'focusMode', label: '聚焦模式', shortcut: 'F8' },
      { type: 'command', id: 'fullScreen', label: '全屏', shortcut: 'F11' },
      { type: 'custom', action: 'status', label: '显示状态栏' },
    ],
  },
  {
    title: '主题(T)',
    items: [
      { type: 'custom', action: 'theme-light', label: '浅色模式' },
      { type: 'custom', action: 'theme-dark', label: '深色模式' },
      { type: 'custom', action: 'theme-system', label: '跟随系统' },
    ],
  },
  {
    title: '帮助(H)',
    items: [
      { type: 'custom', action: 'shortcuts', label: '快捷键说明' },
      { type: 'custom', action: 'welcome', label: '欢迎页' },
      { type: 'custom', action: 'about', label: '关于本应用' },
    ],
  },
];

const TopMenuBar: React.FC<TopMenuBarProps> = ({
  onCommand,
  onImport,
  onExport,
  onThemeChange,
  onShowWelcome,
  onInfo,
  isDarkMode,
}) => {
  const [activeMenu, setActiveMenu] = useState<MenuGroup | null>(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const openMenu = (menu: MenuGroup, trigger: HTMLElement) => {
    const rect = trigger.getBoundingClientRect();
    setMenuPosition({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 250)),
      top: rect.bottom + 6,
    });
    setActiveMenu(menu);
  };

  useEffect(() => {
    if (!activeMenu) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setActiveMenu(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setActiveMenu(null);
      }
    };
    const handleResize = () => setActiveMenu(null);

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [activeMenu]);

  const runCustomAction = (action: string) => {
    if (action === 'import') onImport();
    else if (action === 'export') onExport();
    else if (action === 'theme-light') onThemeChange('light');
    else if (action === 'theme-dark') onThemeChange('dark');
    else if (action === 'theme-system') onThemeChange('system');
    else if (action === 'welcome') onShowWelcome();
    else if (action === 'shortcuts') onInfo('常用快捷键：Ctrl+S 保存，Ctrl+B 加粗，Ctrl+Shift+K 代码块，Ctrl+Shift+E 导出。');
    else if (action === 'about') onInfo('MarkEdit：一个本地优先的 Markdown 写作编辑器。');
    else if (action === 'status') onInfo('状态栏已固定显示在底部。');
  };

  const handleItemClick = (item: MenuAction) => {
    if (item.type === 'command') {
      onCommand(item.id);
    } else if (item.type === 'custom') {
      runCustomAction(item.action);
    }
    setActiveMenu(null);
  };

  const dropdown = activeMenu ? (
    <div
      ref={dropdownRef}
      className="top-menu-dropdown"
      style={{
        left: menuPosition.left,
        top: menuPosition.top,
      }}
      role="menu"
    >
      {activeMenu.items.map((item, index) => {
        if (item.type === 'separator') {
          return <div key={`${activeMenu.title}-sep-${index}`} className="top-menu-separator" />;
        }

        const checked =
          (item.type === 'custom' && item.action === 'theme-dark' && isDarkMode) ||
          (item.type === 'custom' && item.action === 'theme-light' && !isDarkMode);

        return (
          <button
            key={`${activeMenu.title}-${item.label}-${index}`}
            type="button"
            className="top-menu-item"
            role="menuitem"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => handleItemClick(item)}
          >
            <span className="top-menu-check">{checked ? '✓' : ''}</span>
            <span className="top-menu-label">{item.label}</span>
            {item.shortcut && <span className="top-menu-shortcut">{item.shortcut}</span>}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div ref={rootRef} className="top-menu-bar flex items-center gap-0.5">
      {menus.map((menu) => {
        const isActive = activeMenu?.title === menu.title;
        return (
          <button
            key={menu.title}
            type="button"
            className={`top-menu-trigger ${isActive ? 'is-active' : ''}`}
            onClick={(event) => {
              if (isActive) setActiveMenu(null);
              else openMenu(menu, event.currentTarget);
            }}
            onMouseEnter={(event) => {
              if (activeMenu) openMenu(menu, event.currentTarget);
            }}
          >
            {menu.title}
          </button>
        );
      })}
      {dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
};

export default TopMenuBar;
