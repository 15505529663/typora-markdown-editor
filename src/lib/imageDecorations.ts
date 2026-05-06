import { Range } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { resolveImageUrl } from './imagePath';

interface ImageMatch {
  from: number;
  to: number;
  alt: string;
  src: string;
}

const imageRegex = /!\[([^\]\n]*)\]\(([^)\n]+)\)/g;

const selectionTouchesRange = (view: EditorView, from: number, to: number) => {
  return view.state.selection.ranges.some((range) => {
    if (range.empty) {
      return range.head >= from && range.head <= to;
    }
    return range.from < to && range.to > from;
  });
};

const extractSrc = (rawSrc: string) => {
  const value = rawSrc.trim();
  const titleMatch = value.match(/^(<[^>]+>|"[^"]+"|'[^']+'|\S+)(?:\s+["'][^"']*["'])?$/);
  return titleMatch ? titleMatch[1] : value;
};

class MarkdownImageWidget extends WidgetType {
  constructor(
    private readonly from: number,
    private readonly alt: string,
    private readonly src: string
  ) {
    super();
  }

  eq(other: MarkdownImageWidget) {
    return this.src === other.src && this.alt === other.alt && this.from === other.from;
  }

  toDOM(view: EditorView) {
    const wrapper = document.createElement('figure');
    wrapper.className = 'cm-md-image-widget cm-md-image-loading';
    wrapper.title = '点击编辑图片 Markdown';

    const image = document.createElement('img');
    image.alt = this.alt || 'Markdown image';
    image.loading = 'lazy';
    image.decoding = 'async';

    const caption = document.createElement('figcaption');
    caption.textContent = this.alt || this.src;

    const fallback = document.createElement('div');
    fallback.className = 'cm-md-image-error';
    fallback.textContent = '图片加载失败';

    image.addEventListener('load', () => {
      wrapper.classList.remove('cm-md-image-loading');
      wrapper.classList.add('cm-md-image-loaded');
    });

    image.addEventListener('error', () => {
      wrapper.classList.remove('cm-md-image-loading');
      wrapper.classList.add('cm-md-image-broken');
    });

    image.src = resolveImageUrl(this.src);
    if (image.complete && image.naturalWidth > 0) {
      wrapper.classList.remove('cm-md-image-loading');
      wrapper.classList.add('cm-md-image-loaded');
    }

    wrapper.addEventListener('mousedown', (event) => {
      event.preventDefault();
      if ((view as unknown as { destroyed?: boolean }).destroyed || this.from > view.state.doc.length) return;
      view.dispatch({
        selection: { anchor: this.from },
        scrollIntoView: true,
      });
      view.focus();
    });

    wrapper.append(image, fallback);
    if (this.alt) {
      wrapper.append(caption);
    }

    return wrapper;
  }

  ignoreEvent() {
    return false;
  }
}

const collectImageMatches = (view: EditorView) => {
  const matches: ImageMatch[] = [];

  for (let lineNo = 1; lineNo <= view.state.doc.lines; lineNo += 1) {
    const line = view.state.doc.line(lineNo);
    const text = line.text;
    for (const match of text.matchAll(imageRegex)) {
      if (match.index === undefined) continue;
      const from = line.from + match.index;
      const to = from + match[0].length;
      matches.push({
        from,
        to,
        alt: match[1],
        src: extractSrc(match[2]),
      });
    }
  }

  return matches;
};

const buildDecorations = (view: EditorView) => {
  const ranges: Array<Range<Decoration>> = [];

  try {
    collectImageMatches(view).forEach((match) => {
      if (
        match.from < 0 ||
        match.to > view.state.doc.length ||
        match.from >= match.to ||
        !match.src ||
        selectionTouchesRange(view, match.from, match.to)
      ) {
        return;
      }

      const widget = new MarkdownImageWidget(match.from, match.alt, match.src);
      ranges.push(Decoration.replace({ widget }).range(match.from, match.to));
    });

    return Decoration.set(ranges, true);
  } catch (error) {
    console.warn('Image decorations disabled for this update', error);
    return Decoration.none;
  }
};

export const typoraLikeImageDecorations = () => {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet || update.viewportChanged || update.focusChanged) {
          this.decorations = buildDecorations(update.view);
        }
      }
    },
    {
      decorations: (plugin) => plugin.decorations,
    }
  );
};
