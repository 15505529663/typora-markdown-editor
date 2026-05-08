import { safeGetStorageItem, safeRemoveStorageItem, safeSetStorageItem } from './storage';

export interface DraftRecord {
  filePath: string;
  content: string;
  updatedAt: number;
}

const DRAFT_PREFIX = 'markedit_draft:';
const LEGACY_DRAFT_PREFIX = 'draft_';

const draftKey = (filePath: string) => `${DRAFT_PREFIX}${filePath}`;
const legacyDraftKey = (filePath: string) => `${LEGACY_DRAFT_PREFIX}${filePath}`;

export const saveDraft = (filePath: string, content: string) => {
  if (!filePath) return;
  const record: DraftRecord = {
    filePath,
    content,
    updatedAt: Date.now(),
  };
  safeSetStorageItem(localStorage, draftKey(filePath), JSON.stringify(record));
};

export const loadDraft = (filePath: string): DraftRecord | null => {
  if (!filePath) return null;

  const raw = safeGetStorageItem(localStorage, draftKey(filePath));
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as DraftRecord;
      if (typeof parsed.content === 'string' && typeof parsed.updatedAt === 'number') {
        return parsed;
      }
    } catch {
      safeRemoveStorageItem(localStorage, draftKey(filePath));
    }
  }

  const legacy = safeGetStorageItem(localStorage, legacyDraftKey(filePath));
  if (legacy !== null) {
    return {
      filePath,
      content: legacy,
      updatedAt: Date.now(),
    };
  }

  return null;
};

export const removeDraft = (filePath: string) => {
  if (!filePath) return;
  safeRemoveStorageItem(localStorage, draftKey(filePath));
  safeRemoveStorageItem(localStorage, legacyDraftKey(filePath));
};

export const hasNewerDraft = (
  filePath: string,
  fileContent: string,
  fileUpdatedAt?: number | string | null
) => {
  const draft = loadDraft(filePath);
  if (!draft || draft.content === fileContent) return false;

  const savedAt =
    typeof fileUpdatedAt === 'number'
      ? fileUpdatedAt
      : fileUpdatedAt
        ? new Date(fileUpdatedAt).getTime()
        : 0;

  return !Number.isFinite(savedAt) || savedAt <= 0 || draft.updatedAt > savedAt;
};

export const clearAllDrafts = () => {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(DRAFT_PREFIX) || key.startsWith(LEGACY_DRAFT_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore unavailable storage.
  }
};
