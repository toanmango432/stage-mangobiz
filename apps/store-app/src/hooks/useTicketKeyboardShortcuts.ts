/**
 * Keyboard Shortcuts Hook for Front Desk Ticket Operations
 * US-024: Provides keyboard shortcuts for common ticket actions
 */

import { useEffect, useCallback } from 'react';

export interface TicketKeyboardShortcut {
  key: string;
  description: string;
  hint: string; // Short hint for tooltip display
}

interface UseTicketKeyboardShortcutsOptions {
  enabled?: boolean;
  onNewTicket?: () => void;
  onSearchFocus?: () => void;
  onSectionChange?: (section: 'team' | 'service' | 'waitList') => void;
  onEscape?: () => void;
}

/**
 * Keyboard shortcuts for Front Desk ticket operations
 */
export const TICKET_SHORTCUTS: TicketKeyboardShortcut[] = [
  { key: 'N', description: 'Create new ticket', hint: 'N' },
  { key: 'S', description: 'Focus search', hint: 'S' },
  { key: '1', description: 'Switch to Team section', hint: '1' },
  { key: '2', description: 'Switch to In Service section', hint: '2' },
  { key: '3', description: 'Switch to Waiting section', hint: '3' },
  { key: 'Escape', description: 'Close any open modal', hint: 'Esc' },
];

/**
 * Hook to handle keyboard shortcuts for Front Desk ticket operations
 */
export function useTicketKeyboardShortcuts(options: UseTicketKeyboardShortcutsOptions = {}) {
  const {
    enabled = true,
    onNewTicket,
    onSearchFocus,
    onSectionChange,
    onEscape,
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    const isInputFocused =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    // Always allow Escape to close modals
    if (event.key === 'Escape') {
      onEscape?.();
      return;
    }

    // Don't trigger other shortcuts when typing in inputs
    if (isInputFocused) {
      return;
    }

    // Don't trigger if modifier keys are pressed (except for special cases)
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    switch (event.key.toLowerCase()) {
      // N = New ticket
      case 'n':
        event.preventDefault();
        onNewTicket?.();
        break;

      // S = Focus search
      case 's':
        event.preventDefault();
        if (onSearchFocus) {
          onSearchFocus();
        } else {
          // Default: focus any search input on the page
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]'
          );
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }
        break;

      // 1 = Team section
      case '1':
        event.preventDefault();
        onSectionChange?.('team');
        break;

      // 2 = In Service section
      case '2':
        event.preventDefault();
        onSectionChange?.('service');
        break;

      // 3 = Waiting section
      case '3':
        event.preventDefault();
        onSectionChange?.('waitList');
        break;

      default:
        break;
    }
  }, [onNewTicket, onSearchFocus, onSectionChange, onEscape]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  return {
    shortcuts: TICKET_SHORTCUTS,
  };
}

/**
 * Get shortcut hint for a specific action
 */
export function getShortcutHint(action: 'newTicket' | 'search' | 'team' | 'service' | 'waitList' | 'escape'): string {
  const hints: Record<string, string> = {
    newTicket: 'N',
    search: 'S',
    team: '1',
    service: '2',
    waitList: '3',
    escape: 'Esc',
  };
  return hints[action] || '';
}
