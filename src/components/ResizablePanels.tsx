'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface ResizablePanelsProps {
  topPanel: ReactNode;
  bottomPanel: ReactNode;
  defaultTopHeight?: number;
  minTopHeight?: number;
  minBottomHeight?: number;
}

export function ResizablePanels({
  topPanel,
  bottomPanel,
  defaultTopHeight = 60,
  minTopHeight = 30,
  minBottomHeight = 20,
}: ResizablePanelsProps) {
  const [topHeight, setTopHeight] = useState(defaultTopHeight);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerHeight = containerRect.height;
      const mouseY = e.clientY - containerRect.top;
      const newTopHeight = (mouseY / containerHeight) * 100;

      if (newTopHeight >= minTopHeight && newTopHeight <= 100 - minBottomHeight) {
        setTopHeight(newTopHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minTopHeight, minBottomHeight]);

  return (
    <div ref={containerRef} className="flex flex-col h-full overflow-hidden">
      <div
        style={{ height: `${topHeight}%` }}
        className="overflow-hidden"
      >
        {topPanel}
      </div>
      
      <div
        className="h-1 bg-border hover:bg-primary/50 cursor-row-resize transition-colors relative group"
        onMouseDown={() => setIsDragging(true)}
      >
        <div className="absolute inset-x-0 -top-1 -bottom-1" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 bg-muted-foreground/50 rounded-full group-hover:bg-primary/70 transition-colors" />
      </div>

      <div
        style={{ height: `${100 - topHeight}%` }}
        className="overflow-hidden"
      >
        {bottomPanel}
      </div>
    </div>
  );
}
