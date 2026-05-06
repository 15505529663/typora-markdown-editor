import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { normalizeCodeLanguage, getLanguageLabel, ensureHighlightLanguage, hljs } from './codeLanguages';
import { openLanguageMenu } from './codeBlockLanguages';

class LanguageBadgeWidget extends WidgetType {
  constructor(
    private language: string,
    private fenceFrom: number,
    private fenceTo: number
  ) {
    super();
  }

  toDOM(view: EditorView): HTMLElement {
    const badge = document.createElement('button');
    badge.className = 'cm-code-language-badge';
    badge.textContent = getLanguageLabel(this.language);
    badge.title = '点击切换语言';
    badge.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openLanguageMenu(view, badge, this.fenceFrom, this.fenceTo, this.language);
    });
    return badge;
  }

  eq(other: LanguageBadgeWidget): boolean {
    return this.language === other.language && this.fenceFrom === other.fenceFrom;
  }
}

/**
 * 使用 highlight.js 对代码块内容进行高亮处理，并生成 Decoration.mark
 */
function highlightCodeBlock(
  text: string, 
  language: string, 
  startPos: number, 
  builder: RangeSetBuilder<Decoration>
) {
  try {
    const highlightLanguage = ensureHighlightLanguage(language);
    if (highlightLanguage === 'plaintext') return;

    const highlighted = hljs.highlight(text, {
      language: highlightLanguage,
      ignoreIllegals: true,
    });

    // 简单的 HTML 标签解析器，用于提取 hljs 生成的类名和范围
    // 注意：highlight.js 的输出是嵌套的，我们需要处理嵌套
    let currentPos = 0;
    const stack: { class: string; start: number }[] = [];
    
    // 使用正则匹配 HTML 标签或纯文本
    const tagRegex = /<span class="([^"]+)">|<\/span>|[^<]+/g;
    let match;

    while ((match = tagRegex.exec(highlighted.value)) !== null) {
      const fullMatch = match[0];
      if (fullMatch.startsWith('<span')) {
        stack.push({ class: match[1], start: currentPos });
      } else if (fullMatch === '</span>') {
        const last = stack.pop();
        if (last) {
          const from = startPos + last.start;
          const to = startPos + currentPos;
          if (to > from) {
            builder.add(from, to, Decoration.mark({ class: last.class }));
          }
        }
      } else {
        // 纯文本，需要处理 HTML 实体转义
        const unescapedText = fullMatch
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        currentPos += unescapedText.length;
      }
    }
  } catch (error) {
    console.warn('Highlight failed:', error);
  }
}

function buildDecorations(view: EditorView): DecorationSet {
  const lineDecorations: { from: number; decoration: Decoration }[] = [];
  const markDecorations: { from: number; to: number; decoration: Decoration }[] = [];
  const widgetDecorations: { from: number; decoration: Decoration }[] = [];

  const doc = view.state.doc;
  const selection = view.state.selection.main;

  let inCodeBlock = false;
  let currentLanguage = '';
  let blockStartPos = -1;
  let codeBlockContent = '';
  let codeBlockLines: { from: number; to: number }[] = [];

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const text = line.text;

    if (!inCodeBlock) {
      const match = text.match(/^(\s*)```([^\s`]*)?/);
      if (match) {
        inCodeBlock = true;
        currentLanguage = match[2] || 'text';
        blockStartPos = line.from;
        codeBlockContent = '';
        codeBlockLines = [];
        
        const isSelected = selection.from <= line.to && selection.to >= line.from;
        
        lineDecorations.push({ 
          from: line.from, 
          decoration: Decoration.line({ class: `cm-code-block-line cm-code-block-start` }) 
        });

        if (!isSelected) {
          markDecorations.push({ from: line.from, to: line.to, decoration: Decoration.replace({}) });
        }
      }
    } else {
      const match = text.match(/^(\s*)```\s*$/);
      if (match) {
        inCodeBlock = false;
        const isSelected = selection.from <= line.to && selection.to >= line.from;
        
        lineDecorations.push({ 
          from: line.from, 
          decoration: Decoration.line({ class: `cm-code-block-line cm-code-block-end` }) 
        });

        if (!isSelected) {
          markDecorations.push({ from: line.from, to: line.to, decoration: Decoration.replace({}) });
        }
        
        widgetDecorations.push({ 
          from: line.to, 
          decoration: Decoration.widget({
            widget: new LanguageBadgeWidget(currentLanguage, blockStartPos, line.to),
            side: 1
          }) 
        });

        if (codeBlockContent && codeBlockLines.length > 0) {
          // Temporarily store marks to sort them later
          const blockMarks: { from: number; to: number; decoration: Decoration }[] = [];
          const tempBuilder = {
            add: (from: number, to: number, deco: Decoration) => {
              blockMarks.push({ from, to, decoration: deco });
            }
          };
          highlightCodeBlock(codeBlockContent, currentLanguage, codeBlockLines[0].from, tempBuilder as any);
          markDecorations.push(...blockMarks);
        }
      } else {
        lineDecorations.push({ 
          from: line.from, 
          decoration: Decoration.line({ class: 'cm-code-block-line cm-code-highlight' }) 
        });
        codeBlockLines.push({ from: line.from, to: line.to });
        codeBlockContent += text + '\n';
      }
    }
  }

  const builder = new RangeSetBuilder<Decoration>();
  
  // Sort all decorations by 'from' position to satisfy RangeSetBuilder requirement
  // For ranges starting at the same position, the one ending later must come first
  const allDecorations = [
    ...lineDecorations.map(d => ({ ...d, to: d.from, type: 'line' })),
    ...markDecorations.map(d => ({ ...d, type: 'mark' })),
    ...widgetDecorations.map(d => ({ ...d, to: d.from, type: 'widget' }))
  ].sort((a, b) => a.from - b.from || b.to - a.to);

  try {
     const docLength = view.state.doc.length;
     for (const deco of allDecorations) {
       // Ensure we don't add empty ranges for marks unless it's a widget or line deco
       if (deco.type === 'mark' && deco.from === deco.to) continue;
       // Boundary check
       if (deco.from < 0 || deco.to > docLength || deco.from > deco.to) continue;
       
       builder.add(deco.from, deco.to, deco.decoration);
     }
   } catch (e) {
    console.error('Error building decorations:', e);
  }

  return builder.finish();
}

export const typoraLikeCodeBlockDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
