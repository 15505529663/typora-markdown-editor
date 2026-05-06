import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import ContextMenu from './ContextMenu';
import { CommandId } from '../lib/editorCommands';
import { SavedSelection } from '../lib/executeCommand';
import { typoraLikeMarkdownDecorations } from '../lib/markdownDecorations';
import { typoraLikeImageDecorations } from '../lib/imageDecorations';
import { typoraLikeCodeBlockDecorations } from '../lib/codeBlockDecorations';
import {
  getFirstImageFromClipboard,
  getDroppedFiles,
  getImageFilesFromDrop,
  handleDropImage,
  handlePasteImage,
  isImageFile,
  isImageLikeFile,
  UploadAsset,
} from '../lib/image';

interface EditorProps {
  content: string;
  documentKey?: string | null;
  onChange: (value: string) => void;
  isDarkMode: boolean;
  onViewInit?: (view: EditorView | null) => void;
  onCommand: (id: CommandId) => void;
  onSelectionChange?: (line: number) => void;
  uploadAsset?: UploadAsset;
  onStatus?: (message: string) => void;
}

const Editor: React.FC<EditorProps> = ({
  content,
  documentKey,
  onChange,
  isDarkMode,
  onViewInit,
  onCommand,
  onSelectionChange,
  uploadAsset,
  onStatus,
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; selection: SavedSelection } | null>(null);
  const viewRef = useRef<EditorView | null>(null);

  const handleCreateEditor = useCallback((view: EditorView) => {
    viewRef.current = view;
    if (onViewInit) {
      onViewInit(view);
    }
  }, [onViewInit]);

  useEffect(() => {
    return () => {
      document.querySelectorAll('.cm-code-language-menu, .cm-code-insert-language-menu').forEach((node) => node.remove());
      viewRef.current = null;
      onViewInit?.(null);
    };
  }, [onViewInit]);

  useEffect(() => {
    setContextMenu(null);
    document.querySelectorAll('.cm-code-language-menu, .cm-code-insert-language-menu').forEach((node) => node.remove());

    const view = viewRef.current;
    if (!view || (view as unknown as { destroyed?: boolean }).destroyed) return;

    window.requestAnimationFrame(() => {
      if (!viewRef.current || (viewRef.current as unknown as { destroyed?: boolean }).destroyed) return;
      const docLength = viewRef.current.state.doc.length;
      viewRef.current.dispatch({ selection: { anchor: Math.min(0, docLength) } });
    });
  }, [documentKey]);

  const imageUploadExtension = useMemo(() => EditorView.domEventHandlers({
    paste: (event, view) => {
      if (!uploadAsset || !getFirstImageFromClipboard(event)) return false;
      void handlePasteImage(event, view, uploadAsset, onChange, onStatus).catch((error) => {
        onStatus?.(error instanceof Error ? error.message : '图片上传失败');
      });
      return true;
    },
    dragover: (event) => {
      if (!getDroppedFiles(event).some(isImageLikeFile)) return false;
      event.preventDefault();
      return true;
    },
    drop: (event, view) => {
      const imageLikeFiles = getDroppedFiles(event).filter(isImageLikeFile);
      if (!uploadAsset || imageLikeFiles.length === 0) return false;
      if (imageLikeFiles.some((file) => !isImageFile(file))) {
        event.preventDefault();
        onStatus?.('仅支持 PNG、JPG、GIF、WebP 图片');
        return true;
      }
      if (getImageFilesFromDrop(event).length === 0) return false;
      void handleDropImage(event, view, uploadAsset, onChange, onStatus).catch((error) => {
        onStatus?.(error instanceof Error ? error.message : '图片上传失败');
      });
      return true;
    },
  }), [onChange, onStatus, uploadAsset]);

  const extensions = useMemo(() => [
    markdown({ codeLanguages: languages }),
    EditorView.lineWrapping,
    typoraLikeCodeBlockDecorations,
    typoraLikeMarkdownDecorations(),
    typoraLikeImageDecorations(),
    imageUploadExtension,
  ], [imageUploadExtension]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (viewRef.current) {
      const selection = viewRef.current.state.selection.main;
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        selection: { anchor: selection.anchor, head: selection.head },
      });
    }
  };

  return (
    <div className="markdown-editor-surface h-full w-full overflow-hidden relative" onContextMenu={handleContextMenu}>
      <CodeMirror
        value={content}
        height="100%"
        theme={isDarkMode ? oneDark : 'light'}
        extensions={extensions}
        onChange={(value) => onChange(value)}
        onUpdate={(update) => {
          if ((update.selectionSet || update.docChanged) && onSelectionChange) {
            try {
              const pos = Math.max(0, Math.min(update.state.doc.length, update.state.selection.main.head));
              const line = update.state.doc.lineAt(pos).number;
              onSelectionChange(line);
            } catch {
              onSelectionChange(1);
            }
          }
        }}
        onCreateEditor={handleCreateEditor}
        className="markdown-editor-codemirror h-full text-base"
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
      />
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onCommand={onCommand}
          selection={contextMenu.selection}
        />
      )}
    </div>
  );
};

export default Editor;
