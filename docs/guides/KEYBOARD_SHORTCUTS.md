# Book Module Keyboard Shortcuts

**Status:** ✅ Implemented
**Date:** 2025-11-20

## Quick Access

Press **`Cmd+K` (Mac)** or **`Ctrl+K` (Windows)** to open the Command Palette for quick access to all actions.

Press **`?` + `Shift`** to show the keyboard shortcuts help (coming soon).

---

## All Keyboard Shortcuts

### Navigation
| Shortcut | Action |
|----------|--------|
| `?` (Shift + /) | Show keyboard shortcuts help |
| `/` | Focus search input |
| `T` | Go to today |
| `Ctrl+←` | Previous day/week/month |
| `Ctrl+→` | Next day/week/month |

### Actions
| Shortcut | Action |
|----------|--------|
| `N` | New appointment |
| `Cmd+K` / `Ctrl+K` | Open Command Palette |
| `Esc` | Close modal/cancel |

### View Switching
| Shortcut | Action |
|----------|--------|
| `1` | Day view |
| `2` | Week view |
| `3` | Month view |
| `4` | Agenda view |
| `5` | Timeline view |

---

## Command Palette Features

The Command Palette (`Cmd+K`) provides:

- **Fuzzy search** - Type to find any action
- **Recent actions** - Quick access to frequently used commands
- **Categories** - Organized by:
  - Appointments
  - Navigation
  - Views
  - Settings
- **Keyboard navigation** - Use arrow keys to navigate, Enter to select
- **Smart shortcuts** - Displays keyboard shortcuts next to each command

### Command Palette Actions

**Appointments:**
- New Appointment
- Search Appointments

**Navigation:**
- Go to Today
- Go to Tomorrow
- Go to Next Week

**Views:**
- Day View
- Week View
- Month View

**Settings:**
- Clear All Filters

---

## Technical Implementation

### Files Created:
- `src/hooks/useKeyboardShortcuts.ts` - Keyboard shortcuts hook
- `src/components/Book/CommandPalette.tsx` - Command palette component

### Integration:
- Integrated into `src/pages/BookPage.tsx`
- Uses Redux actions for state management
- Works with existing navigation system

### Dependencies:
- `cmdk` - Command palette UI library
- `react-router-dom` - Navigation
- `lucide-react` - Icons

---

## Usage in Components

```typescript
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// In your component
useKeyboardShortcuts({
  enabled: true,
  onShowHelp: () => {
    // Show keyboard shortcuts help modal
  },
  onCommandPalette: () => {
    setIsCommandPaletteOpen(true);
  },
});
```

---

## Future Enhancements

- [ ] Keyboard shortcuts help modal (shows all shortcuts)
- [ ] Customizable keyboard shortcuts
- [ ] Command palette command history
- [ ] Command palette search highlighting
- [ ] Global keyboard shortcuts across all pages

---

**Part of Phase 1: UX/UI Quick Wins**
