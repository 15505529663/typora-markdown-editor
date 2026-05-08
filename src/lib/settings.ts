import { safeGetStorageItem, safeSetStorageItem } from './storage';

export interface EditorSettings {
  autoSaveEnabled: boolean;
  autoSaveIntervalMs: number;
  draftEnabled: boolean;
  draftRestoreEnabled: boolean;
  backupEnabled: boolean;
  maxBackupsPerFile: number;
}

export const defaultEditorSettings: EditorSettings = {
  autoSaveEnabled: true,
  autoSaveIntervalMs: 30000,
  draftEnabled: true,
  draftRestoreEnabled: true,
  backupEnabled: true,
  maxBackupsPerFile: 5,
};

const SETTINGS_KEY = 'markedit_settings';

export const loadEditorSettings = (): EditorSettings => {
  const raw = safeGetStorageItem(localStorage, SETTINGS_KEY);
  if (!raw) return defaultEditorSettings;

  try {
    const parsed = JSON.parse(raw) as Partial<EditorSettings>;
    return {
      ...defaultEditorSettings,
      ...parsed,
      autoSaveIntervalMs: Math.max(5000, Number(parsed.autoSaveIntervalMs) || defaultEditorSettings.autoSaveIntervalMs),
      maxBackupsPerFile: Math.max(1, Number(parsed.maxBackupsPerFile) || defaultEditorSettings.maxBackupsPerFile),
    };
  } catch {
    return defaultEditorSettings;
  }
};

export const saveEditorSettings = (settings: EditorSettings) => {
  safeSetStorageItem(localStorage, SETTINGS_KEY, JSON.stringify(settings));
};
