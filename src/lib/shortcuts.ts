import { CommandId } from './editorCommands';

const isPlainEditableElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest('.cm-editor')) return false;
  return Boolean(target.closest('input, textarea, [contenteditable="true"]'));
};

const hasOnlyCtrl = (event: KeyboardEvent) => event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;
const hasCtrlShift = (event: KeyboardEvent) => event.ctrlKey && event.shiftKey && !event.altKey && !event.metaKey;
const hasAltShift = (event: KeyboardEvent) => !event.ctrlKey && event.shiftKey && event.altKey && !event.metaKey;

export const getWindowsShortcutCommand = (event: KeyboardEvent): CommandId | null => {
  if (isPlainEditableElement(event.target)) return null;

  const key = event.key.toLowerCase();
  const code = event.code;

  if (hasOnlyCtrl(event)) {
    if (key === 'b') return 'bold';
    if (key === 'i') return 'italic';
    if (key === 'u') return 'underline';
    if (key === '\\' || code === 'Backslash') return 'clearFormat';
    if (key === '0' || code === 'Digit0') return 'paragraph';
    if (key === '1' || code === 'Digit1') return 'h1';
    if (key === '2' || code === 'Digit2') return 'h2';
    if (key === '3' || code === 'Digit3') return 'h3';
    if (key === '4' || code === 'Digit4') return 'h4';
    if (key === '5' || code === 'Digit5') return 'h5';
    if (key === '6' || code === 'Digit6') return 'h6';
    if (key === '=' || key === '+' || code === 'Equal') return 'headingUp';
    if (key === '-' || key === '_' || code === 'Minus') return 'headingDown';
    if (key === 't') return 'table';
    if (key === 'k') return 'insertLink';
    if (key === 'a') return 'selectAll';
    if (key === 'l') return 'selectLine';
    if (key === 'd') return 'selectWord';
    if (key === 's') return 'save';
    if (key === 'z') return 'undo';
    if (key === 'y') return 'redo';
    if (key === 'n') return 'newFile';
    if (key === 'home') return 'jumpTop';
    if (key === 'end') return 'jumpBottom';
  }

  if (hasCtrlShift(event)) {
    if (key === '`' || key === '~' || code === 'Backquote') return 'inlineCode';
    if (key === 'q') return 'quote';
    if (key === '[' || key === '{' || code === 'BracketLeft') return 'orderedList';
    if (key === ']' || key === '}' || code === 'BracketRight') return 'unorderedList';
    if (key === 'k') return 'codeBlock';
    if (key === 'm') return 'mathBlock';
    if (key === 'i') return 'image';
    if (key === 'e' || key === 's') return 'saveAs';
    if (key === 'p') return 'exportPdf';
  }

  if (hasAltShift(event) && (key === '5' || key === '%' || code === 'Digit5')) {
    return 'strike';
  }

  return null;
};
