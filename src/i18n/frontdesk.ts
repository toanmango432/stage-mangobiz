/**
 * Front Desk Module - Internationalization Strings
 *
 * All UI strings for the Front Desk module are centralized here
 * for easy internationalization support.
 *
 * Usage:
 * import { strings } from '@/i18n/frontdesk';
 * <span>{strings.sections.waitList.title}</span>
 */

export const strings = {
  // Section titles
  sections: {
    waitList: {
      title: 'Waiting Queue',
      shortTitle: 'Waiting',
      description: 'Customers waiting to be served',
    },
    service: {
      title: 'In Service',
      shortTitle: 'Service',
      description: 'Active service tickets',
    },
    pending: {
      title: 'Pending Payments',
      shortTitle: 'Pending',
      description: 'Tickets awaiting payment',
    },
    closed: {
      title: 'Closed Tickets',
      shortTitle: 'Closed',
      description: 'Completed transactions',
    },
    comingAppointments: {
      title: 'Coming Appointments',
      shortTitle: 'Coming',
      description: 'Upcoming scheduled appointments',
    },
    team: {
      title: 'Team',
      shortTitle: 'Team',
      description: 'Staff members',
    },
  },

  // Empty states
  emptyStates: {
    waitList: {
      title: 'No one waiting',
      description: 'New walk-ins will appear here',
    },
    service: {
      title: 'No active services',
      description: 'Assign a technician to get started',
    },
    pending: {
      title: 'No pending payments',
      description: 'Completed services will appear here for checkout',
    },
    closed: {
      title: 'No closed tickets today',
      description: 'Completed transactions will appear here',
    },
    comingAppointments: {
      title: 'No appointments coming up',
      description: 'Scheduled appointments will appear here',
    },
    team: {
      title: 'No team members',
      description: 'Add staff members to get started',
    },
    search: {
      title: 'No results found',
      description: "Try adjusting your search or filters to find what you're looking for",
    },
  },

  // Actions
  actions: {
    createTicket: 'Create Ticket',
    addWalkIn: 'Add Walk-In',
    assignTechnician: 'Assign Technician',
    checkout: 'Checkout',
    viewDetails: 'View Details',
    edit: 'Edit',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    refresh: 'Refresh',
    export: 'Export',
    import: 'Import',
    reset: 'Reset',
  },

  // View options
  viewOptions: {
    title: 'View Options',
    listView: 'List View',
    gridView: 'Grid View',
    expandAll: 'Expand All',
    collapseAll: 'Collapse All',
    compactView: 'Compact View',
    normalView: 'Normal View',
  },

  // Sort options
  sortOptions: {
    byQueue: 'By Queue Order',
    byTime: 'By Wait Time',
    byName: 'By Name',
    byTechnician: 'By Technician',
  },

  // Time labels
  time: {
    now: 'Now',
    late: 'Late',
    soon: 'Soon',
    today: 'Today',
    tomorrow: 'Tomorrow',
    minutes: 'min',
    hours: 'hr',
    average: 'avg',
    nextHour: 'Next Hour',
    within1Hour: 'Within 1 hour',
    later: 'Later',
  },

  // Metrics
  metrics: {
    waiting: 'waiting',
    inService: 'in service',
    pending: 'pending',
    paused: 'paused',
    ready: 'ready',
    busy: 'busy',
    avgWaitTime: 'avg wait time',
    avgServiceTime: 'avg service time',
  },

  // Status labels
  status: {
    waiting: 'Waiting',
    inService: 'In Service',
    paused: 'Paused',
    completed: 'Completed',
    cancelled: 'Cancelled',
    noShow: 'No Show',
    confirmed: 'Confirmed',
    checkedIn: 'Checked In',
  },

  // Settings
  settings: {
    title: 'Front Desk Settings',
    operationTemplates: 'Operation Templates',
    teamSection: 'Team Section',
    ticketSection: 'Ticket Section',
    workflowRules: 'Workflow & Rules',
    layoutSection: 'Layout Section',
    saveChanges: 'Save Changes',
    unsavedChanges: 'Unsaved',
    resetToDefaults: 'Reset to Defaults',
    exportSettings: 'Export Settings',
    importSettings: 'Import Settings',
  },

  // Confirmations
  confirmations: {
    resetSettings: {
      title: 'Reset to Defaults?',
      description: 'This will reset all settings to their default values. This action cannot be undone.',
      confirm: 'Reset',
      cancel: 'Cancel',
    },
    importSettings: {
      title: 'Import Settings?',
      description: 'This will replace your current settings with the imported configuration. Any unsaved changes will be lost.',
      confirm: 'Import',
      cancel: 'Cancel',
    },
    discardChanges: {
      title: 'Discard Changes?',
      description: 'You have unsaved changes. Are you sure you want to discard them?',
      confirm: 'Discard',
      cancel: 'Keep Editing',
    },
  },

  // Errors
  errors: {
    loadFailed: 'Failed to load data',
    saveFailed: 'Failed to save changes',
    importFailed: 'Failed to import settings',
    exportFailed: 'Failed to export settings',
    invalidFormat: 'Invalid file format',
    networkError: 'Network error. Please check your connection.',
    unknownError: 'An unexpected error occurred',
  },

  // Success messages
  success: {
    saved: 'Settings saved successfully',
    imported: 'Settings imported successfully',
    exported: 'Settings exported successfully',
    reset: 'Settings reset to defaults',
  },

  // Tooltips
  tooltips: {
    sortTickets: 'Sort tickets',
    toggleUpcoming: 'Toggle upcoming appointments',
    viewOptions: 'View options',
    minimizeSection: 'Minimize section',
    expandSection: 'Expand section',
    moreOptions: 'More options',
    closeSettings: 'Close settings',
  },

  // Accessibility
  accessibility: {
    tabPanel: 'Tab panel',
    selected: 'Selected',
    expanded: 'Expanded',
    collapsed: 'Collapsed',
    loading: 'Loading',
    menu: 'Menu',
    dialog: 'Dialog',
  },
} as const;

// Type helper for accessing nested strings
export type StringKeys = typeof strings;

// Helper function to get string by path (e.g., 'sections.waitList.title')
export function getString(path: string): string {
  const keys = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = strings;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      console.warn(`Missing i18n string: ${path}`);
      return path;
    }
  }

  return typeof value === 'string' ? value : path;
}

export default strings;
