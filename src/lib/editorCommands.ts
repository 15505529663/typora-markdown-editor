export type CommandId =
  | 'newFile' | 'newWindow' | 'openFile' | 'quickOpen' | 'reopenClosed' | 'save' | 'saveAs' 
  | 'exportMarkdown' | 'exportText' | 'exportHtml' | 'exportPdf' | 'export' | 'importFile' | 'settings' | 'closeFile'
  | 'copy' | 'cut' | 'paste' | 'copyAsMarkdown' | 'pasteAsPlainText' | 'selectAll' | 'selectLine' | 'selectStyle' | 'selectWord' | 'deleteWord'
  | 'undo' | 'redo'
  | 'jumpTop' | 'jumpBottom' | 'jumpSelection' | 'find' | 'findNext' | 'findPrev' | 'replace'
  | 'paragraph' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'headingUp' | 'headingDown'
  | 'table' | 'codeBlock' | 'mathBlock' | 'quote' | 'orderedList' | 'unorderedList' | 'taskList' | 'doneTask'
  | 'divider' | 'indent' | 'outdent'
  | 'bold' | 'italic' | 'underline' | 'strike' | 'inlineCode' | 'insertLink' | 'link' | 'image' | 'clearFormat'
  | 'toggleSidebar' | 'outlineView' | 'articleView' | 'fileTreeView' | 'toggleSourceMode' | 'focusMode' | 'typewriterMode' | 'fullScreen'
  | 'zoomActual' | 'zoomIn' | 'zoomOut' | 'switchDoc';

export interface EditorCommand {
  id: CommandId;
  label: string;
  group: 'file' | 'edit' | 'paragraph' | 'format' | 'view';
  shortcut?: string;
  action: string;
}

export const editorCommands: EditorCommand[] = [
  { id: 'newFile', label: '新建笔记', group: 'file', shortcut: 'Ctrl+N', action: 'newFile' },
  { id: 'newWindow', label: '新建窗口', group: 'file', shortcut: 'Ctrl+Shift+N', action: 'newWindow' },
  { id: 'openFile', label: '打开文件', group: 'file', shortcut: 'Ctrl+O', action: 'openFile' },
  { id: 'quickOpen', label: '快速打开', group: 'file', shortcut: 'Ctrl+P', action: 'quickOpen' },
  { id: 'save', label: '保存', group: 'file', shortcut: 'Ctrl+S', action: 'save' },
  { id: 'saveAs', label: '另存为...', group: 'file', shortcut: 'Ctrl+Shift+S', action: 'saveAs' },
  { id: 'exportMarkdown', label: '导出为 Markdown', group: 'file', action: 'exportMarkdown' },
  { id: 'exportText', label: '导出为纯文本', group: 'file', action: 'exportText' },
  { id: 'exportHtml', label: '导出为 HTML', group: 'file', action: 'exportHtml' },
  { id: 'exportPdf', label: '导出为 PDF', group: 'file', shortcut: 'Ctrl+Shift+P', action: 'exportPdf' },
  { id: 'importFile', label: '导入文档', group: 'file', action: 'importFile' },
  { id: 'settings', label: '设置', group: 'file', shortcut: 'Ctrl+,', action: 'settings' },
  { id: 'closeFile', label: '关闭文件', group: 'file', shortcut: 'Ctrl+W', action: 'closeFile' },

  { id: 'copy', label: '复制', group: 'edit', shortcut: 'Ctrl+C', action: 'copy' },
  { id: 'cut', label: '剪切', group: 'edit', shortcut: 'Ctrl+X', action: 'cut' },
  { id: 'paste', label: '粘贴', group: 'edit', shortcut: 'Ctrl+V', action: 'paste' },
  { id: 'copyAsMarkdown', label: '复制为 Markdown', group: 'edit', shortcut: 'Ctrl+Shift+C', action: 'copyAsMarkdown' },
  { id: 'pasteAsPlainText', label: '粘贴为纯文本', group: 'edit', shortcut: 'Ctrl+Shift+V', action: 'pasteAsPlainText' },
  { id: 'selectAll', label: '全选', group: 'edit', shortcut: 'Ctrl+A', action: 'selectAll' },
  { id: 'selectLine', label: '选择当前行', group: 'edit', shortcut: 'Ctrl+L', action: 'selectLine' },
  { id: 'selectWord', label: '选择当前单词', group: 'edit', shortcut: 'Ctrl+D', action: 'selectWord' },
  { id: 'deleteWord', label: '删除当前单词', group: 'edit', shortcut: 'Ctrl+Shift+D', action: 'deleteWord' },
  { id: 'undo', label: '撤销', group: 'edit', shortcut: 'Ctrl+Z', action: 'undo' },
  { id: 'redo', label: '重做', group: 'edit', shortcut: 'Ctrl+Y', action: 'redo' },
  { id: 'jumpTop', label: '跳到文档开头', group: 'edit', shortcut: 'Ctrl+Home', action: 'jumpTop' },
  { id: 'jumpBottom', label: '跳到文档结尾', group: 'edit', shortcut: 'Ctrl+End', action: 'jumpBottom' },
  { id: 'jumpSelection', label: '跳到选区', group: 'edit', shortcut: 'Ctrl+J', action: 'jumpSelection' },
  { id: 'find', label: '查找', group: 'edit', shortcut: 'Ctrl+F', action: 'find' },
  { id: 'findNext', label: '查找下一个', group: 'edit', shortcut: 'F3', action: 'findNext' },
  { id: 'findPrev', label: '查找上一个', group: 'edit', shortcut: 'Shift+F3', action: 'findPrev' },
  { id: 'replace', label: '替换', group: 'edit', shortcut: 'Ctrl+H', action: 'replace' },

  { id: 'paragraph', label: '段落', group: 'paragraph', shortcut: 'Ctrl+0', action: 'paragraph' },
  { id: 'h1', label: '一级标题', group: 'paragraph', shortcut: 'Ctrl+1', action: 'h1' },
  { id: 'h2', label: '二级标题', group: 'paragraph', shortcut: 'Ctrl+2', action: 'h2' },
  { id: 'h3', label: '三级标题', group: 'paragraph', shortcut: 'Ctrl+3', action: 'h3' },
  { id: 'h4', label: '四级标题', group: 'paragraph', shortcut: 'Ctrl+4', action: 'h4' },
  { id: 'h5', label: '五级标题', group: 'paragraph', shortcut: 'Ctrl+5', action: 'h5' },
  { id: 'h6', label: '六级标题', group: 'paragraph', shortcut: 'Ctrl+6', action: 'h6' },
  { id: 'headingUp', label: '提升标题等级', group: 'paragraph', shortcut: 'Ctrl+=', action: 'headingUp' },
  { id: 'headingDown', label: '降低标题等级', group: 'paragraph', shortcut: 'Ctrl+-', action: 'headingDown' },
  { id: 'quote', label: '引用', group: 'paragraph', shortcut: 'Ctrl+Shift+Q', action: 'quote' },
  { id: 'orderedList', label: '有序列表', group: 'paragraph', shortcut: 'Ctrl+Shift+[', action: 'orderedList' },
  { id: 'unorderedList', label: '无序列表', group: 'paragraph', shortcut: 'Ctrl+Shift+]', action: 'unorderedList' },
  { id: 'taskList', label: '任务列表', group: 'paragraph', action: 'taskList' },
  { id: 'doneTask', label: '已完成任务', group: 'paragraph', action: 'doneTask' },
  { id: 'codeBlock', label: '代码块', group: 'paragraph', shortcut: 'Ctrl+Shift+K', action: 'codeBlock' },
  { id: 'mathBlock', label: '数学块', group: 'paragraph', shortcut: 'Ctrl+Shift+M', action: 'mathBlock' },
  { id: 'table', label: '表格', group: 'paragraph', shortcut: 'Ctrl+T', action: 'table' },
  { id: 'divider', label: '分割线', group: 'paragraph', action: 'divider' },
  { id: 'indent', label: '增加缩进', group: 'paragraph', shortcut: 'Tab', action: 'indent' },
  { id: 'outdent', label: '减少缩进', group: 'paragraph', shortcut: 'Shift+Tab', action: 'outdent' },

  { id: 'bold', label: '加粗', group: 'format', shortcut: 'Ctrl+B', action: 'bold' },
  { id: 'italic', label: '斜体', group: 'format', shortcut: 'Ctrl+I', action: 'italic' },
  { id: 'underline', label: '下划线', group: 'format', shortcut: 'Ctrl+U', action: 'underline' },
  { id: 'strike', label: '删除线', group: 'format', shortcut: 'Alt+Shift+5', action: 'strike' },
  { id: 'inlineCode', label: '行内代码', group: 'format', shortcut: 'Ctrl+Shift+`', action: 'inlineCode' },
  { id: 'insertLink', label: '插入链接', group: 'format', shortcut: 'Ctrl+K', action: 'insertLink' },
  { id: 'image', label: '插入图片', group: 'format', shortcut: 'Ctrl+Shift+I', action: 'image' },
  { id: 'clearFormat', label: '清除格式', group: 'format', shortcut: 'Ctrl+\\', action: 'clearFormat' },

  { id: 'toggleSidebar', label: '显示/隐藏侧边栏', group: 'view', shortcut: 'Ctrl+Shift+L', action: 'toggleSidebar' },
  { id: 'outlineView', label: '大纲视图', group: 'view', shortcut: 'Ctrl+Shift+1', action: 'outlineView' },
  { id: 'articleView', label: '文章视图', group: 'view', shortcut: 'Ctrl+Shift+2', action: 'articleView' },
  { id: 'fileTreeView', label: '文件视图', group: 'view', shortcut: 'Ctrl+Shift+3', action: 'fileTreeView' },
  { id: 'toggleSourceMode', label: '源码模式', group: 'view', shortcut: 'Ctrl+/', action: 'toggleSourceMode' },
  { id: 'focusMode', label: '专注模式', group: 'view', shortcut: 'F8', action: 'focusMode' },
  { id: 'typewriterMode', label: '打字机模式', group: 'view', shortcut: 'F9', action: 'typewriterMode' },
  { id: 'fullScreen', label: '全屏', group: 'view', shortcut: 'F11', action: 'fullScreen' },
  { id: 'zoomActual', label: '实际大小', group: 'view', shortcut: 'Ctrl+Shift+0', action: 'zoomActual' },
  { id: 'zoomIn', label: '放大', group: 'view', shortcut: 'Ctrl+Shift+=', action: 'zoomIn' },
  { id: 'zoomOut', label: '缩小', group: 'view', shortcut: 'Ctrl+Shift+-', action: 'zoomOut' },
  { id: 'switchDoc', label: '切换文档', group: 'view', shortcut: 'Ctrl+Tab', action: 'switchDoc' },
];
