/**
 * useTicketKeyboard Hook
 *
 * Handles all keyboard shortcuts for the TicketPanel component.
 * - `?` - Show keyboard shortcuts help
 * - `Escape` - Close dialogs or panel
 * - `Cmd/Ctrl+K` - Focus service search
 * - `Cmd/Ctrl+F` - Focus client search
 * - `Cmd/Ctrl+Enter` - Proceed to checkout
 */

import { useEffect } from "react";

interface UseTicketKeyboardParams {
  isOpen: boolean;
  showKeyboardShortcuts: boolean;
  showPaymentModal: boolean;
  canCheckout: boolean;
  onClose: () => void;
  onShowKeyboardShortcuts: (show: boolean) => void;
  onShowPaymentModal: (show: boolean) => void;
  onSetFullPageTab: (tab: "services" | "staff") => void;
  handleCheckout: () => void;
}

export function useTicketKeyboard({
  isOpen,
  showKeyboardShortcuts,
  showPaymentModal,
  canCheckout,
  onClose,
  onShowKeyboardShortcuts,
  onShowPaymentModal,
  onSetFullPageTab,
  handleCheckout,
}: UseTicketKeyboardParams): void {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (e.key === "?" && !e.shiftKey) {
        e.preventDefault();
        onShowKeyboardShortcuts(true);
        return;
      }

      if (e.key === "Escape") {
        if (showKeyboardShortcuts) {
          onShowKeyboardShortcuts(false);
        } else if (showPaymentModal) {
          onShowPaymentModal(false);
        } else {
          onClose();
        }
        return;
      }

      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (modifier && e.key === "k") {
        e.preventDefault();
        onSetFullPageTab("services");
        setTimeout(() => {
          const searchInput = document.querySelector(
            '[data-testid="input-search-service-full"]'
          ) as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }, 100);
        return;
      }

      if (modifier && e.key === "f") {
        e.preventDefault();
        setTimeout(() => {
          const searchInput = document.querySelector(
            '[data-testid="input-search-client"]'
          ) as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }, 100);
        return;
      }

      if (modifier && e.key === "Enter") {
        e.preventDefault();
        if (canCheckout) {
          handleCheckout();
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    showKeyboardShortcuts,
    showPaymentModal,
    canCheckout,
    onClose,
    onShowKeyboardShortcuts,
    onShowPaymentModal,
    onSetFullPageTab,
    handleCheckout,
  ]);
}
