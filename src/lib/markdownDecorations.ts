import { Range } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';

const hiddenMarker = Decoration.replace({
  inclusive: false,
});

const headingLine = (level: number) => Decoration.line({
  class: `cm-md-heading-line cm-md-h${level}-line`,
});

const headingText = (level: number) => Decoration.mark({
  class: `cm-md-heading cm-md-h${level}`,
});

const inlineStyles = {
  bold: Decoration.mark({ class: 'cm-md-bold' }),
  italic: Decoration.mark({ class: 'cm-md-italic' }),
  strike: Decoration.mark({ class: 'cm-md-strike' }),
  code: Decoration.mark({ class: 'cm-md-inline-code' }),
  underline: Decoration.mark({ class: 'cm-md-underline' }),
};

interface InlineMatch {
  from: number;
  to: number;
  contentFrom: number;
  contentTo: number;
  markers: Array<{ from: number; to: number }>;
  style: keyof typeof inlineStyles;
}

const selectionTouchesRange = (view: EditorView, from: number, to: number) => {
  return view.state.selection.ranges.some((range) => {
    if (range.empty) {
      return range.head >= from && range.head <= to;
    }
    return range.from < to && range.to > from;
  });
};

const activeLineNumbers = (view: EditorView) => {
  const active = new Set<number>();
  const doc = view.state.doc;

  view.state.selection.ranges.forEach((range) => {
    const fromLine = doc.lineAt(range.from);
    const toLine = doc.lineAt(range.empty ? range.to : Math.max(range.from, range.to - 1));
    for (let lineNo = fromLine.number; lineNo <= toLine.number; lineNo += 1) {
      active.add(lineNo);
    }
  });

  return active;
};

const rangesOverlap = (aFrom: number, aTo: number, bFrom: number, bTo: number) => {
  return aFrom < bTo && bFrom < aTo;
};

const pushInlineMatch = (matches: InlineMatch[], match: InlineMatch) => {
  const overlaps = matches.some((existing) => rangesOverlap(match.from, match.to, existing.from, existing.to));
  if (!overlaps && match.contentFrom < match.contentTo) {
    matches.push(match);
  }
};

const collectInlineMatches = (lineText: string, lineFrom: number) => {
  const matches: InlineMatch[] = [];

  const collect = (
    regex: RegExp,
    style: keyof typeof inlineStyles,
    beforeLength: number,
    afterLength: number
  ) => {
    for (const match of lineText.matchAll(regex)) {
      if (match.index === undefined) continue;
      const from = lineFrom + match.index;
      const fullText = match[0];
      const to = from + fullText.length;
      const contentFrom = from + beforeLength;
      const contentTo = to - afterLength;

      pushInlineMatch(matches, {
        from,
        to,
        contentFrom,
        contentTo,
        markers: [
          { from, to: contentFrom },
          { from: contentTo, to },
        ],
        style,
      });
    }
  };

  collect(/<u>([^<\n]+?)<\/u>/g, 'underline', 3, 4);
  collect(/`([^`\n]+?)`/g, 'code', 1, 1);
  collect(/\*\*([^*\n]+?)\*\*/g, 'bold', 2, 2);
  collect(/~~([^~\n]+?)~~/g, 'strike', 2, 2);
  collect(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, 'italic', 1, 1);
  collect(/(?<!_)_([^_\n]+?)_(?!_)/g, 'italic', 1, 1);

  return matches.sort((a, b) => a.from - b.from || a.to - b.to);
};

const buildDecorations = (view: EditorView) => {
  const ranges: Array<Range<Decoration>> = [];

  try {
    const activeLines = activeLineNumbers(view);

    for (let lineNo = 1; lineNo <= view.state.doc.lines; lineNo += 1) {
      const line = view.state.doc.line(lineNo);
      const lineText = line.text;
      const isActiveLine = activeLines.has(lineNo);

      const heading = lineText.match(/^(\s*)(#{1,6})\s+(.+)$/);
      if (heading && !isActiveLine) {
        const level = heading[2].length;
        const markerFrom = line.from + heading[1].length;
        const markerTo = markerFrom + heading[2].length + 1;
        const contentFrom = markerTo;

        if (markerFrom <= markerTo && markerTo <= line.to) {
          ranges.push(headingLine(level).range(line.from));
          ranges.push(hiddenMarker.range(markerFrom, markerTo));
          ranges.push(headingText(level).range(contentFrom, line.to));
        }
        continue;
      }

      if (isActiveLine) continue;

      const inlineMatches = collectInlineMatches(lineText, line.from);
      inlineMatches.forEach((match) => {
        if (selectionTouchesRange(view, match.from, match.to)) return;

        match.markers.forEach((marker) => {
          if (marker.from >= 0 && marker.to <= view.state.doc.length && marker.from <= marker.to) {
            ranges.push(hiddenMarker.range(marker.from, marker.to));
          }
        });
        if (match.contentFrom >= 0 && match.contentTo <= view.state.doc.length && match.contentFrom < match.contentTo) {
          ranges.push(inlineStyles[match.style].range(match.contentFrom, match.contentTo));
        }
      });
    }

    return Decoration.set(ranges, true);
  } catch (error) {
    console.warn('Markdown decorations disabled for this update', error);
    return Decoration.none;
  }
};

export const typoraLikeMarkdownDecorations = () => {
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
