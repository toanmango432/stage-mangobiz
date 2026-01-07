import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  showHandle?: boolean;
  initialHeight?: 'sm' | 'md' | 'lg' | 'full';
  snapPoints?: number[];
  onHeightChange?: (height: number) => void;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  showCloseButton = true,
  showHandle = true,
  initialHeight = 'md',
  snapPoints = [0.3, 0.7, 0.95],
  onHeightChange,
}) => {
  const [currentHeight, setCurrentHeight] = useState(initialHeight);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const heightMap = {
    sm: 0.3,
    md: 0.7,
    lg: 0.9,
    full: 0.95,
  };

  const currentHeightValue = heightMap[currentHeight];

  // Handle drag gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!showHandle) return;
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setStartHeight(currentHeightValue);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !sheetRef.current) return;
    
    const deltaY = e.touches[0].clientY - startY;
    const newHeight = Math.max(0, Math.min(1, startHeight - deltaY / window.innerHeight));
    
    const closestSnapPoint = snapPoints.reduce((prev, curr) => 
      Math.abs(curr - newHeight) < Math.abs(prev - newHeight) ? curr : prev
    );
    
    setCurrentHeightValue(closestSnapPoint);
    onHeightChange?.(closestSnapPoint);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Snap to closest snap point
    const closestSnapPoint = snapPoints.reduce((prev, curr) => 
      Math.abs(curr - currentHeightValue) < Math.abs(prev - currentHeightValue) ? curr : prev
    );
    
    setCurrentHeightValue(closestSnapPoint);
    onHeightChange?.(closestSnapPoint);
    
    // Close if dragged down significantly
    if (closestSnapPoint < 0.2) {
      onClose();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "relative w-full bg-background rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out",
          "border-t border-border",
          isDragging ? "transition-none" : "",
          className
        )}
        style={{
          height: `${currentHeightValue * 100}%`,
          transform: isDragging ? 'none' : 'translateY(0)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            {title && (
              <h3 className="text-lg font-semibold text-foreground">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

// Hook for managing bottom sheet state
export const useBottomSheet = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [currentHeight, setCurrentHeight] = useState<'sm' | 'md' | 'lg' | 'full'>('md');

  const open = (height: 'sm' | 'md' | 'lg' | 'full' = 'md') => {
    setCurrentHeight(height);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  const toggle = (height: 'sm' | 'md' | 'lg' | 'full' = 'md') => {
    if (isOpen) {
      close();
    } else {
      open(height);
    }
  };

  return {
    isOpen,
    currentHeight,
    open,
    close,
    toggle,
  };
};