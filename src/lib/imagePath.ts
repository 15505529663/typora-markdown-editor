const LOCAL_ASSET_PREFIXES = ['./assets/', 'assets/', '/assets/'];

export function isRemoteImageUrl(src: string): boolean {
  return /^https?:\/\//i.test(src.trim());
}

export function isDataImage(src: string): boolean {
  return /^data:image\//i.test(src.trim());
}

export function isLocalAssetPath(src: string): boolean {
  const value = src.trim();
  return LOCAL_ASSET_PREFIXES.some((prefix) => value.startsWith(prefix));
}

export function normalizeMarkdownImagePath(src: string): string {
  return src
    .trim()
    .replace(/^<(.+)>$/, '$1')
    .replace(/^['"](.+)['"]$/, '$1');
}

export function resolveImageUrl(src: string): string {
  const normalized = normalizeMarkdownImagePath(src);

  if (isRemoteImageUrl(normalized) || isDataImage(normalized)) {
    return normalized;
  }

  if (normalized.startsWith('./assets/')) {
    return encodeURI(normalized.replace(/^\.\//, '/'));
  }

  if (normalized.startsWith('assets/')) {
    return encodeURI(`/${normalized}`);
  }

  if (normalized.startsWith('/assets/')) {
    return encodeURI(normalized);
  }

  return encodeURI(normalized);
}
