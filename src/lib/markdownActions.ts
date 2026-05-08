import { EditorSelection, SelectionRange } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { CODE_BLOCK_LANGUAGES, normalizeCodeLanguage } from './codeBlockLanguages';

export type MarkdownAction = (view: EditorView) => void | Promise<void>;

export interface LinkInput {
  text: string;
  url: string;
}

export interface ParsedLink extends LinkInput {
  from: number;
  to: number;
  textFrom: number;
  textTo: number;
  urlFrom: number;
  urlTo: number;
}

export type RequestLinkInput = (initial: LinkInput, mode: 'insert' | 'edit') => Promise<LinkInput | null>;

const getSelectedText = (view: EditorView, range: SelectionRange) => {
  return view.state.sliceDoc(range.from, range.to);
};

const getTouchedLineNumbers = (view: EditorView, range: SelectionRange) => {
  const doc = view.state.doc;
  const fromLine = doc.lineAt(range.from);
  const endPos = range.empty ? range.to : Math.max(range.from, range.to - 1);
  const toLine = doc.lineAt(endPos);
  const numbers: number[] = [];
  for (let lineNo = fromLine.number; lineNo <= toLine.number; lineNo += 1) {
    numbers.push(lineNo);
  }
  return numbers;
};

const dispatchLineTransform = (
  view: EditorView,
  transform: (lines: string[]) => string[]
) => {
  const transaction = view.state.changeByRange((range) => {
    const lineNumbers = getTouchedLineNumbers(view, range);
    const lines = lineNumbers.map((lineNo) => view.state.doc.line(lineNo));
    const oldText = lines.map((line) => line.text).join('\n');
    const newText = transform(lines.map((line) => line.text)).join('\n');
    const from = lines[0].from;
    const to = lines[lines.length - 1].to;
    const emptyCursor = Math.min(from + newText.length, Math.max(from, range.head + (newText.length - oldText.length)));

    return {
      changes: { from, to, insert: newText },
      range: range.empty
        ? EditorSelection.cursor(emptyCursor)
        : EditorSelection.range(from, from + newText.length),
    };
  });

  view.dispatch(transaction);
  view.focus();
};

const stripBlockPrefix = (line: string) => {
  return line
    .replace(/^(\s*)#{1,6}\s+/, '$1')
    .replace(/^(\s*)>\s?/, '$1')
    .replace(/^(\s*)(?:[-*+]\s+\[[ xX]\]\s+|[-*+]\s+|\d+\.\s+)/, '$1');
};

const stripHeading = (line: string) => line.replace(/^(\s*)#{1,6}\s+/, '$1');

const wrapSelection = (view: EditorView, before: string, after: string, fallback = 'text') => {
  const transaction = view.state.changeByRange((range) => {
    const selectedText = getSelectedText(view, range);

    if (selectedText && selectedText.startsWith(before) && selectedText.endsWith(after)) {
      const inner = selectedText.slice(before.length, selectedText.length - after.length);
      return {
        changes: { from: range.from, to: range.to, insert: inner },
        range: EditorSelection.range(range.from, range.from + inner.length),
      };
    }

    if (range.empty) {
      const word = view.state.wordAt(range.from);
      if (word) {
        const wordText = view.state.sliceDoc(word.from, word.to);
        const insert = `${before}${wordText}${after}`;
        return {
          changes: { from: word.from, to: word.to, insert },
          range: EditorSelection.range(word.from + before.length, word.from + before.length + wordText.length),
        };
      }

      const insert = `${before}${fallback}${after}`;
      return {
        changes: { from: range.from, to: range.to, insert },
        range: EditorSelection.range(range.from + before.length, range.from + before.length + fallback.length),
      };
    }

    const insert = `${before}${selectedText}${after}`;
    return {
      changes: { from: range.from, to: range.to, insert },
      range: EditorSelection.range(range.from + before.length, range.from + before.length + selectedText.length),
    };
  });

  view.dispatch(transaction);
  view.focus();
};

const toggleLinePrefix = (
  view: EditorView,
  prefix: string,
  matcher: RegExp,
  makePrefix: (index: number) => string = () => prefix
) => {
  dispatchLineTransform(view, (lines) => {
    const meaningfulLines = lines.filter((line) => line.trim().length > 0);
    const shouldRemove = meaningfulLines.length > 0 && meaningfulLines.every((line) => matcher.test(line));

    return lines.map((line, index) => {
      if (!line.trim()) return line;
      if (shouldRemove) return line.replace(matcher, '$1');

      const clean = stripBlockPrefix(line);
      const indent = clean.match(/^\s*/)?.[0] ?? '';
      return `${indent}${makePrefix(index)}${clean.slice(indent.length)}`;
    });
  });
};

const applyHeading = (view: EditorView, level: number) => {
  const prefix = level > 0 ? `${'#'.repeat(level)} ` : '';
  dispatchLineTransform(view, (lines) =>
    lines.map((line) => {
      const clean = stripHeading(line);
      const indent = clean.match(/^\s*/)?.[0] ?? '';
      return `${indent}${prefix}${clean.slice(indent.length)}`;
    })
  );
};

const applyParagraph = (view: EditorView) => {
  dispatchLineTransform(view, (lines) => lines.map(stripBlockPrefix));
};

const changeHeadingLevel = (view: EditorView, delta: number) => {
  dispatchLineTransform(view, (lines) =>
    lines.map((line) => {
      const match = line.match(/^(\s*)(#{1,6})\s+(.*)$/);
      if (!match && delta > 0) {
        const indent = line.match(/^\s*/)?.[0] ?? '';
        return `${indent}# ${line.slice(indent.length)}`;
      }
      if (!match) return line;

      const level = Math.max(0, Math.min(6, match[2].length + delta));
      const prefix = level > 0 ? `${'#'.repeat(level)} ` : '';
      return `${match[1]}${prefix}${match[3]}`;
    })
  );
};

const toggleBold = (view: EditorView) => wrapSelection(view, '**', '**');
const toggleItalic = (view: EditorView) => wrapSelection(view, '*', '*');
const toggleUnderline = (view: EditorView) => wrapSelection(view, '<u>', '</u>');
const toggleStrike = (view: EditorView) => wrapSelection(view, '~~', '~~');
const toggleInlineCode = (view: EditorView) => wrapSelection(view, '`', '`', 'code');

const toggleQuote = (view: EditorView) => toggleLinePrefix(view, '> ', /^(\s*)>\s?/);
const toggleUnorderedList = (view: EditorView) => toggleLinePrefix(view, '- ', /^(\s*)[-*+]\s+/);
const toggleOrderedList = (view: EditorView) => toggleLinePrefix(view, '1. ', /^(\s*)\d+\.\s+/, (index) => `${index + 1}. `);
const toggleTaskList = (view: EditorView) => toggleLinePrefix(view, '- [ ] ', /^(\s*)[-*+]\s+\[ \]\s+/);
const toggleDoneTask = (view: EditorView) => toggleLinePrefix(view, '- [x] ', /^(\s*)[-*+]\s+\[[xX]\]\s+/);

const indent = (view: EditorView) => {
  dispatchLineTransform(view, (lines) => lines.map((line) => `    ${line}`));
};

const outdent = (view: EditorView) => {
  dispatchLineTransform(view, (lines) =>
    lines.map((line) => line.replace(/^( {1,4}|\t)/, ''))
  );
};

const insertBlock = (view: EditorView, before: string, after: string, fallback: string) => {
  const transaction = view.state.changeByRange((range) => {
    const selectedText = getSelectedText(view, range) || fallback;
    const insert = `${before}${selectedText}${after}`;
    const contentFrom = range.from + before.length;
    return {
      changes: { from: range.from, to: range.to, insert },
      range: EditorSelection.range(contentFrom, contentFrom + selectedText.length),
    };
  });

  view.dispatch(transaction);
  view.focus();
};

const chooseCodeBlockLanguagePrompt = () => {
  const language = window.prompt(
    `请选择代码块语言：\n${CODE_BLOCK_LANGUAGES.join(', ')}\n\n也可以直接输入其他语言标识。`,
    'text'
  );
  return normalizeCodeLanguage(language);
};

const chooseCodeBlockLanguage = () => {
  return new Promise<string | null>((resolve) => {
    document.querySelector('.cm-code-insert-language-menu')?.remove();

    const menu = document.createElement('div');
    menu.className = 'cm-code-insert-language-menu';

    const title = document.createElement('div');
    title.className = 'cm-code-insert-language-title';
    title.textContent = '选择代码块语言';
    menu.appendChild(title);

    CODE_BLOCK_LANGUAGES.forEach((language) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = `cm-code-language-menu-item${language === 'text' ? ' is-active' : ''}`;
      item.textContent = language;
      item.addEventListener('mousedown', (event) => {
        event.preventDefault();
        cleanup();
        resolve(normalizeCodeLanguage(language));
      });
      menu.appendChild(item);
    });

    const custom = document.createElement('input');
    custom.className = 'cm-code-insert-language-input';
    custom.placeholder = '输入其他语言后回车';
    custom.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        cleanup();
        resolve(normalizeCodeLanguage(custom.value));
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        cleanup();
        resolve(null);
      }
    });
    menu.appendChild(custom);

    const handlePointerDown = (event: MouseEvent) => {
      if (!menu.contains(event.target as Node)) {
        cleanup();
        resolve(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cleanup();
        resolve(null);
      }
    };
    function cleanup() {
      menu.remove();
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    }

    document.body.appendChild(menu);
    window.setTimeout(() => {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown);
      custom.focus();
    }, 0);
  });
};

const insertCodeBlock = async (view: EditorView) => {
  const language = await chooseCodeBlockLanguage();
  if (language === null) return;
  insertBlock(view, `\n\`\`\`${language}\n`, '\n```\n', 'code');
};

const insertMathBlock = (view: EditorView) => {
  insertBlock(view, '\n$$\n', '\n$$\n', 'x = y + z');
};

export const normalizeUrl = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (/^file:/i.test(trimmed)) return null;
  if (/^mailto:/i.test(trimmed)) {
    return trimmed.length > 'mailto:'.length ? trimmed : null;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return new URL(trimmed).href;
    } catch {
      return null;
    }
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null;

  const withProtocol = `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    return parsed.hostname.includes('.') ? parsed.href : null;
  } catch {
    return null;
  }
};

export const parseSelectedLink = (view: EditorView): ParsedLink | null => {
  const selection = view.state.selection.main;
  const head = selection.head;
  const scanFrom = view.state.doc.lineAt(selection.from).from;
  const scanTo = view.state.doc.lineAt(selection.to).to;
  const text = view.state.sliceDoc(scanFrom, scanTo);
  const linkRegex = /(?<!!)\[([^\]\n]+)\]\(([^)\n]*)\)/g;

  for (const match of text.matchAll(linkRegex)) {
    if (match.index === undefined) continue;
    const full = match[0];
    const linkText = match[1] ?? '';
    const url = match[2] ?? '';
    const from = scanFrom + match.index;
    const to = from + full.length;
    const textFrom = from + 1;
    const textTo = textFrom + linkText.length;
    const urlFrom = textTo + 2;
    const urlTo = urlFrom + url.length;
    const touchesSelection = selection.empty
      ? head >= from && head <= to
      : selection.from >= from && selection.to <= to;

    if (touchesSelection) {
      return { from, to, textFrom, textTo, urlFrom, urlTo, text: linkText, url };
    }
  }

  return null;
};

export const updateLink = (view: EditorView, from: number, to: number, text: string, url: string) => {
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) return false;

  const safeText = text.trim() || '链接文本';
  const insert = `[${safeText}](${normalizedUrl})`;
  view.dispatch({
    changes: { from, to, insert },
    selection: EditorSelection.cursor(from + insert.length),
    scrollIntoView: true,
  });
  view.focus();
  return true;
};

const requestLinkWithPrompt: RequestLinkInput = async (initial, mode) => {
  if (mode === 'edit') {
    const text = window.prompt('链接文本', initial.text);
    if (text === null) return null;
    const url = window.prompt('链接地址', initial.url);
    if (url === null) return null;
    return { text, url };
  }

  if (initial.text && initial.text !== '链接文本') {
    const url = window.prompt('链接地址', initial.url);
    if (url === null) return null;
    return { text: initial.text, url };
  }

  const text = window.prompt('链接文本', initial.text);
  if (text === null) return null;
  const url = window.prompt('链接地址', initial.url);
  if (url === null) return null;
  return { text, url };
};

const insertLink = async (view: EditorView, requestLinkInput: RequestLinkInput = requestLinkWithPrompt) => {
  const existingLink = parseSelectedLink(view);
  const range = view.state.selection.main;
  const selectedText = existingLink ? existingLink.text : getSelectedText(view, range);
  const initial: LinkInput = {
    text: selectedText || '链接文本',
    url: existingLink?.url || 'https://example.com',
  };

  const next = await requestLinkInput(initial, existingLink ? 'edit' : 'insert');
  if (!next) {
    view.focus();
    return;
  }

  const from = existingLink?.from ?? range.from;
  const to = existingLink?.to ?? range.to;
  const changed = updateLink(view, from, to, next.text, next.url);
  if (!changed) {
    view.focus();
  }
};

const insertImage = (view: EditorView) => {
  const transaction = view.state.changeByRange((range) => {
    const selectedText = getSelectedText(view, range) || 'image description';
    const insert = `![${selectedText}](image_url)`;
    const urlFrom = range.from + selectedText.length + 4;
    const urlTo = urlFrom + 'image_url'.length;
    return {
      changes: { from: range.from, to: range.to, insert },
      range: EditorSelection.range(urlFrom, urlTo),
    };
  });

  view.dispatch(transaction);
  view.focus();
};

const insertTable = (view: EditorView) => {
  const table = '\n| Header 1 | Header 2 | Header 3 |\n| --- | --- | --- |\n| Cell 1 | Cell 2 | Cell 3 |\n';
  view.dispatch(view.state.replaceSelection(table));
  view.focus();
};

const insertDivider = (view: EditorView) => {
  view.dispatch(view.state.replaceSelection('\n---\n'));
  view.focus();
};

const clearMarkdownFormat = (text: string) => {
  return text
    .replace(/<u>(.*?)<\/u>/gs, '$1')
    .replace(/\*\*(.*?)\*\*/gs, '$1')
    .replace(/\*(.*?)\*/gs, '$1')
    .replace(/~~(.*?)~~/gs, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^(\s*)#{1,6}\s+/gm, '$1')
    .replace(/^(\s*)>\s?/gm, '$1')
    .replace(/^(\s*)(?:[-*+]\s+\[[ xX]\]\s+|[-*+]\s+|\d+\.\s+)/gm, '$1');
};

const clearFormat = (view: EditorView) => {
  const transaction = view.state.changeByRange((range) => {
    if (range.empty) {
      const line = view.state.doc.lineAt(range.from);
      const cleanText = clearMarkdownFormat(line.text);
      return {
        changes: { from: line.from, to: line.to, insert: cleanText },
        range: EditorSelection.cursor(Math.min(line.from + cleanText.length, range.from)),
      };
    }

    const cleanText = clearMarkdownFormat(getSelectedText(view, range));
    return {
      changes: { from: range.from, to: range.to, insert: cleanText },
      range: EditorSelection.range(range.from, range.from + cleanText.length),
    };
  });

  view.dispatch(transaction);
  view.focus();
};

const selectCurrentLine = (view: EditorView) => {
  const line = view.state.doc.lineAt(view.state.selection.main.from);
  view.dispatch({ selection: EditorSelection.range(line.from, line.to), scrollIntoView: true });
  view.focus();
};

const selectCurrentWord = (view: EditorView) => {
  const range = view.state.wordAt(view.state.selection.main.from);
  if (range) {
    view.dispatch({ selection: EditorSelection.range(range.from, range.to), scrollIntoView: true });
  }
  view.focus();
};

const selectAllText = (view: EditorView) => {
  view.dispatch({ selection: EditorSelection.range(0, view.state.doc.length), scrollIntoView: true });
  view.focus();
};

const deleteCurrentWord = (view: EditorView) => {
  const range = view.state.wordAt(view.state.selection.main.from);
  if (range) {
    view.dispatch({
      changes: { from: range.from, to: range.to, insert: '' },
      selection: EditorSelection.cursor(range.from),
    });
  }
  view.focus();
};

const jumpToTop = (view: EditorView) => {
  view.dispatch({ selection: EditorSelection.cursor(0), scrollIntoView: true });
  view.focus();
};

const jumpToBottom = (view: EditorView) => {
  view.dispatch({ selection: EditorSelection.cursor(view.state.doc.length), scrollIntoView: true });
  view.focus();
};

const jumpToSelection = (view: EditorView) => {
  view.dispatch({ scrollIntoView: true });
  view.focus();
};

const copyAsMarkdown = async (view: EditorView) => {
  const text = getSelectedText(view, view.state.selection.main) || view.state.doc.toString();
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  } else {
    // 兼容非安全上下文（如局域网 HTTP 访问）
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
  }
  view.focus();
};

const copySelection = async (view: EditorView) => {
  const text = getSelectedText(view, view.state.selection.main);
  if (text) {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    }
  }
  view.focus();
};

const cutSelection = async (view: EditorView) => {
  const range = view.state.selection.main;
  const text = getSelectedText(view, range);
  if (text) {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    }
    view.dispatch({
      changes: { from: range.from, to: range.to, insert: '' },
      selection: EditorSelection.cursor(range.from),
    });
  }
  view.focus();
};

const pasteAsPlainText = async (view: EditorView) => {
  let text = '';
  if (navigator.clipboard) {
    text = await navigator.clipboard.readText();
  } else {
    // 非安全上下文无法直接读取剪贴板，提示用户
    alert('由于浏览器安全限制，HTTP 环境下无法自动读取剪贴板，请使用 Ctrl+V 直接粘贴。');
    return;
  }
  view.dispatch(view.state.replaceSelection(text));
  view.focus();
};

export const markdownActions = {
  applyHeading,
  applyParagraph,
  increaseHeadingLevel: (view: EditorView) => changeHeadingLevel(view, -1),
  decreaseHeadingLevel: (view: EditorView) => changeHeadingLevel(view, 1),
  toggleBold,
  toggleItalic,
  toggleUnderline,
  toggleStrike,
  toggleInlineCode,
  toggleQuote,
  toggleUnorderedList,
  toggleOrderedList,
  toggleTaskList,
  toggleDoneTask,
  indent,
  outdent,
  insertCodeBlock,
  insertMathBlock,
  insertLink,
  insertImage,
  insertTable,
  insertDivider,
  clearFormat,
  selectCurrentLine,
  selectCurrentWord,
  selectAllText,
  deleteCurrentWord,
  jumpToTop,
  jumpToBottom,
  jumpToSelection,
  copySelection,
  cutSelection,
  copyAsMarkdown,
  pasteAsPlainText,
};
