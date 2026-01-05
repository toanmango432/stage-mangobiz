/**
 * KeyboardShortcutsHint Component
 *
 * A banner that hints to users about keyboard shortcuts availability.
 * Currently kept for future use when hints banner is re-enabled.
 */

import { Keyboard, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface KeyboardShortcutsHintProps {
  onDismiss: () => void;
  onShowShortcuts: () => void;
}

export const KeyboardShortcutsHint = ({
  onDismiss,
  onShowShortcuts,
}: KeyboardShortcutsHintProps) => {
  return (
    <div
      className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/50 border-b text-xs"
      data-testid="banner-keyboard-hints"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Keyboard className="h-3.5 w-3.5" />
        <span>
          Press{" "}
          <button
            onClick={onShowShortcuts}
            className="font-mono text-foreground hover:underline focus:outline-none focus:underline"
            data-testid="button-show-shortcuts-hint"
          >
            ?
          </button>{" "}
          for keyboard shortcuts
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 hover:bg-transparent"
        onClick={onDismiss}
        data-testid="button-dismiss-keyboard-hints"
        aria-label="Dismiss keyboard shortcuts hint"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};
