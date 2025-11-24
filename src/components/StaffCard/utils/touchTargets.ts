/**
 * Touch Target Utilities
 * Ensures WCAG 2.1 Level AAA compliance for touch targets (44x44px minimum)
 */

export const MIN_TOUCH_TARGET_SIZE = 44; // pixels

/**
 * Calculate if an element meets minimum touch target requirements
 */
export const isTouchTargetValid = (width: number, height: number): boolean => {
  return width >= MIN_TOUCH_TARGET_SIZE && height >= MIN_TOUCH_TARGET_SIZE;
};

/**
 * Get padding needed to expand touch target to minimum size
 */
export const getTouchTargetPadding = (
  currentSize: number,
  minSize: number = MIN_TOUCH_TARGET_SIZE
): number => {
  if (currentSize >= minSize) return 0;
  return Math.ceil((minSize - currentSize) / 2);
};

/**
 * Touch target style generator
 * Creates an invisible expanded hit area for small interactive elements
 */
export const touchTargetStyle = (
  elementWidth: number,
  elementHeight: number
): React.CSSProperties => {
  const paddingX = getTouchTargetPadding(elementWidth);
  const paddingY = getTouchTargetPadding(elementHeight);

  if (paddingX === 0 && paddingY === 0) {
    return {};
  }

  return {
    position: 'relative',
    // Expand clickable area with pseudo-element
    '::before': {
      content: '""',
      position: 'absolute',
      top: -paddingY,
      right: -paddingX,
      bottom: -paddingY,
      left: -paddingX,
    },
  };
};

/**
 * Tailwind classes for minimum touch target
 */
export const TOUCH_TARGET_CLASSES = {
  base: 'min-w-[44px] min-h-[44px]',
  flex: 'min-w-[44px] min-h-[44px] flex items-center justify-center',
  interactive:
    'min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer',
} as const;

/**
 * Get responsive touch target classes based on device
 */
export const getResponsiveTouchTarget = (isMobile: boolean): string => {
  // On mobile, enforce stricter touch targets
  return isMobile
    ? 'min-w-[48px] min-h-[48px] p-2'
    : 'min-w-[44px] min-h-[44px] p-1.5';
};

/**
 * Hook to detect if device is touch-enabled
 */
export const useTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - some browsers don't have this
    navigator.msMaxTouchPoints > 0
  );
};
