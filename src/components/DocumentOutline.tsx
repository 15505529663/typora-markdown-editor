import React from 'react';
import { OutlineItem } from '../lib/outline';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DocumentOutlineProps {
  outline: OutlineItem[];
  currentLine: number;
  onItemClick: (item: OutlineItem) => void;
}

const DocumentOutline: React.FC<DocumentOutlineProps> = ({ outline, currentLine, onItemClick }) => {
  if (outline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 p-4 text-center select-none">
        <p className="text-sm">No structure found</p>
        <p className="text-xs mt-1">Add some headings to see the outline</p>
      </div>
    );
  }

  // Find current active heading
  const activeIndex = outline.reduce((prev, curr, index) => {
    if (curr.line <= currentLine) {
      return index;
    }
    return prev;
  }, -1);

  return (
    <div className="sidebar-panel flex flex-col h-full w-full overflow-y-auto p-2 space-y-0.5">
      {outline.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            "outline-item px-3 py-1.5 rounded-md cursor-pointer transition-colors text-sm truncate",
            index === activeIndex
              ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium"
              : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          )}
          style={{ paddingLeft: `${(item.level - 1) * 12 + 12}px` }}
          onClick={() => onItemClick(item)}
          title={item.text}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
};

export default DocumentOutline;
