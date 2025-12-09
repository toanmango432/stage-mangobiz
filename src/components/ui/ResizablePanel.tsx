import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizablePanelProps {
  children: [ReactNode, ReactNode]; // Left and right panels
  defaultRightWidth?: number; // Default width for right panel in pixels
  minRightWidth?: number; // Minimum width for right panel
  maxRightWidth?: number; // Maximum width for right panel
  storageKey?: string; // localStorage key for persistence
  className?: string;
}

export function ResizablePanel({
  children,
  defaultRightWidth = 506,
  minRightWidth = 320,
  maxRightWidth = 800,
  storageKey,
  className = '',
}: ResizablePanelProps) {
  const [rightWidth, setRightWidth] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= minRightWidth && parsed <= maxRightWidth) {
          return parsed;
        }
      }
    }
    return defaultRightWidth;
  });

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Persist width to localStorage
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, rightWidth.toString());
    }
  }, [rightWidth, storageKey]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = rightWidth;
  }, [rightWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    // Calculate new width (dragging left increases right panel, dragging right decreases)
    const delta = startXRef.current - e.clientX;
    const newWidth = Math.min(
      maxRightWidth,
      Math.max(minRightWidth, startWidthRef.current + delta)
    );

    setRightWidth(newWidth);
  }, [isDragging, minRightWidth, maxRightWidth]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove global event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const [leftPanel, rightPanel] = children;

  return (
    <div ref={containerRef} className={`flex h-full ${className}`}>
      {/* Left Panel - takes remaining space */}
      <div className="flex-1 min-w-0 h-full overflow-hidden">
        {leftPanel}
      </div>

      {/* Resizable Divider */}
      <div
        className={`relative flex-shrink-0 w-0 group ${isDragging ? 'z-50' : ''}`}
        onMouseDown={handleMouseDown}
      >
        {/* Invisible hit area for easier grabbing */}
        <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize" />

        {/* Visible divider line */}
        <div
          className={`absolute inset-y-0 left-0 w-px transition-colors ${
            isDragging
              ? 'bg-primary'
              : 'bg-border group-hover:bg-primary/50'
          }`}
        />

        {/* Drag handle indicator */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-0 p-1 rounded-md cursor-col-resize transition-all ${
            isDragging
              ? 'bg-primary text-white scale-110'
              : 'bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary'
          }`}
        >
          <GripVertical size={14} />
        </div>
      </div>

      {/* Right Panel - fixed width */}
      <div
        className="flex-shrink-0 h-full overflow-hidden"
        style={{ width: `${rightWidth}px` }}
      >
        {rightPanel}
      </div>
    </div>
  );
}

export default ResizablePanel;
