import { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useMobileModal';

interface MobileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /**
   * Full screen on mobile (default: true)
   * When false, shows as bottom sheet with drag handle
   */
  fullScreenOnMobile?: boolean;
  /**
   * Show drag handle for swipe-to-close (only when not fullscreen)
   */
  showDragHandle?: boolean;
  /**
   * Height snap points as percentages [0.5, 0.9] = 50%, 90%
   * Only used when fullScreenOnMobile is false
   */
  snapPoints?: number[];
  /**
   * Additional className for the sheet container
   */
  className?: string;
  /**
   * Whether to show close button
   */
  showCloseButton?: boolean;
}

/**
 * MobileSheet Component
 *
 * A responsive modal component that renders as:
 * - Full-screen sheet on mobile (swipe down to close)
 * - Bottom sheet on tablet (with snap points)
 * - Centered modal on desktop
 *
 * Features:
 * - Swipe-to-close gesture on mobile
 * - Body scroll lock when open
 * - Safe area padding for notched devices
 * - Keyboard-aware positioning
 */
export function MobileSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  fullScreenOnMobile = true,
  showDragHandle = true,
  snapPoints = [0.9],
  className = '',
  showCloseButton = true,
}: MobileSheetProps) {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentSnapIndex, setCurrentSnapIndex] = useState(snapPoints.length - 1);

  const isFullScreen = isMobile && fullScreenOnMobile;
  const isBottomSheet = (isMobile && !fullScreenOnMobile) || isTablet;
  const isCenteredModal = isDesktop;

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;

    const originalStyle = document.body.style.cssText;
    const scrollY = window.scrollY;

    document.body.style.cssText = `
      position: fixed;
      top: -${scrollY}px;
      left: 0;
      right: 0;
      overflow: hidden;
    `;

    return () => {
      document.body.style.cssText = originalStyle;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTranslateY(0);
      setIsDragging(false);
      setCurrentSnapIndex(snapPoints.length - 1);
    }
  }, [isOpen, snapPoints.length]);

  // Handle drag start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isFullScreen && !isBottomSheet) return;
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  }, [isFullScreen, isBottomSheet]);

  // Handle drag move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;

    // Only allow dragging down (positive values)
    if (diff > 0) {
      setTranslateY(diff);
    }
  }, [isDragging, startY]);

  // Handle drag end
  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // If dragged more than 100px down, close the modal
    if (translateY > 100) {
      onClose();
    } else {
      // Snap back
      setTranslateY(0);
    }
  }, [isDragging, translateY, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate height based on snap points
  const sheetHeight = isBottomSheet
    ? `${snapPoints[currentSnapIndex] * 100}vh`
    : isFullScreen
    ? '100vh'
    : 'auto';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
        className={`
          fixed z-50 bg-white overflow-hidden
          transition-transform duration-300 ease-out
          ${isFullScreen ? 'inset-0' : ''}
          ${isBottomSheet ? 'left-0 right-0 bottom-0 rounded-t-2xl' : ''}
          ${isCenteredModal ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl max-w-lg w-[calc(100%-2rem)] max-h-[90vh]' : ''}
          ${className}
        `}
        style={{
          height: sheetHeight,
          transform: translateY > 0
            ? `translateY(${translateY}px)${isCenteredModal ? ' translate(-50%, -50%)' : ''}`
            : undefined,
          transition: isDragging ? 'none' : undefined,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle - for bottom sheets */}
        {showDragHandle && (isBottomSheet || isFullScreen) && (
          <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div className={`flex items-center justify-between px-4 ${showDragHandle ? 'pb-3' : 'py-4'} border-b border-gray-200`}>
            <div className="flex-1 min-w-0">
              {title && (
                <h2
                  id="sheet-title"
                  className="text-lg font-bold text-gray-900 truncate"
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 truncate">{subtitle}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <X size={24} className="text-gray-500" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className={`
            flex-1 overflow-y-auto overscroll-contain
            ${isFullScreen ? 'pb-safe' : ''}
          `}
          style={{
            maxHeight: isFullScreen
              ? `calc(100vh - ${title ? '120px' : '60px'} - ${footer ? '80px' : '0px'})`
              : isCenteredModal
              ? '60vh'
              : `calc(${sheetHeight} - ${title ? '80px' : '40px'} - ${footer ? '80px' : '0px'})`,
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={`border-t border-gray-200 px-4 py-3 bg-white ${isFullScreen ? 'pb-safe' : ''}`}>
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * MobileSheetContent
 *
 * A wrapper for sheet content with consistent padding
 */
export function MobileSheetContent({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`px-4 py-4 ${className}`}>{children}</div>;
}

/**
 * MobileSheetFooter
 *
 * A standardized footer layout for action buttons
 */
export function MobileSheetFooter({
  children,
  stacked = false,
  className = '',
}: {
  children: React.ReactNode;
  stacked?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`
        flex gap-3
        ${stacked ? 'flex-col' : 'flex-row'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * MobileSheetButton
 *
 * A touch-optimized button for sheet actions
 */
export function MobileSheetButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}) {
  const variants = {
    primary: 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        min-h-[48px] px-6 py-3 rounded-xl font-semibold
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${fullWidth ? 'w-full' : ''}
        ${variants[variant]}
        ${className}
      `}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}
