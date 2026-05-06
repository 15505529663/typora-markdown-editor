import { EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
]);

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

export type UploadAsset = (file: File) => Promise<string>;

export function isImageFile(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.has(file.type);
}

export function isImageLikeFile(file: File): boolean {
  return file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp|tiff?)$/i.test(file.name);
}

export function getImageExtension(file: File): string {
  const match = file.name.match(/\.(png|jpe?g|gif|webp)$/i);
  if (match) return match[0].toLowerCase();

  return IMAGE_EXTENSIONS[file.type] || '.png';
}

export function createImageMarkdown(relativePath: string, altText = '图片描述'): string {
  const safeAlt = altText.replace(/[\[\]\n\r]/g, '').trim() || '图片描述';
  return `![${safeAlt}](${relativePath})`;
}

export function insertImageAtCursor(view: EditorView, relativePath: string, altText = '图片描述') {
  const markdown = createImageMarkdown(relativePath, altText);
  const transaction = view.state.changeByRange((range) => ({
    changes: { from: range.from, to: range.to, insert: markdown },
    range: EditorSelection.cursor(range.from + markdown.length),
  }));

  view.dispatch(transaction);
  view.focus();
  return view.state.doc.toString();
}

export const getFirstImageFromClipboard = (event: ClipboardEvent) => {
  const items = Array.from(event.clipboardData?.items || []);
  for (const item of items) {
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file && isImageLikeFile(file)) return file;
    }
  }
  return null;
};

export const getImageFilesFromDrop = (event: DragEvent) => {
  return Array.from(event.dataTransfer?.files || []).filter(isImageFile);
};

export const getDroppedFiles = (event: DragEvent) => {
  return Array.from(event.dataTransfer?.files || []);
};

export async function handlePasteImage(
  event: ClipboardEvent,
  view: EditorView,
  uploadAsset: UploadAsset,
  onInserted?: (content: string) => void,
  onStatus?: (message: string) => void
): Promise<boolean> {
  const file = getFirstImageFromClipboard(event);
  if (!file) return false;

  event.preventDefault();
  if (!isImageFile(file)) {
    throw new Error('仅支持 PNG、JPG、GIF、WebP 图片');
  }
  onStatus?.('图片上传中...');
  const relativePath = await uploadAsset(file);
  const content = insertImageAtCursor(view, relativePath);
  onInserted?.(content);
  onStatus?.('图片已插入');
  return true;
}

export async function handleDropImage(
  event: DragEvent,
  view: EditorView,
  uploadAsset: UploadAsset,
  onInserted?: (content: string) => void,
  onStatus?: (message: string) => void
): Promise<boolean> {
  const imageFiles = getImageFilesFromDrop(event);
  if (imageFiles.length === 0) return false;

  event.preventDefault();

  const coordinates = view.posAtCoords({
    x: event.clientX,
    y: event.clientY,
  });
  if (coordinates !== null) {
    view.dispatch({ selection: EditorSelection.cursor(coordinates), scrollIntoView: true });
  }

  onStatus?.('图片上传中...');
  for (const file of imageFiles) {
    const relativePath = await uploadAsset(file);
    const content = insertImageAtCursor(view, relativePath);
    onInserted?.(content);
  }
  onStatus?.(imageFiles.length > 1 ? '图片已插入' : '图片已插入');
  return true;
}
