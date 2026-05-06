import { EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { redo, undo } from '@codemirror/commands';
import { CommandId } from './editorCommands';
import { markdownActions } from './markdownActions';

export interface SavedSelection {
  anchor: number;
  head: number;
}

export interface EditorCommandContext {
  editorView: EditorView | null;
  saveCurrentFile: () => void | Promise<void>;
  createFile: () => void | Promise<void>;
  toggleSidebar: () => void;
  toggleFullscreen: () => void;
  showToast: (message: string) => void;
  syncContent: (content: string) => void;
}

export interface ExecuteCommandOptions {
  selection?: SavedSelection;
}

const editorActions: Partial<Record<CommandId, (view: EditorView) => void | Promise<void>>> = {
  undo: (view) => { undo(view); },
  redo: (view) => { redo(view); },
  copy: markdownActions.copySelection,
  cut: markdownActions.cutSelection,
  paste: markdownActions.pasteAsPlainText,
  bold: markdownActions.toggleBold,
  italic: markdownActions.toggleItalic,
  underline: markdownActions.toggleUnderline,
  strike: markdownActions.toggleStrike,
  inlineCode: markdownActions.toggleInlineCode,
  clearFormat: markdownActions.clearFormat,
  paragraph: markdownActions.applyParagraph,
  h1: (view) => markdownActions.applyHeading(view, 1),
  h2: (view) => markdownActions.applyHeading(view, 2),
  h3: (view) => markdownActions.applyHeading(view, 3),
  h4: (view) => markdownActions.applyHeading(view, 4),
  h5: (view) => markdownActions.applyHeading(view, 5),
  h6: (view) => markdownActions.applyHeading(view, 6),
  headingUp: markdownActions.increaseHeadingLevel,
  headingDown: markdownActions.decreaseHeadingLevel,
  quote: markdownActions.toggleQuote,
  unorderedList: markdownActions.toggleUnorderedList,
  orderedList: markdownActions.toggleOrderedList,
  taskList: markdownActions.toggleTaskList,
  doneTask: markdownActions.toggleDoneTask,
  indent: markdownActions.indent,
  outdent: markdownActions.outdent,
  codeBlock: markdownActions.insertCodeBlock,
  mathBlock: markdownActions.insertMathBlock,
  table: markdownActions.insertTable,
  divider: markdownActions.insertDivider,
  link: markdownActions.insertLink,
  image: markdownActions.insertImage,
  selectAll: markdownActions.selectAllText,
  selectLine: markdownActions.selectCurrentLine,
  selectWord: markdownActions.selectCurrentWord,
  deleteWord: markdownActions.deleteCurrentWord,
  jumpTop: markdownActions.jumpToTop,
  jumpBottom: markdownActions.jumpToBottom,
  jumpSelection: markdownActions.jumpToSelection,
  copyAsMarkdown: markdownActions.copyAsMarkdown,
  pasteAsPlainText: markdownActions.pasteAsPlainText,
};

const restoreSelection = (view: EditorView, selection?: SavedSelection) => {
  if (!selection) return;
  if ((view as unknown as { destroyed?: boolean }).destroyed) return;
  const docLength = view.state.doc.length;
  const anchor = Math.max(0, Math.min(docLength, selection.anchor));
  const head = Math.max(0, Math.min(docLength, selection.head));
  view.dispatch({ selection: EditorSelection.range(anchor, head), scrollIntoView: true });
};

export const executeEditorCommand = async (
  id: CommandId,
  context: EditorCommandContext,
  options: ExecuteCommandOptions = {}
) => {
  switch (id) {
    case 'newFile':
      await context.createFile();
      return;
    case 'save':
      await context.saveCurrentFile();
      return;
    case 'toggleSidebar':
      context.toggleSidebar();
      return;
    case 'fullScreen':
      context.toggleFullscreen();
      return;
    case 'newWindow':
    case 'openFile':
    case 'quickOpen':
    case 'reopenClosed':
    case 'saveAs':
    case 'exportMarkdown':
    case 'exportText':
    case 'exportHtml':
    case 'exportPdf':
    case 'importFile':
    case 'settings':
    case 'closeFile':
    case 'find':
    case 'findNext':
    case 'findPrev':
    case 'replace':
    case 'selectStyle':
    case 'outlineView':
    case 'articleView':
    case 'fileTreeView':
    case 'toggleSourceMode':
    case 'focusMode':
    case 'typewriterMode':
    case 'zoomActual':
    case 'zoomIn':
    case 'zoomOut':
    case 'switchDoc':
      context.showToast(`${id} is not implemented yet`);
      return;
    default:
      break;
  }

  const action = editorActions[id];
  if (!action) {
    context.showToast(`${id} is not implemented yet`);
    return;
  }

  const view = context.editorView;
  if (!view || (view as unknown as { destroyed?: boolean }).destroyed) {
    context.showToast('Editor is not ready');
    return;
  }

  restoreSelection(view, options.selection);
  const before = view.state.doc.toString();
  await action(view);
  view.focus();

  if (view.state.doc.toString() !== before) {
    context.syncContent(view.state.doc.toString());
  }
};
