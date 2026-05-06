import fs from 'fs-extra';
import path from 'path';

const ILLEGAL_FILENAME_CHARS = /[\\/:*?"<>|]/;
const ILLEGAL_FILENAME_CHARS_GLOBAL = /[\\/:*?"<>|]/g;
const ALLOWED_IMPORT_EXTENSIONS = new Set(['.md', '.markdown', '.txt']);

export const sanitizeFileName = (fileName: string) => {
  const baseName = path.basename(fileName || '').trim();
  const sanitized = baseName
    .replace(ILLEGAL_FILENAME_CHARS_GLOBAL, '')
    .replace(/\s+/g, ' ')
    .trim();

  return sanitized;
};

export const validateRawFileName = (fileName: string) => {
  if (!fileName || !fileName.trim()) {
    return '文件名不能为空';
  }
  if (ILLEGAL_FILENAME_CHARS.test(fileName)) {
    return '文件名不能包含 / \\ : * ? " < > |';
  }
  if (fileName.includes('..')) {
    return '文件名不能包含 ..';
  }
  return null;
};

export const ensureMarkdownExtension = (fileName: string) => {
  const parsed = path.parse(fileName);
  const ext = parsed.ext.toLowerCase();

  if (ext === '.md') return `${parsed.name}.md`;
  if (ext === '.markdown' || ext === '.txt') return `${parsed.name}.md`;
  if (!ext) return `${fileName}.md`;

  return `${parsed.name}.md`;
};

export const isAllowedImportExtension = (fileName: string) => {
  return ALLOWED_IMPORT_EXTENSIONS.has(path.extname(fileName).toLowerCase());
};

export const resolveSafeNotePath = (notesDir: string, fileName: string) => {
  const sanitized = sanitizeFileName(fileName);
  if (!sanitized) {
    throw new Error('文件名不能为空');
  }

  const normalizedName = ensureMarkdownExtension(sanitized);
  const targetPath = path.resolve(notesDir, normalizedName);
  const relative = path.relative(notesDir, targetPath);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('非法文件路径');
  }

  return { fileName: normalizedName, filePath: targetPath };
};

export const getAvailableFileName = async (notesDir: string, fileName: string) => {
  const { fileName: normalizedName } = resolveSafeNotePath(notesDir, fileName);
  const parsed = path.parse(normalizedName);
  let candidate = normalizedName;
  let index = 1;

  while (await fs.pathExists(resolveSafeNotePath(notesDir, candidate).filePath)) {
    candidate = `${parsed.name}-${index}${parsed.ext}`;
    index += 1;
  }

  return candidate;
};
