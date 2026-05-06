export interface OutlineItem {
  id: string;
  level: number;
  text: string;
  line: number;
  offset: number;
}

export const parseMarkdownOutline = (content: string): OutlineItem[] => {
  const outline: OutlineItem[] = [];
  const lines = content.split('\n');
  let currentOffset = 0;
  let inCodeBlock = false;

  lines.forEach((lineText, index) => {
    // Check for code block
    if (lineText.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }

    if (!inCodeBlock) {
      const headingMatch = lineText.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const rawText = headingMatch[2].trim();
        
        // Basic markdown stripping for outline text
        const cleanText = rawText
          .replace(/[*_`~]/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .trim();

        if (cleanText) {
          outline.push({
            id: `heading-${index}-${cleanText.replace(/\s+/g, '-').toLowerCase()}`,
            level,
            text: cleanText,
            line: index + 1,
            offset: currentOffset
          });
        }
      }
    }
    currentOffset += lineText.length + 1; // +1 for newline
  });

  return outline;
};
