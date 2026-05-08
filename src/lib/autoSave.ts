export type SaveStatus =
  | 'saved'
  | 'unsaved'
  | 'autoSaving'
  | 'autoSaved'
  | 'autoSaveFailed'
  | 'draftSaved';

export const formatSaveTime = (date: Date | null) => {
  if (!date) return '';
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
