/**
 * Keyboard Shortcuts Hook
 * Global keyboard shortcuts for Book module
 */

import { useEffect, useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import {
  setSelectedDate,
  setViewMode,
  openCreateModal
} from '../store/slices/appointmentsSlice';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  category: 'navigation' | 'actions' | 'views' | 'modals';
  handler: () => void;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  onShowHelp?: () => void;
  onCommandPalette?: () => void;
}

/**
 * Hook to handle global keyboard shortcuts in Book module
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true, onShowHelp, onCommandPalette } = options;
  const dispatch = useAppDispatch();

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Exception: Allow Cmd+K for command palette
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onCommandPalette?.();
      }
      return;
    }

    // Check for modifier keys
    const hasCtrl = event.ctrlKey || event.metaKey; // Cmd on Mac, Ctrl on Windows
    const hasShift = event.shiftKey;
    const hasAlt = event.altKey;

    // Handle shortcuts
    switch (event.key.toLowerCase()) {
      // Show help overlay
      case '?':
        if (hasShift) {
          event.preventDefault();
          onShowHelp?.();
        }
        break;

      // New appointment
      case 'n':
        if (!hasCtrl) {
          event.preventDefault();
          dispatch(openCreateModal());
        }
        break;

      // Command palette
      case 'k':
        if (hasCtrl) {
          event.preventDefault();
          onCommandPalette?.();
        }
        break;

      // Go to today
      case 't':
        if (!hasCtrl && !hasShift) {
          event.preventDefault();
          dispatch(setSelectedDate(new Date().toISOString()));
        }
        break;

      // View mode shortcuts (1-5)
      case '1':
        event.preventDefault();
        dispatch(setViewMode('day'));
        break;
      case '2':
        event.preventDefault();
        dispatch(setViewMode('week'));
        break;
      case '3':
        event.preventDefault();
        dispatch(setViewMode('month'));
        break;
      case '4':
        event.preventDefault();
        dispatch(setViewMode('agenda'));
        break;
      case '5':
        event.preventDefault();
        dispatch(setViewMode('timeline'));
        break;

      // Navigation
      case 'arrowleft':
        if (hasCtrl) {
          event.preventDefault();
          navigateDate('prev');
        }
        break;
      case 'arrowright':
        if (hasCtrl) {
          event.preventDefault();
          navigateDate('next');
        }
        break;

      // Search
      case '/':
        event.preventDefault();
        focusSearch();
        break;

      default:
        break;
    }
  }, [dispatch, onShowHelp, onCommandPalette]);

  const navigateDate = (direction: 'prev' | 'next') => {
    // This will be implemented in the component using this hook
    const event = new CustomEvent('navigate-date', { detail: direction });
    window.dispatchEvent(event);
  };

  const focusSearch = () => {
    // Focus the search input if it exists
    const searchInput = document.querySelector<HTMLInputElement>(
      'input[type="search"], input[placeholder*="Search"]'
    );
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  };

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [enabled, handleKeyPress]);

  return {
    // Return useful utilities
    focusSearch,
    navigateDate,
  };
}

/**
 * Get all available keyboard shortcuts for documentation
 */
export function getKeyboardShortcuts(): KeyboardShortcut[] {
  return [
    // Navigation
    {
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      category: 'navigation',
      handler: () => {},
    },
    {
      key: '/',
      description: 'Focus search',
      category: 'navigation',
      handler: () => {},
    },
    {
      key: 't',
      description: 'Go to today',
      category: 'navigation',
      handler: () => {},
    },
    {
      key: '←',
      ctrl: true,
      description: 'Previous day/week/month',
      category: 'navigation',
      handler: () => {},
    },
    {
      key: '→',
      ctrl: true,
      description: 'Next day/week/month',
      category: 'navigation',
      handler: () => {},
    },

    // Actions
    {
      key: 'n',
      description: 'New appointment',
      category: 'actions',
      handler: () => {},
    },
    {
      key: 'k',
      ctrl: true,
      description: 'Command palette',
      category: 'actions',
      handler: () => {},
    },
    {
      key: 's',
      ctrl: true,
      description: 'Quick save',
      category: 'actions',
      handler: () => {},
    },

    // Views
    {
      key: '1',
      description: 'Day view',
      category: 'views',
      handler: () => {},
    },
    {
      key: '2',
      description: 'Week view',
      category: 'views',
      handler: () => {},
    },
    {
      key: '3',
      description: 'Month view',
      category: 'views',
      handler: () => {},
    },
    {
      key: '4',
      description: 'Agenda view',
      category: 'views',
      handler: () => {},
    },
    {
      key: '5',
      description: 'Timeline view',
      category: 'views',
      handler: () => {},
    },

    // Modals
    {
      key: 'Esc',
      description: 'Close modal/cancel',
      category: 'modals',
      handler: () => {},
    },
  ];
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) parts.push('⇧');
  if (shortcut.alt) parts.push('⌥');

  parts.push(shortcut.key.toUpperCase());

  return parts.join(' + ');
}
