/**
 * useSidebarWidth Hook
 *
 * Manages sidebar width state including:
 * - Fixed pixel width
 * - Percentage-based width
 * - Custom percentage width
 * - Preview mode for width changes
 * - CSS custom property updates for PendingSectionFooter positioning
 *
 * US-014: Migrated from localStorage to Redux for centralized state management.
 * State is persisted via Redux viewState (which still uses localStorage for persistence).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectStaffSidebarWidth,
  selectStaffSidebarWidthType,
  selectStaffSidebarWidthPercentage,
  setStaffSidebarWidth,
  setStaffSidebarWidthType,
  setStaffSidebarWidthPercentage,
  setStaffSidebarWidthSettings,
} from '@/store/slices/frontDeskSettingsSlice';

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
  const dispatch = useAppDispatch();

  // Get sidebar width state from Redux
  const sidebarWidth = useAppSelector(selectStaffSidebarWidth);
  const widthType = useAppSelector(selectStaffSidebarWidthType);
  const widthPercentage = useAppSelector(selectStaffSidebarWidthPercentage);

  // Custom width popup state (local UI state, not persisted)
  const [showCustomWidthPopup, setShowCustomWidthPopup] = useState(false);
  const customWidthPopupRef = useRef<HTMLDivElement>(null);

  // Original width values for preview mode (local state)
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalWidthType, setOriginalWidthType] = useState('');
  const [originalWidthPercentage, setOriginalWidthPercentage] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Wrapper functions to dispatch Redux actions
  const setSidebarWidth = useCallback((width: number) => {
    dispatch(setStaffSidebarWidth(width));
  }, [dispatch]);

  const setWidthType = useCallback((type: string) => {
    dispatch(setStaffSidebarWidthType(type as 'fixed' | 'percentage' | 'customPercentage'));
  }, [dispatch]);

  const setWidthPercentage = useCallback((percentage: number) => {
    dispatch(setStaffSidebarWidthPercentage(percentage));
  }, [dispatch]);

  // Save original width before preview
  const saveOriginalWidth = useCallback(() => {
    setOriginalWidth(sidebarWidth);
    setOriginalWidthType(widthType);
    setOriginalWidthPercentage(widthPercentage);
    setIsPreviewMode(true);
  }, [sidebarWidth, widthType, widthPercentage]);

  // Restore original width when cancelling preview
  const restoreOriginalWidth = useCallback(() => {
    dispatch(setStaffSidebarWidthSettings({
      width: originalWidth,
      widthType: originalWidthType as 'fixed' | 'percentage' | 'customPercentage',
      widthPercentage: originalWidthPercentage,
    }));
    setIsPreviewMode(false);
  }, [dispatch, originalWidth, originalWidthType, originalWidthPercentage]);

  // Apply width settings based on the selected view width
  const applyWidthSettings = useCallback((viewWidth: string, customPercentage: number) => {
    const windowWidth = window.innerWidth;

    switch (viewWidth) {
      case 'ultraCompact':
        dispatch(setStaffSidebarWidthSettings({
          width: 100,
          widthType: 'fixed',
          widthPercentage: 0,
        }));
        break;

      case 'compact':
        dispatch(setStaffSidebarWidthSettings({
          width: 300,
          widthType: 'fixed',
          widthPercentage: 0,
        }));
        break;

      case 'wide':
        dispatch(setStaffSidebarWidthSettings({
          width: Math.round(windowWidth * 0.4),
          widthType: 'percentage',
          widthPercentage: 40,
        }));
        break;

      case 'fullScreen':
        dispatch(setStaffSidebarWidthSettings({
          width: windowWidth,
          widthType: 'percentage',
          widthPercentage: 100,
        }));
        break;

      case 'custom':
        if (customPercentage >= 10 && customPercentage <= 80) {
          dispatch(setStaffSidebarWidthSettings({
            width: Math.round(windowWidth * customPercentage / 100),
            widthType: 'customPercentage',
            widthPercentage: customPercentage,
          }));
        }
        break;
    }

    setIsPreviewMode(false);
  }, [dispatch]);

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
        // Only dispatch if the width actually changed to avoid loops
        if (newWidth !== sidebarWidth) {
          dispatch(setStaffSidebarWidth(newWidth));
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once to set initial width

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [dispatch, widthType, widthPercentage, sidebarWidth]);

  // Initialize CSS custom property on mount for PendingSectionFooter positioning
  useEffect(() => {
    document.documentElement.style.setProperty('--staff-sidebar-width', `${sidebarWidth}px`);
  }, [sidebarWidth]);

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
