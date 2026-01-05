import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';

interface ResizablePanelProps {
  children: [ReactNode, ReactNode]; // Left and right panels
  defaultRightWidth?: number; // Default width for right panel in pixels (or left if resizeLeft=true)
  minRightWidth?: number; // Minimum width for right panel (or left if resizeLeft=true)
  maxRightWidth?: number; // Maximum width for right panel (or left if resizeLeft=true)
  minOppositePanelWidth?: number; // Minimum width for the OTHER panel (ensures it never gets too small)
  storageKey?: string; // localStorage key for persistence
  className?: string;
  resizeLeft?: boolean; // If true, the LEFT panel is resizable instead of right
}

export function ResizablePanel({
  children,
  defaultRightWidth = 506,
  minRightWidth = 320,
  maxRightWidth = 800,
  minOppositePanelWidth = 400, // Minimum width for the opposite panel
  storageKey,
  className = '',
  resizeLeft = false,
}: ResizablePanelProps) {
  const [panelWidth, setPanelWidth] = useState(() => {
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
      localStorage.setItem(storageKey, panelWidth.toString());
    }
  }, [panelWidth, storageKey]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = panelWidth;
  }, [panelWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    // Get container width to calculate dynamic max
    const containerWidth = containerRef.current.offsetWidth;

    // Calculate the maximum width allowed for the resizable panel
    // ensuring the opposite panel has at least minOppositePanelWidth
    const dynamicMaxWidth = Math.min(maxRightWidth, containerWidth - minOppositePanelWidth - 10); // 10px for divider

    // Calculate delta based on which panel is resizable
    // For right panel: dragging left increases width, dragging right decreases
    // For left panel: dragging right increases width, dragging left decreases
    const delta = resizeLeft
      ? e.clientX - startXRef.current
      : startXRef.current - e.clientX;

    const newWidth = Math.min(
      dynamicMaxWidth,
      Math.max(minRightWidth, startWidthRef.current + delta)
    );

    setPanelWidth(newWidth);
  }, [isDragging, minRightWidth, maxRightWidth, minOppositePanelWidth, resizeLeft]);

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
      {/* Left Panel */}
      <div
        className={resizeLeft ? "flex-shrink-0 h-full overflow-hidden" : "flex-1 min-w-0 h-full overflow-hidden"}
        style={resizeLeft ? { width: `${panelWidth}px` } : undefined}
      >
        {leftPanel}
      </div>

      {/* Resizable Divider */}
      <div
        className={`relative flex-shrink-0 w-px group cursor-col-resize ${isDragging ? 'z-50' : ''}`}
        onMouseDown={handleMouseDown}
      >
        {/* Invisible hit area for easier grabbing */}
        <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize" />

        {/* Visible divider line - full height */}
        <div
          className={`absolute inset-y-0 left-0 w-px transition-colors ${
            isDragging
              ? 'bg-primary w-[2px]'
              : 'bg-gray-200 group-hover:bg-gray-400'
          }`}
        />
      </div>

      {/* Right Panel */}
      <div
        className={resizeLeft ? "flex-1 h-full overflow-hidden" : "flex-shrink-0 h-full overflow-hidden"}
        style={resizeLeft ? { minWidth: `${minOppositePanelWidth}px` } : { width: `${panelWidth}px` }}
      >
        {rightPanel}
      </div>
    </div>
  );
}

export default ResizablePanel;
