import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LinkInput, normalizeUrl } from '../lib/markdownActions';

interface LinkDialogProps {
  open: boolean;
  initialValue: LinkInput;
  mode: 'insert' | 'edit';
  onConfirm: (value: LinkInput) => void;
  onCancel: () => void;
}

const LinkDialog: React.FC<LinkDialogProps> = ({
  open,
  initialValue,
  mode,
  onConfirm,
  onCancel,
}) => {
  const [text, setText] = useState(initialValue.text);
  const [url, setUrl] = useState(initialValue.url);
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setText(initialValue.text);
    setUrl(initialValue.url);
    setError('');
    window.setTimeout(() => {
      if (initialValue.text && initialValue.text !== '链接文本') {
        urlInputRef.current?.focus();
        urlInputRef.current?.select();
      } else {
        textInputRef.current?.focus();
        textInputRef.current?.select();
      }
    }, 0);
  }, [initialValue, open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, open]);

  const title = useMemo(() => (mode === 'edit' ? '编辑链接' : '插入链接'), [mode]);

  const submit = () => {
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) {
      setError('请输入有效链接，支持 http://、https://、mailto:，或 openai.com 这类网址');
      return;
    }
    onConfirm({
      text: text.trim() || '链接文本',
      url: normalizedUrl,
    });
  };

  if (!open) return null;

  return createPortal(
    <div
      className="link-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div ref={dialogRef} className="link-dialog-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="link-dialog-title">{title}</div>
        <form
          className="link-dialog-form"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label className="link-dialog-field">
            <span>链接文本</span>
            <input
              ref={textInputRef}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="链接文本"
            />
          </label>
          <label className="link-dialog-field">
            <span>链接地址</span>
            <input
              ref={urlInputRef}
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setError('');
              }}
              placeholder="https://example.com"
            />
          </label>
          {error && <div className="link-dialog-error">{error}</div>}
          <div className="link-dialog-actions">
            <button type="button" className="link-dialog-button link-dialog-cancel" onClick={onCancel}>
              取消
            </button>
            <button type="submit" className="link-dialog-button link-dialog-confirm">
              确认
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default LinkDialog;
