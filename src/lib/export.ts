import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import { highlightCodeToHtml } from './codeHighlight';
import { resolveImageUrl } from './imagePath';

// 动态导入 html2pdf.js 避免在不支持的浏览器中报错
const getHtml2Pdf = async () => {
  const module = await import('html2pdf.js');
  return module.default || module;
};

export function downloadBlob(fileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function changeExtension(fileName: string, ext: string): string {
  const safeExt = ext.startsWith('.') ? ext : `.${ext}`;
  const baseName = (fileName || 'untitled').trim() || 'untitled';
  return baseName.replace(/\.[^/.\\]+$/, '') + safeExt;
}

export function exportAsMarkdown(fileName: string, content: string): void {
  const targetName = changeExtension(fileName || 'untitled.md', '.md');
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(targetName, blob);
}

export function markdownToPlainText(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, (block) =>
      block
        .replace(/^```[^\n]*\n?/, '')
        .replace(/\n?```$/, '')
    )
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, url) => alt || url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/gm, '')
    .replace(/\|/g, ' ')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1')
    .replace(/(?<!_)_([^_\n]+)_(?!_)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*---+\s*$/gm, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function exportAsText(fileName: string, content: string): void {
  const targetName = changeExtension(fileName || 'untitled.txt', '.txt');
  const blob = new Blob([markdownToPlainText(content)], { type: 'text/plain;charset=utf-8' });
  downloadBlob(targetName, blob);
}

const getTitle = (fileName: string) => {
  const baseName = (fileName || 'untitled').replace(/\.[^/.\\]+$/, '');
  return baseName || 'untitled';
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const resolveExportImageUrl = (src: string) => {
  const resolved = resolveImageUrl(src);
  if (resolved.startsWith('/assets/') && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${resolved}`;
  }
  return resolved;
};

const getCommonStyles = () => `
    body {
      color: #1e293b;
      line-height: 1.7;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;
      font-size: 15px;
      margin: 0;
      padding: 0;
      background: white;
    }
    main {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      background: white;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #0f172a;
      line-height: 1.3;
      margin: 1.5em 0 0.6em;
      font-weight: 600;
    }
    h1 { font-size: 2.2em; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.3em; }
    h2 { font-size: 1.75em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25em; }
    h3 { font-size: 1.4em; }
    p, ul, ol, blockquote, table, pre { margin: 0 0 1.1em; }
    a { color: #2563eb; text-decoration: none; }
    blockquote {
      color: #64748b;
      border-left: 4px solid #e2e8f0;
      padding: 0.5em 1em;
      background: #f8fafc;
      border-radius: 0 4px 4px 0;
    }
    code {
      padding: 2px 4px;
      margin: 0 2px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #e11d48;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.85em;
      vertical-align: middle;
      display: inline-block;
      line-height: 1.2;
    }
    pre {
      overflow-x: auto;
      padding: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #f8fafc;
      font-size: 0.9em;
      line-height: 1.5;
    }
    pre code {
      padding: 0;
      background: transparent;
      color: inherit;
    }
    .hljs-keyword { color: #7c3aed; font-weight: bold; }
    .hljs-string { color: #0891b2; }
    .hljs-comment { color: #94a3b8; font-style: italic; }
    .hljs-number { color: #d97706; }
    .hljs-title, .hljs-built_in { color: #2563eb; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5em;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 10px 12px;
      text-align: left;
    }
    th { background: #f8fafc; font-weight: 600; }
    img {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 1.5em auto;
      border-radius: 4px;
    }
    hr {
      border: 0;
      border-top: 1px solid #e2e8f0;
      margin: 2em 0;
    }
    li { margin-bottom: 0.4em; }
    input[type="checkbox"] { margin-right: 0.5em; }
`;

export function buildHtmlDocument(title: string, bodyHtml: string): string {
  const safeTitle = escapeHtml(title || 'untitled');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <style>
    ${getCommonStyles()}
    body {
      background: #f1f5f9;
    }
    main {
      background: #ffffff;
      padding: 60px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
      border-radius: 8px;
      margin-top: 40px;
      margin-bottom: 40px;
    }
  </style>
</head>
<body>
  <main id="export-content">
${bodyHtml}
  </main>
</body>
</html>`;
}

const renderMarkdownToHtml = (content: string) => {
  const rawHtml = renderToStaticMarkup(
    React.createElement(ReactMarkdown, {
      remarkPlugins: [remarkGfm],
      components: {
        img: ({ src = '', alt = '' }) => React.createElement('img', {
          src: resolveExportImageUrl(String(src)),
          alt: String(alt || ''),
        }),
        code: ({ className = '', children, ...props }: any) => {
          const rawCode = String(children ?? '').replace(/\n$/, '');
          const language = String(className).match(/language-([\w-]+)/)?.[1] || 'text';
          const isBlock = rawCode.includes('\n') || String(className).includes('language-');

          if (!isBlock) {
            return React.createElement('code', props, children);
          }

          return React.createElement('code', {
            ...props,
            className,
            dangerouslySetInnerHTML: { __html: highlightCodeToHtml(language, rawCode) },
          });
        },
      },
    }, content)
  );
  return DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
};

const waitForPdfRender = async (root: HTMLElement) => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  if ('fonts' in document) {
    await document.fonts.ready.catch(() => undefined);
  }

  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(images.map((image) => {
    if (image.complete) return Promise.resolve();

    return new Promise<void>((resolve) => {
      const done = () => resolve();
      image.addEventListener('load', done, { once: true });
      image.addEventListener('error', done, { once: true });
    });
  }));
};

export function exportAsHtml(fileName: string, content: string): void {
  const title = getTitle(fileName);
  const safeHtml = renderMarkdownToHtml(content);
  const htmlDocument = buildHtmlDocument(title, safeHtml);
  const targetName = changeExtension(fileName || 'untitled.html', '.html');
  const blob = new Blob([htmlDocument], { type: 'text/html;charset=utf-8' });
  downloadBlob(targetName, blob);
}

export async function exportAsPdf(fileName: string, content: string): Promise<void> {
  const title = getTitle(fileName);
  const safeHtml = renderMarkdownToHtml(content);

  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.minHeight = '1123px';
  container.style.backgroundColor = 'white';
  container.style.color = '#1e293b';
  container.style.zIndex = '2147483647';
  container.style.pointerEvents = 'none';
  container.style.overflow = 'visible';

  container.innerHTML = `
    <style>
      ${getCommonStyles()}
      .pdf-export-content {
        width: 714px;
        max-width: none;
        min-height: 1043px;
        box-sizing: border-box;
        margin: 0;
        padding: 40px;
        background: #ffffff;
        color: #1e293b;
      }
      .pdf-export-content * {
        box-sizing: border-box;
      }
    </style>
    <main class="pdf-export-content">
      ${safeHtml}
    </main>
  `;

  document.body.appendChild(container);

  try {
    const html2pdf = await getHtml2Pdf();
    const targetName = changeExtension(fileName || 'untitled.pdf', '.pdf');
    const exportTarget = container.querySelector('.pdf-export-content') as HTMLElement | null;

    if (!exportTarget || exportTarget.scrollHeight === 0 || exportTarget.textContent === null) {
      throw new Error('PDF 内容渲染失败');
    }

    await waitForPdfRender(exportTarget);

    const opt = {
      margin: 10,
      filename: targetName,
      image: { type: 'jpeg' as const, quality: 0.98 },
      pagebreak: { mode: ['css', 'legacy'] },
      html2canvas: {
        scale: Math.min(2, window.devicePixelRatio || 1.5),
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollY: 0,
        scrollX: 0,
        windowWidth: 794,
        windowHeight: Math.max(1123, exportTarget.scrollHeight),
      },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    await html2pdf().set(opt).from(exportTarget).save();
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error instanceof Error
      ? new Error(`PDF 导出失败：${error.message}`)
      : new Error('PDF 导出失败，建议使用导出 HTML 后手动打印');
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
