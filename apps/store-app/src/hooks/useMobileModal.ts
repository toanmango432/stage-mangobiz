import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for mobile-responsive modal behaviors
 * Handles touch gestures, viewport adjustments, and mobile-specific interactions
 */
export function useMobileModal(isOpen: boolean) {
  const [isMobile, setIsMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle viewport changes (keyboard on mobile)
  useEffect(() => {
    const handleViewportChange = () => {
      const newHeight = window.innerHeight;
      setViewportHeight(newHeight);

      // Detect keyboard visibility on mobile
      if (isMobile) {
        const threshold = window.screen.height * 0.75;
        setIsKeyboardVisible(newHeight < threshold);
      }
    };

    if (isOpen) {
      handleViewportChange();
      window.addEventListener('resize', handleViewportChange);
      window.visualViewport?.addEventListener('resize', handleViewportChange);

      return () => {
        window.removeEventListener('resize', handleViewportChange);
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
      };
    }
  }, [isOpen, isMobile]);

  // Prevent body scroll on mobile when modal is open
  useEffect(() => {
    if (!isOpen || !isMobile) return;

    const originalStyle = document.body.style.cssText;
    document.body.style.cssText = `
      position: fixed;
      top: -${window.scrollY}px;
      left: 0;
      right: 0;
      overflow: hidden;
    `;

    return () => {
      const scrollY = document.body.style.top;
      document.body.style.cssText = originalStyle;
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    };
  }, [isOpen, isMobile]);

  // Handle safe area insets for iOS
  const getSafeAreaInsets = useCallback(() => {
    const computedStyle = getComputedStyle(document.documentElement);
    return {
      top: parseInt(computedStyle.getPropertyValue('--sat') || '0'),
      bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0'),
      left: parseInt(computedStyle.getPropertyValue('--sal') || '0'),
      right: parseInt(computedStyle.getPropertyValue('--sar') || '0'),
    };
  }, []);

  // Touch gesture handlers for swipe-to-close
  const useSwipeToClose = useCallback((onClose: () => void, threshold = 100) => {
    let startY = 0;
    let currentY = 0;
    let modalElement: HTMLElement | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      modalElement = (e.target as HTMLElement).closest('[role="dialog"]') as HTMLElement;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!modalElement) return;
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      if (diff > 0) {
        modalElement.style.transform = `translateY(${diff}px)`;
        modalElement.style.opacity = `${1 - diff / 300}`;
      }
    };

    const handleTouchEnd = () => {
      if (!modalElement) return;
      const diff = currentY - startY;

      if (diff > threshold) {
        onClose();
      } else {
        modalElement.style.transform = '';
        modalElement.style.opacity = '';
      }

      startY = 0;
      currentY = 0;
      modalElement = null;
    };

    if (isMobile && isOpen) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isMobile, isOpen]);

  return {
    isMobile,
    viewportHeight,
    isKeyboardVisible,
    getSafeAreaInsets,
    useSwipeToClose,
    modalClasses: {
      container: isMobile ? 'h-full' : '',
      content: isKeyboardVisible ? 'pb-0' : 'pb-safe',
    },
  };
}

// Helper hook for responsive breakpoints
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isMobileOrTablet: breakpoint === 'mobile' || breakpoint === 'tablet',
  };
}