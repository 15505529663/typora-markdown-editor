import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import remarkGfm from 'remark-gfm';

interface PreviewProps {
  content: string;
}

const Preview: React.FC<PreviewProps> = ({ content }) => {
  // Sanitize the content before rendering
  const sanitizedContent = useMemo(() => DOMPurify.sanitize(content), [content]);
  
  return (
    <div className="markdown-preview prose prose-slate dark:prose-invert max-w-none h-full overflow-y-auto px-4 py-6">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
};

export default Preview;
