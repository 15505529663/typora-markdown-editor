import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { EditorView } from '@codemirror/view';
import { Home, Moon, Save, Sun, Upload } from 'lucide-react';
import Sidebar from './components/FileSidebar';
import Editor from './components/MarkdownEditor';
import ResizableLayout from './components/ResizableLayout';
import StatusBar from './components/StatusBar';
import ExportMenu, { ExportFormat } from './components/ExportMenu';
import WelcomeScreen from './components/WelcomeScreen';
import Toast, { ToastMessage, ToastType } from './components/Toast';
import TopMenuBar from './components/TopMenuBar';
import ImageInsertMenu from './components/ImageInsertMenu';
import LinkDialog from './components/LinkDialog';
import { FileInfo } from './types';
import { CommandId } from './lib/editorCommands';
import { parseMarkdownOutline, OutlineItem } from './lib/outline';
import { executeEditorCommand, SavedSelection } from './lib/executeCommand';
import { LinkInput, RequestLinkInput } from './lib/markdownActions';
import { getWindowsShortcutCommand } from './lib/shortcuts';
import { apiUrl, getApiErrorMessage, importDocument, uploadAsset as uploadAssetFile } from './lib/api';
import { exportAsHtml, exportAsMarkdown, exportAsPdf, exportAsText } from './lib/export';
import { insertImageAtCursor, isImageFile } from './lib/image';
import { safeGetStorageItem, safeRemoveStorageItem, safeSetStorageItem } from './lib/storage';
import { hasNewerDraft, loadDraft, removeDraft, saveDraft } from './lib/draftStorage';
import { SaveStatus } from './lib/autoSave';
import { loadEditorSettings } from './lib/settings';

// 设置 Axios 默认配置以支持 API Key 认证
const ACCESS_TOKEN = 'markedit_secret_2024';
axios.defaults.headers.common['x-access-token'] = ACCESS_TOKEN;

interface LinkDialogState {
  initialValue: LinkInput;
  mode: 'insert' | 'edit';
  resolve: (value: LinkInput | null) => void;
}

function App() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [currentLine, setCurrentLine] = useState(1);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [linkDialog, setLinkDialog] = useState<LinkDialogState | null>(null);
  const [hasEnteredEditor, setHasEnteredEditor] = useState(() => safeGetStorageItem(sessionStorage, 'hasEnteredEditorThisSession') === 'true');
  const [settings] = useState(() => loadEditorSettings());
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const theme = safeGetStorageItem(localStorage, 'theme');
    return theme === 'dark' ||
      (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const lastSavedContent = useRef('');
  const isSavedRef = useRef(true);
  const isAutoSavingRef = useRef(false);
  const lastBackupAtRef = useRef<Record<string, number>>({});
  const selectedFileRef = useRef<string | null>(null);
  const contentRef = useRef('');
  const editorViewRef = useRef<EditorView | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const draftSaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    selectedFileRef.current = selectedFile;
  }, [selectedFile]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    editorViewRef.current = editorView;
  }, [editorView]);

  useEffect(() => {
    isSavedRef.current = isSaved;
  }, [isSaved]);

  const getLiveEditorView = useCallback(() => {
    const view = editorViewRef.current;
    if (!view || (view as unknown as { destroyed?: boolean }).destroyed) {
      if (view) {
        editorViewRef.current = null;
        setEditorView(null);
      }
      return null;
    }
    return view;
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ id: Date.now(), message, type });
  }, []);

  const requestLinkInput = useCallback<RequestLinkInput>((initialValue, mode) => {
    return new Promise((resolve) => {
      setLinkDialog({ initialValue, mode, resolve });
    });
  }, []);

  const closeLinkDialog = useCallback((value: LinkInput | null) => {
    setLinkDialog((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeoutId = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [toast?.id]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    contentRef.current = newContent;
    const saved = newContent === lastSavedContent.current;
    setIsSaved(saved);
    isSavedRef.current = saved;
    setSaveStatus(saved ? 'saved' : 'unsaved');
    setOutline(parseMarkdownOutline(newContent));

    if (draftSaveTimerRef.current !== null) {
      window.clearTimeout(draftSaveTimerRef.current);
    }

    const filename = selectedFileRef.current;
    if (settings.draftEnabled && filename && !saved) {
      draftSaveTimerRef.current = window.setTimeout(() => {
        saveDraft(filename, contentRef.current);
        setSaveStatus((current) => (current === 'unsaved' ? 'draftSaved' : current));
      }, 1000);
    }
  }, [settings.draftEnabled]);

  const handleFileSelect = useCallback(async (filename: string) => {
    try {
      if (selectedFileRef.current && selectedFileRef.current !== filename && !isSavedRef.current) {
        if (settings.draftEnabled) {
          saveDraft(selectedFileRef.current, getLiveEditorView()?.state.doc.toString() ?? contentRef.current);
        }
        const shouldSwitch = window.confirm('当前文件有未保存修改，草稿已保存。是否继续切换文件？');
        if (!shouldSwitch) return;
      }

      document.querySelectorAll('.cm-code-language-menu, .cm-code-insert-language-menu').forEach((node) => node.remove());
      const res = await axios.get(apiUrl(`/files/${encodeURIComponent(filename)}`));
      const fileContent = res.data.content;
      const fileUpdatedAt = res.data.updatedAt;
      let nextContent = fileContent;
      const draft = settings.draftEnabled ? loadDraft(filename) : null;

      if (settings.draftEnabled && settings.draftRestoreEnabled && draft && hasNewerDraft(filename, fileContent, fileUpdatedAt)) {
        const shouldRestore = window.confirm('检测到未恢复的草稿，是否恢复？\n\n确定：恢复草稿\n取消：丢弃草稿');
        if (shouldRestore) {
          nextContent = draft.content;
        } else {
          removeDraft(filename);
        }
      }

      setSelectedFile(filename);
      selectedFileRef.current = filename;
      setContent(nextContent);
      contentRef.current = nextContent;
      lastSavedContent.current = fileContent;
      const saved = nextContent === fileContent;
      setIsSaved(saved);
      isSavedRef.current = saved;
      setSaveStatus(saved ? 'saved' : 'draftSaved');
      setLastSavedAt(fileUpdatedAt ? new Date(fileUpdatedAt) : null);
      setOutline(parseMarkdownOutline(nextContent));
      setCurrentLine(1);
    } catch (err) {
      console.error('Failed to load file', err);
      showToast(getApiErrorMessage(err, '读取文件失败'));
    }
  }, [getLiveEditorView, settings.draftEnabled, settings.draftRestoreEnabled, showToast]);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await axios.get(apiUrl('/files'));
      setFiles(res.data);
      if (res.data.length > 0 && !selectedFileRef.current) {
        await handleFileSelect(res.data[0].name);
      }
    } catch (err) {
      console.error('Failed to fetch files', err);
      showToast(getApiErrorMessage(err, '读取文件列表失败'));
    }
  }, [handleFileSelect, showToast]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      safeSetStorageItem(localStorage, 'theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      safeSetStorageItem(localStorage, 'theme', 'light');
    }
  }, [isDarkMode]);

  const handleOutlineItemClick = useCallback((item: OutlineItem) => {
    const view = getLiveEditorView();
    if (!view) return;
    const target = Math.max(0, Math.min(view.state.doc.length, item.offset));
    view.dispatch({
      selection: { anchor: target },
      scrollIntoView: true,
    });
    view.focus();
  }, [getLiveEditorView]);

  const handleSave = useCallback(async (options: { source?: 'manual' | 'auto'; silent?: boolean } = {}) => {
    const filename = selectedFileRef.current;
    if (!filename) {
      if (!options.silent) showToast('No file selected');
      return false;
    }

    const latestContent = getLiveEditorView()?.state.doc.toString() ?? contentRef.current;
    const now = Date.now();
    const backupAllowed =
      settings.backupEnabled &&
      latestContent !== lastSavedContent.current &&
      (options.source !== 'auto' || now - (lastBackupAtRef.current[filename] ?? 0) > 60000);

    try {
      await axios.post(apiUrl('/files'), {
        name: filename,
        content: latestContent,
        backup: backupAllowed,
        maxBackups: settings.maxBackupsPerFile,
      });
      if (backupAllowed) {
        lastBackupAtRef.current[filename] = now;
      }
      removeDraft(filename);
      lastSavedContent.current = latestContent;
      setContent(latestContent);
      contentRef.current = latestContent;
      setIsSaved(true);
      isSavedRef.current = true;
      setSaveStatus(options.source === 'auto' ? 'autoSaved' : 'saved');
      setLastSavedAt(new Date());
      setOutline(parseMarkdownOutline(latestContent));
      fetchFiles();
      return true;
    } catch (err) {
      console.error('Failed to save file', err);
      setIsSaved(false);
      isSavedRef.current = false;
      setSaveStatus(options.source === 'auto' ? 'autoSaveFailed' : 'unsaved');
      if (!options.silent) showToast(getApiErrorMessage(err, '保存失败'), 'error');
      return false;
    }
  }, [fetchFiles, getLiveEditorView, settings.backupEnabled, settings.maxBackupsPerFile, showToast]);

  const getLatestEditorContent = useCallback(() => {
    return getLiveEditorView()?.state.doc.toString() ?? contentRef.current;
  }, [getLiveEditorView]);

  const handleExport = useCallback(async (format: ExportFormat) => {
    const fileName = selectedFileRef.current || 'untitled.md';
    const latestContent = getLatestEditorContent();

    try {
      if (format === 'md') {
        exportAsMarkdown(fileName, latestContent);
      } else if (format === 'txt') {
        exportAsText(fileName, latestContent);
      } else if (format === 'html') {
        exportAsHtml(fileName, latestContent);
      } else if (format === 'pdf') {
        showToast('正在生成 PDF...', 'info');
        await exportAsPdf(fileName, latestContent);
        showToast('PDF 导出成功', 'info');
        return;
      } else {
        showToast('该导出格式暂未实现');
        return;
      }
      showToast('导出成功');
    } catch (err) {
      console.error('Export failed', err);
      showToast(err instanceof Error ? `导出失败: ${err.message}` : '导出失败', 'error');
    }
  }, [getLatestEditorContent, showToast]);

  const handleEnterEditor = useCallback(() => {
    safeSetStorageItem(sessionStorage, 'hasEnteredEditorThisSession', 'true');
    safeRemoveStorageItem(localStorage, 'hasEnteredEditor');
    setHasEnteredEditor(true);
  }, []);

  const handleBackToWelcome = useCallback(() => {
    safeRemoveStorageItem(sessionStorage, 'hasEnteredEditorThisSession');
    safeRemoveStorageItem(localStorage, 'hasEnteredEditor');
    setHasEnteredEditor(false);
  }, []);

  const handleThemeChange = useCallback((mode: 'light' | 'dark' | 'system') => {
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      showToast('已切换为跟随系统主题');
      return;
    }

    setIsDarkMode(mode === 'dark');
    showToast(mode === 'dark' ? '已切换为深色模式' : '已切换为浅色模式');
  }, [showToast]);

  const handleInsertImageUrl = useCallback((url: string, altText: string) => {
    const view = getLiveEditorView();
    if (!view) {
      showToast('编辑器尚未准备好');
      return;
    }

    const latestContent = insertImageAtCursor(view, url, altText);
    handleContentChange(latestContent);
  }, [getLiveEditorView, handleContentChange, showToast]);

  const handleChooseImageFile = useCallback(async (file: File) => {
    const view = getLiveEditorView();
    if (!view) {
      showToast('编辑器尚未准备好');
      return;
    }

    if (!isImageFile(file)) {
      showToast('仅支持 PNG、JPG、GIF、WebP 图片');
      return;
    }

    try {
      showToast('图片上传中...');
      const relativePath = await uploadAssetFile(file);
      const altText = file.name.replace(/\.[^/.]+$/, '') || '图片描述';
      const latestContent = insertImageAtCursor(view, relativePath, altText);
      handleContentChange(latestContent);
      showToast('图片已插入');
    } catch (error) {
      showToast(getApiErrorMessage(error, '图片上传失败'));
    }
  }, [getLiveEditorView, handleContentChange, showToast]);

  const handleCreateFile = useCallback(async () => {
    const name = prompt('请输入笔记名称，例如 test 或 test.md：');
    if (name === null) return;
    if (!name.trim()) {
      showToast('文件名不能为空');
      return;
    }
    if (/[\\/:*?"<>|]/.test(name) || name.includes('..')) {
      showToast('文件名不能包含 / \\ : * ? " < > | 或 ..');
      return;
    }

    const finalName = name.toLowerCase().endsWith('.md') ? name : `${name}.md`;
    const title = finalName.replace(/\.md$/i, '');
    const initialContent = `# ${title}\n`;

    try {
      const res = await axios.post(apiUrl('/files'), { name: finalName, content: initialContent, create: true });
      const createdName = res.data?.data?.fileName || finalName;
      await fetchFiles();
      await handleFileSelect(createdName);
      showToast('新建成功');
    } catch (err) {
      console.error('Failed to create file', err);
      showToast(getApiErrorMessage(err, '新建失败'));
    }
  }, [fetchFiles, handleFileSelect, showToast]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFiles = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';
    if (selectedFiles.length === 0) return;

    setIsImporting(true);
    showToast('导入中...');

    let successCount = 0;
    const failures: string[] = [];
    let lastImportedFile: string | null = null;

    for (const file of selectedFiles) {
      try {
        const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
        if (!['.md', '.markdown', '.txt'].includes(extension)) {
          throw new Error('仅支持 .md、.markdown、.txt 文件');
        }

        const text = await file.text();
        const imported = await importDocument(file.name, text);
        successCount += 1;
        lastImportedFile = imported.fileName;
      } catch (err) {
        failures.push(`${file.name}: ${getApiErrorMessage(err, '导入失败')}`);
      }
    }

    setIsImporting(false);
    await fetchFiles();

    if (lastImportedFile) {
      await handleFileSelect(lastImportedFile);
    }

    if (failures.length === 0) {
      showToast(successCount > 1 ? `导入成功：${successCount} 个文件` : '导入成功');
    } else {
      showToast(`导入完成：成功 ${successCount} 个，失败 ${failures.length} 个。${failures[0]}`);
    }
  }, [fetchFiles, handleFileSelect, showToast]);

  const handleDeleteFile = useCallback(async (filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;

    try {
      await axios.delete(apiUrl(`/files/${encodeURIComponent(filename)}`));
      if (selectedFileRef.current === filename) {
        removeDraft(filename);
        setSelectedFile(null);
        selectedFileRef.current = null;
        setContent('');
        contentRef.current = '';
        setOutline([]);
        setIsSaved(true);
        isSavedRef.current = true;
        setSaveStatus('saved');
        setLastSavedAt(null);
      }
      fetchFiles();
    } catch (err) {
      console.error('Failed to delete file', err);
      showToast(getApiErrorMessage(err, '删除失败'));
    }
  }, [fetchFiles, showToast]);

  const handleRenameFile = useCallback(async (oldName: string) => {
    const name = prompt('Enter new filename:', oldName);
    if (!name || name === oldName) return;
    const finalName = name.endsWith('.md') ? name : `${name}.md`;

    try {
      await axios.put(apiUrl(`/files/${encodeURIComponent(oldName)}`), { newName: finalName });
      if (selectedFileRef.current === oldName) {
        setSelectedFile(finalName);
        selectedFileRef.current = finalName;
      }
      fetchFiles();
    } catch (err) {
      console.error('Failed to rename file', err);
      showToast(getApiErrorMessage(err, '重命名失败'));
    }
  }, [fetchFiles, showToast]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }, []);

  const handleCommand = useCallback(async (id: CommandId, selection?: SavedSelection) => {
    // 处理导出相关的特定命令
    if (id === 'exportMarkdown') {
      await handleExport('md');
      return;
    }
    if (id === 'exportText') {
      await handleExport('txt');
      return;
    }
    if (id === 'exportHtml') {
      await handleExport('html');
      return;
    }
    if (id === 'exportPdf') {
      await handleExport('pdf');
      return;
    }

    if (id === 'export' || id === 'saveAs') {
      setIsExportMenuOpen(true);
      return;
    }

    if (id === 'importFile') {
      fileInputRef.current?.click();
      return;
    }

    if (id === 'image') {
      const url = prompt('请输入图片 URL');
      if (url && url.trim()) {
        const altText = prompt('请输入图片描述', '图片描述') || '图片描述';
        handleInsertImageUrl(url.trim(), altText);
      }
      return;
    }

    await executeEditorCommand(id, {
      editorView: getLiveEditorView(),
      saveCurrentFile: async () => {
        await handleSave();
      },
      createFile: handleCreateFile,
      toggleSidebar: () => setIsSidebarVisible((value) => !value),
      toggleFullscreen,
      showToast,
      syncContent: handleContentChange,
      requestLinkInput,
    }, { selection });
  }, [getLiveEditorView, handleContentChange, handleCreateFile, handleInsertImageUrl, handleSave, requestLinkInput, showToast, toggleFullscreen, handleExport]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const commandId = getWindowsShortcutCommand(event);
      if (!commandId) return;

      event.preventDefault();
      event.stopPropagation();
      handleCommand(commandId);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleCommand]);

  useEffect(() => {
    if (!settings.autoSaveEnabled) return;

    const intervalId = window.setInterval(() => {
      const filename = selectedFileRef.current;
      const latestContent = getLiveEditorView()?.state.doc.toString() ?? contentRef.current;
      if (!filename || isAutoSavingRef.current || isSavedRef.current || latestContent === lastSavedContent.current) {
        return;
      }

      isAutoSavingRef.current = true;
      setSaveStatus('autoSaving');
      void handleSave({ source: 'auto', silent: true }).finally(() => {
        isAutoSavingRef.current = false;
      });
    }, settings.autoSaveIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [getLiveEditorView, handleSave, settings.autoSaveEnabled, settings.autoSaveIntervalMs]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const filename = selectedFileRef.current;
      if (filename && !isSavedRef.current) {
        if (settings.draftEnabled) {
          saveDraft(filename, getLiveEditorView()?.state.doc.toString() ?? contentRef.current);
        }
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [getLiveEditorView, settings.draftEnabled]);

  useEffect(() => {
    return () => {
      if (draftSaveTimerRef.current !== null) {
        window.clearTimeout(draftSaveTimerRef.current);
      }
    };
  }, []);

  if (!hasEnteredEditor) {
    return (
      <div className="min-h-screen bg-[#0d1321]">
        <WelcomeScreen onEnter={handleEnterEditor} />
        <Toast toast={toast} />
      </div>
    );
  }

  // 如果已经进入编辑器但文件列表还在加载中，可以显示一个简单的加载状态，防止黑屏
  if (hasEnteredEditor && files.length === 0 && selectedFile === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-gray-900 text-gray-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">正在准备您的写作空间...</p>
        </div>
        <Toast toast={toast} />
      </div>
    );
  }

  return (
    <div className="app-editor-shell flex flex-col h-screen w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      <div className="flex flex-col flex-shrink-0">
        <div className="app-topbar min-h-12 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 px-3 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-bold text-lg text-blue-600 dark:text-blue-400 select-none">MarkEdit</span>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
            <TopMenuBar
              onCommand={handleCommand}
              onImport={handleImportClick}
              onExport={() => setIsExportMenuOpen(true)}
              onThemeChange={handleThemeChange}
              onShowWelcome={handleBackToWelcome}
              onInfo={showToast}
              isDarkMode={isDarkMode}
            />
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 hidden lg:block" />
            <div className="flex items-center space-x-2 truncate max-w-[260px]">
              <span className="text-sm font-medium truncate">{selectedFile || 'Untitled'}</span>
              {!isSaved && <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" title="未保存" />}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleBackToWelcome}
              className="app-action-button inline-flex items-center gap-1.5 px-2.5 py-2 text-sm rounded-md text-blue-600 dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="返回欢迎页"
            >
              <Home size={18} />
              <span className="hidden sm:inline">首页</span>
            </button>
            <ExportMenu
              isOpen={isExportMenuOpen}
              onOpenChange={setIsExportMenuOpen}
              onExport={handleExport}
            />
            <ImageInsertMenu onChooseFile={handleChooseImageFile} onInsertUrl={handleInsertImageUrl} />
            <button
              type="button"
              onClick={handleImportClick}
              disabled={isImporting}
              className="app-action-button inline-flex items-center gap-1.5 px-2.5 py-2 text-sm rounded-md text-blue-600 dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:cursor-wait disabled:opacity-60 transition-colors"
              title="导入文档"
            >
              <Upload size={18} />
              <span className="hidden sm:inline">{isImporting ? '导入中...' : '导入文档'}</span>
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaved || !selectedFile}
              className={`app-action-button p-2 rounded-md transition-colors ${
                isSaved || !selectedFile
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title="Save (Ctrl+S)"
            >
              <Save size={18} />
            </button>
            <button
              type="button"
              onClick={() => setIsDarkMode((value) => !value)}
              className="app-action-button p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>

      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".md,.markdown,.txt"
        className="hidden"
        onChange={handleImportFiles}
      />

      <div className="flex-1 overflow-hidden">
        <ResizableLayout
          sidebar={
            isSidebarVisible ? (
              <Sidebar
                files={files}
                selectedFile={selectedFile}
                onSelect={handleFileSelect}
                onCreate={handleCreateFile}
                onImport={handleImportClick}
                isImporting={isImporting}
                onDelete={handleDeleteFile}
                onRename={handleRenameFile}
                outline={outline}
                currentLine={currentLine}
                onOutlineItemClick={handleOutlineItemClick}
              />
            ) : null
          }
          editor={
            <Editor
              content={content}
              documentKey={selectedFile}
              onChange={handleContentChange}
              isDarkMode={isDarkMode}
              onViewInit={setEditorView}
              onCommand={handleCommand}
              onSelectionChange={setCurrentLine}
              uploadAsset={uploadAssetFile}
              onStatus={showToast}
            />
          }
        />
      </div>

      <Toast toast={toast} />

      <LinkDialog
        open={Boolean(linkDialog)}
        initialValue={linkDialog?.initialValue ?? { text: '链接文本', url: 'https://example.com' }}
        mode={linkDialog?.mode ?? 'insert'}
        onConfirm={(value) => closeLinkDialog(value)}
        onCancel={() => closeLinkDialog(null)}
      />

      <StatusBar
        filename={selectedFile}
        isSaved={isSaved}
        content={content}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
      />
    </div>
  );
}

export default App;
