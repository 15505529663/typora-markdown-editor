import { ensureHighlightLanguage, hljs } from './codeLanguages';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const highlightCodeToHtml = (language: string, code: string): string => {
  const safeCode = code || '';

  try {
    const highlightLanguage = ensureHighlightLanguage(language);
    if (highlightLanguage === 'plaintext') {
      return escapeHtml(safeCode);
    }

    return hljs.highlight(safeCode, {
      language: highlightLanguage,
      ignoreIllegals: true,
    }).value;
  } catch (error) {
    console.warn('Code highlight fallback to plaintext', error);
    return escapeHtml(safeCode);
  }
};
