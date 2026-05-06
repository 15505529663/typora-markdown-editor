export const safeGetStorageItem = (
  storage: Storage | undefined,
  key: string,
  fallback: string | null = null
) => {
  try {
    return storage?.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

export const safeSetStorageItem = (
  storage: Storage | undefined,
  key: string,
  value: string
) => {
  try {
    storage?.setItem(key, value);
  } catch {
    // Storage can be unavailable in private windows or restricted hosts.
  }
};

export const safeRemoveStorageItem = (storage: Storage | undefined, key: string) => {
  try {
    storage?.removeItem(key);
  } catch {
    // Ignore unavailable storage.
  }
};

export const safeClearLocalEditorState = () => {
  try {
    Object.keys(localStorage)
      .filter((key) =>
        key.startsWith('draft_') ||
        key === 'theme' ||
        key === 'sidebar_active_tab' ||
        key === 'layout_sidebar_width' ||
        key === 'hasEnteredEditor'
      )
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore unavailable storage.
  }

  try {
    sessionStorage.removeItem('hasEnteredEditorThisSession');
  } catch {
    // Ignore unavailable storage.
  }
};
