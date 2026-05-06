import React, { useCallback, useEffect, useRef, useState } from 'react';
import { safeGetStorageItem, safeSetStorageItem } from '../lib/storage';

interface ResizableLayoutProps {
  sidebar: React.ReactNode;
  editor: React.ReactNode;
}

const ResizableLayout: React.FC<ResizableLayoutProps> = ({ sidebar, editor }) => {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = safeGetStorageItem(localStorage, 'layout_sidebar_width');
    const parsed = saved ? parseInt(saved, 10) : 280;
    return Number.isFinite(parsed) ? Math.max(180, Math.min(520, parsed)) : 280;
  });

  const minSidebarWidth = 180;
  const maxSidebarWidth = 520;
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizingSidebar = useRef(false);

  useEffect(() => {
    safeSetStorageItem(localStorage, 'layout_sidebar_width', sidebarWidth.toString());
  }, [sidebarWidth]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!containerRef.current || !isResizingSidebar.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeX = event.clientX - containerRect.left;
    setSidebarWidth(Math.max(minSidebarWidth, Math.min(maxSidebarWidth, relativeX)));
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizingSidebar.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.body.style.cursor = 'default';
  }, [handleMouseMove]);

  const handleMouseDownSidebar = () => {
    isResizingSidebar.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp, { once: true });
    document.body.style.cursor = 'col-resize';
  };

  return (
    <div ref={containerRef} className="resizable-layout flex h-full w-full overflow-hidden">
      {sidebar && (
        <>
          <div
            style={{ width: sidebarWidth }}
            className="sidebar-shell flex-shrink-0 flex flex-col h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
          >
            {sidebar}
          </div>
          <div
            onMouseDown={handleMouseDownSidebar}
            className="resize-handle w-1 flex-shrink-0 cursor-col-resize hover:bg-blue-400 dark:hover:bg-blue-600 transition-colors z-10"
          />
        </>
      )}

      <div className="editor-shell flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {editor}
      </div>
    </div>
  );
};

export default ResizableLayout;
