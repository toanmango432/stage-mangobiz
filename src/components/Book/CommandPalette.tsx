/**
 * Command Palette Component
 * Cmd+K quick access to all Book module actions
 * Fuzzy search, keyboard navigation, recent actions
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Command } from 'cmdk';
import {
  Calendar,
  Plus,
  Search,
  ArrowRight,
  CalendarDays,
  CalendarRange,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  openCreateModal,
  setSelectedDate,
  setViewMode,
  selectAppointment,
  setFilters,
  clearFilters,
} from '../../store/slices/appointmentsSlice';
import { cn } from '../../lib/utils';
import { formatDate } from '../../utils/timeFormatting';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon: any;
  category: 'appointments' | 'navigation' | 'views' | 'clients' | 'settings';
  keywords?: string[];
  action: () => void;
  shortcut?: string;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const dispatch = useAppDispatch();

  const [search, setSearch] = useState('');
  const [recentActions, setRecentActions] = useState<string[]>([]);

  // Get current state for contextual actions
  const selectedDate = useAppSelector((state) => state.appointments.calendarView.selectedDate);
  const viewMode = useAppSelector((state) => state.appointments.calendarView.viewMode);

  // Define all available commands
  const commands = useMemo<CommandAction[]>(() => [
    // Appointments
    {
      id: 'new-appointment',
      label: 'New Appointment',
      description: 'Create a new appointment booking',
      icon: Plus,
      category: 'appointments',
      keywords: ['create', 'book', 'add', 'schedule'],
      shortcut: 'N',
      action: () => {
        dispatch(openCreateModal());
        onClose();
        trackAction('new-appointment');
      },
    },
    {
      id: 'search-appointments',
      label: 'Search Appointments',
      description: 'Find appointments by client, service, or staff',
      icon: Search,
      category: 'appointments',
      keywords: ['find', 'lookup', 'filter'],
      shortcut: '/',
      action: () => {
        // Focus search input
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="Search"]'
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        onClose();
        trackAction('search-appointments');
      },
    },

    // Navigation - Time
    {
      id: 'go-to-today',
      label: 'Go to Today',
      description: 'Jump to today\'s date',
      icon: Calendar,
      category: 'navigation',
      keywords: ['now', 'current'],
      shortcut: 'T',
      action: () => {
        dispatch(setSelectedDate(new Date()));
        onClose();
        trackAction('go-to-today');
      },
    },
    {
      id: 'go-to-tomorrow',
      label: 'Go to Tomorrow',
      description: 'Jump to tomorrow\'s date',
      icon: ArrowRight,
      category: 'navigation',
      keywords: ['next day'],
      action: () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dispatch(setSelectedDate(tomorrow));
        onClose();
        trackAction('go-to-tomorrow');
      },
    },
    {
      id: 'go-to-next-week',
      label: 'Go to Next Week',
      description: 'Jump to next week',
      icon: CalendarRange,
      category: 'navigation',
      keywords: ['forward', 'future'],
      action: () => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        dispatch(setSelectedDate(nextWeek));
        onClose();
        trackAction('go-to-next-week');
      },
    },

    // Views
    {
      id: 'view-day',
      label: 'Day View',
      description: 'Switch to day schedule view',
      icon: CalendarDays,
      category: 'views',
      keywords: ['daily', 'schedule'],
      shortcut: '1',
      action: () => {
        dispatch(setViewMode('day'));
        onClose();
        trackAction('view-day');
      },
    },
    {
      id: 'view-week',
      label: 'Week View',
      description: 'Switch to weekly calendar view',
      icon: CalendarRange,
      category: 'views',
      keywords: ['weekly', '7 days'],
      shortcut: '2',
      action: () => {
        dispatch(setViewMode('week'));
        onClose();
        trackAction('view-week');
      },
    },
    {
      id: 'view-month',
      label: 'Month View',
      description: 'Switch to monthly calendar view',
      icon: Calendar,
      category: 'views',
      keywords: ['monthly', '30 days'],
      shortcut: '3',
      action: () => {
        dispatch(setViewMode('month'));
        onClose();
        trackAction('view-month');
      },
    },

    // Note: Client management commands removed - they require router navigation
    // which is not available in the current component context.
    // These can be re-added when proper navigation context is available.

    // Filters
    {
      id: 'clear-filters',
      label: 'Clear All Filters',
      description: 'Remove all active filters',
      icon: Filter,
      category: 'settings',
      keywords: ['reset', 'remove'],
      action: () => {
        dispatch(clearFilters());
        onClose();
        trackAction('clear-filters');
      },
    },

    // Note: Cross-module navigation commands (Dashboard, Front Desk, Reports) removed
    // They require router context which is not available in this component.
    // These can be re-added when proper navigation context is available.
  ], [dispatch, onClose]);

  // Track action usage for MRU sorting
  const trackAction = useCallback((actionId: string) => {
    setRecentActions((prev) => {
      const updated = [actionId, ...prev.filter(id => id !== actionId)];
      return updated.slice(0, 5); // Keep last 5 actions
    });

    // Persist to localStorage
    try {
      localStorage.setItem('command-palette-recent', JSON.stringify(recentActions));
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [recentActions]);

  // Load recent actions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('command-palette-recent');
      if (stored) {
        setRecentActions(JSON.parse(stored));
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  // Reset search when opening
  useEffect(() => {
    if (isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Get recent commands for quick access
  const recentCommands = useMemo(() => {
    return recentActions
      .map(id => commands.find(cmd => cmd.id === id))
      .filter(Boolean) as CommandAction[];
  }, [recentActions, commands]);

  // Group commands by category
  const commandsByCategory = useMemo(() => {
    const grouped: Record<string, CommandAction[]> = {
      appointments: [],
      navigation: [],
      views: [],
      settings: [],
    };

    commands.forEach((cmd) => {
      grouped[cmd.category].push(cmd);
    });

    return grouped;
  }, [commands]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/50 backdrop-blur-sm">
      <div className="mt-[10vh] w-full max-w-2xl animate-in fade-in slide-in-from-top-4 duration-200">
        <Command
          className="rounded-lg border border-slate-200 bg-white shadow-2xl"
          shouldFilter={true}
          value={search}
          onValueChange={setSearch}
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-slate-200 px-4">
            <Search className="mr-2 h-5 w-5 text-slate-400" />
            <Command.Input
              placeholder="Type a command or search..."
              className="flex h-14 w-full bg-transparent py-3 text-base outline-none placeholder:text-slate-400"
              autoFocus
            />
            <kbd className="ml-auto hidden rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 sm:inline-block">
              ESC
            </kbd>
          </div>

          {/* Command List */}
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-slate-500">
              No commands found.
            </Command.Empty>

            {/* Recent Actions */}
            {recentCommands.length > 0 && !search && (
              <Command.Group heading="Recent" className="mb-2">
                {recentCommands.map((cmd) => (
                  <CommandItem key={cmd.id} command={cmd} />
                ))}
              </Command.Group>
            )}

            {/* Appointments */}
            <Command.Group heading="Appointments" className="mb-2">
              {commandsByCategory.appointments.map((cmd) => (
                <CommandItem key={cmd.id} command={cmd} />
              ))}
            </Command.Group>

            {/* Views */}
            <Command.Group heading="Views" className="mb-2">
              {commandsByCategory.views.map((cmd) => (
                <CommandItem key={cmd.id} command={cmd} />
              ))}
            </Command.Group>

            {/* Navigation */}
            <Command.Group heading="Navigation" className="mb-2">
              {commandsByCategory.navigation.map((cmd) => (
                <CommandItem key={cmd.id} command={cmd} />
              ))}
            </Command.Group>

            {/* Settings */}
            {commandsByCategory.settings.length > 0 && (
              <Command.Group heading="Settings" className="mb-2">
                {commandsByCategory.settings.map((cmd) => (
                  <CommandItem key={cmd.id} command={cmd} />
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer */}
          <div className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5">↑</kbd>
                  <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5">↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5">↵</kbd>
                  select
                </span>
              </div>
              <span className="text-slate-400">
                {commands.length} command{commands.length !== 1 ? 's' : ''} available
              </span>
            </div>
          </div>
        </Command>
      </div>

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />
    </div>
  );
}

/**
 * Individual command item component
 */
interface CommandItemProps {
  command: CommandAction;
}

function CommandItem({ command }: CommandItemProps) {
  const Icon = command.icon;

  return (
    <Command.Item
      value={command.label}
      keywords={command.keywords}
      onSelect={command.action}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5',
        'text-sm text-slate-700',
        'hover:bg-slate-100',
        'data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-900',
        'transition-colors duration-150'
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 group-data-[selected=true]:bg-blue-100 group-data-[selected=true]:text-blue-600">
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="font-medium">{command.label}</div>
        {command.description && (
          <div className="truncate text-xs text-slate-500">
            {command.description}
          </div>
        )}
      </div>

      {command.shortcut && (
        <kbd className="ml-auto rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600">
          {command.shortcut}
        </kbd>
      )}

      <ChevronRight className="h-4 w-4 text-slate-400" />
    </Command.Item>
  );
}
