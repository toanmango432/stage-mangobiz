/**
 * useSidebarWidth Hook
 *
 * Manages sidebar width state including:
 * - Fixed pixel width
 * - Percentage-based width
 * - Custom percentage width
 * - Preview mode for width changes
 * - LocalStorage persistence
 * - CSS custom property updates for PendingSectionFooter positioning
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_SIDEBAR_WIDTH, STORAGE_KEYS } from '../constants';

export interface SidebarWidthState {
  sidebarWidth: number;
  widthType: string;
  widthPercentage: number;
  showCustomWidthPopup: boolean;
  isPreviewMode: boolean;
}

export interface SidebarWidthActions {
  setSidebarWidth: (width: number) => void;
  setWidthType: (type: string) => void;
  setWidthPercentage: (percentage: number) => void;
  setShowCustomWidthPopup: (show: boolean) => void;
  applyWidthSettings: (viewWidth: string, customPercentage: number) => void;
  restoreOriginalWidth: () => void;
  saveOriginalWidth: () => void;
  customWidthPopupRef: React.RefObject<HTMLDivElement>;
}

export function useSidebarWidth(): SidebarWidthState & SidebarWidthActions {
  // Initialize sidebar width from localStorage
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem(STORAGE_KEYS.width);
    return savedWidth ? parseInt(savedWidth) : DEFAULT_SIDEBAR_WIDTH;
  });

  // Initialize width type from localStorage
  const [widthType, setWidthType] = useState(() => {
    const savedWidthType = localStorage.getItem(STORAGE_KEYS.widthType);
    return savedWidthType || 'fixed';
  });

  // Initialize width percentage from localStorage
  const [widthPercentage, setWidthPercentage] = useState(() => {
    const savedPercentage = localStorage.getItem(STORAGE_KEYS.widthPercentage);
    return savedPercentage ? parseInt(savedPercentage) : 0;
  });

  // Custom width popup state
  const [showCustomWidthPopup, setShowCustomWidthPopup] = useState(false);
  const customWidthPopupRef = useRef<HTMLDivElement>(null);

  // Original width values for preview mode
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalWidthType, setOriginalWidthType] = useState('');
  const [originalWidthPercentage, setOriginalWidthPercentage] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Save original width before preview
  const saveOriginalWidth = useCallback(() => {
    setOriginalWidth(sidebarWidth);
    setOriginalWidthType(widthType);
    setOriginalWidthPercentage(widthPercentage);
    setIsPreviewMode(true);
  }, [sidebarWidth, widthType, widthPercentage]);

  // Restore original width when cancelling preview
  const restoreOriginalWidth = useCallback(() => {
    setSidebarWidth(originalWidth);
    setWidthType(originalWidthType);
    setWidthPercentage(originalWidthPercentage);
    setIsPreviewMode(false);
  }, [originalWidth, originalWidthType, originalWidthPercentage]);

  // Apply width settings based on the selected view width
  const applyWidthSettings = useCallback((viewWidth: string, customPercentage: number) => {
    const windowWidth = window.innerWidth;

    switch (viewWidth) {
      case 'ultraCompact':
        setWidthType('fixed');
        setSidebarWidth(100);
        setWidthPercentage(0);
        localStorage.setItem(STORAGE_KEYS.widthType, 'fixed');
        localStorage.setItem(STORAGE_KEYS.width, '100');
        localStorage.setItem(STORAGE_KEYS.widthPercentage, '0');
        break;

      case 'compact':
        setWidthType('fixed');
        setSidebarWidth(300);
        setWidthPercentage(0);
        localStorage.setItem(STORAGE_KEYS.widthType, 'fixed');
        localStorage.setItem(STORAGE_KEYS.width, '300');
        localStorage.setItem(STORAGE_KEYS.widthPercentage, '0');
        break;

      case 'wide':
        setWidthType('percentage');
        setWidthPercentage(40);
        setSidebarWidth(Math.round(windowWidth * 0.4));
        localStorage.setItem(STORAGE_KEYS.widthType, 'percentage');
        localStorage.setItem(STORAGE_KEYS.widthPercentage, '40');
        localStorage.setItem(STORAGE_KEYS.width, Math.round(windowWidth * 0.4).toString());
        break;

      case 'fullScreen':
        setWidthType('percentage');
        setWidthPercentage(100);
        setSidebarWidth(windowWidth);
        localStorage.setItem(STORAGE_KEYS.widthType, 'percentage');
        localStorage.setItem(STORAGE_KEYS.widthPercentage, '100');
        localStorage.setItem(STORAGE_KEYS.width, windowWidth.toString());
        break;

      case 'custom':
        if (customPercentage >= 10 && customPercentage <= 80) {
          setWidthType('customPercentage');
          setWidthPercentage(customPercentage);
          setSidebarWidth(Math.round(windowWidth * customPercentage / 100));
          localStorage.setItem(STORAGE_KEYS.widthType, 'customPercentage');
          localStorage.setItem(STORAGE_KEYS.widthPercentage, customPercentage.toString());
          localStorage.setItem(STORAGE_KEYS.width, Math.round(windowWidth * customPercentage / 100).toString());
        }
        break;
    }

    setIsPreviewMode(false);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        customWidthPopupRef.current &&
        !customWidthPopupRef.current.contains(event.target as Node) &&
        showCustomWidthPopup
      ) {
        // Restore original width if clicking outside while in preview mode
        if (isPreviewMode) {
          restoreOriginalWidth();
        }
        setShowCustomWidthPopup(false);
        setIsPreviewMode(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomWidthPopup, isPreviewMode, restoreOriginalWidth]);

  // Update width when window is resized (for percentage-based widths)
  useEffect(() => {
    const handleResize = () => {
      if (widthType === 'percentage' || widthType === 'customPercentage') {
        const windowWidth = window.innerWidth;
        const newWidth = Math.round(windowWidth * widthPercentage / 100);
        setSidebarWidth(newWidth);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once to set initial width

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [widthType, widthPercentage]);

  // Initialize CSS custom property on mount for PendingSectionFooter positioning
  useEffect(() => {
    document.documentElement.style.setProperty('--staff-sidebar-width', `${sidebarWidth}px`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save sidebar width settings to localStorage when they change
  useEffect(() => {
    // Only save to localStorage if not in preview mode
    if (!isPreviewMode) {
      localStorage.setItem(STORAGE_KEYS.width, sidebarWidth.toString());
      localStorage.setItem(STORAGE_KEYS.widthType, widthType);
      localStorage.setItem(STORAGE_KEYS.widthPercentage, widthPercentage.toString());

      // Update CSS custom property for PendingSectionFooter positioning
      document.documentElement.style.setProperty('--staff-sidebar-width', `${sidebarWidth}px`);

      // Dispatch event so PendingSectionFooter can update its position
      window.dispatchEvent(new Event('staffSidebarWidthChanged'));
    }
  }, [sidebarWidth, widthType, widthPercentage, isPreviewMode]);

  return {
    // State
    sidebarWidth,
    widthType,
    widthPercentage,
    showCustomWidthPopup,
    isPreviewMode,
    // Actions
    setSidebarWidth,
    setWidthType,
    setWidthPercentage,
    setShowCustomWidthPopup,
    applyWidthSettings,
    restoreOriginalWidth,
    saveOriginalWidth,
    customWidthPopupRef,
  };
}
