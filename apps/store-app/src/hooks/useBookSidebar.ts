/**
 * useBookSidebar Hook
 * Manages sidebar open/closed state with localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'book-sidebar-open';

export function useBookSidebar(defaultOpen = true) {
  // Initialize from localStorage or use default
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultOpen;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
    return defaultOpen;
  });

  // Persist to localStorage when state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isOpen));
  }, [isOpen]);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    toggle,
    open,
    close,
  };
}
