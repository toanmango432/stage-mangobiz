/**
 * Pages Registry for Global Search
 *
 * Static registry of all navigable pages/modules in Mango POS.
 * Enables "Go to..." functionality in the command palette.
 */

export interface PageEntry {
  /** Unique identifier (matches module ID in uiSlice) */
  id: string;
  /** Display name */
  label: string;
  /** Page description */
  description: string;
  /** Category for grouping */
  category: 'main' | 'settings' | 'reports' | 'tools';
  /** Search keywords */
  keywords: string[];
  /** Icon name (from lucide-react) */
  icon: string;
  /** Whether this page requires authentication/PIN */
  requiresAuth?: boolean;
  /** Mobile-only page */
  mobileOnly?: boolean;
  /** Desktop-only page */
  desktopOnly?: boolean;
}

/**
 * Complete registry of all navigable pages in Mango POS
 */
export const PAGES_REGISTRY: PageEntry[] = [
  // ============================================================================
  // Main Navigation
  // ============================================================================
  {
    id: 'book',
    label: 'Book',
    description: 'Calendar view for booking appointments',
    category: 'main',
    keywords: ['calendar', 'appointment', 'schedule', 'booking', 'reserve', 'availability'],
    icon: 'Calendar',
  },
  {
    id: 'frontdesk',
    label: 'Front Desk',
    description: 'Combined team and tickets view for front desk operations',
    category: 'main',
    keywords: ['reception', 'check-in', 'lobby', 'waiting', 'operations', 'dashboard'],
    icon: 'LayoutGrid',
    desktopOnly: true,
  },
  {
    id: 'team',
    label: 'Team',
    description: 'View and manage team members on shift',
    category: 'main',
    keywords: ['staff', 'employees', 'workers', 'stylists', 'technicians', 'available'],
    icon: 'Users',
    mobileOnly: true,
  },
  {
    id: 'tickets',
    label: 'Tickets',
    description: 'View all active service tickets',
    category: 'main',
    keywords: ['orders', 'services', 'active', 'in-progress', 'current'],
    icon: 'Receipt',
    mobileOnly: true,
  },
  {
    id: 'pending',
    label: 'Pending',
    description: 'Tickets waiting for payment or checkout',
    category: 'main',
    keywords: ['payment', 'checkout', 'unpaid', 'waiting', 'ready', 'complete'],
    icon: 'Clock',
  },
  {
    id: 'closed',
    label: 'Closed Tickets',
    description: 'View completed and paid tickets',
    category: 'main',
    keywords: ['completed', 'paid', 'history', 'finished', 'done', 'past'],
    icon: 'CheckCircle',
  },
  {
    id: 'more',
    label: 'More',
    description: 'Access additional settings and features',
    category: 'main',
    keywords: ['menu', 'options', 'extras', 'additional'],
    icon: 'MoreHorizontal',
  },

  // ============================================================================
  // Settings Pages
  // ============================================================================
  {
    id: 'settings',
    label: 'Settings',
    description: 'Main settings and configuration page',
    category: 'settings',
    keywords: ['preferences', 'configuration', 'options', 'setup', 'config'],
    icon: 'Settings',
  },
  {
    id: 'store-settings',
    label: 'Store Settings',
    description: 'Configure store information and business details',
    category: 'settings',
    keywords: ['business', 'salon', 'spa', 'shop', 'location', 'address', 'hours', 'info'],
    icon: 'Store',
    requiresAuth: true,
  },
  {
    id: 'category',
    label: 'Menu / Services',
    description: 'Manage service categories and menu items',
    category: 'settings',
    keywords: ['services', 'categories', 'pricing', 'catalog', 'offerings', 'menu items', 'add service'],
    icon: 'Scissors',
  },
  {
    id: 'clients',
    label: 'Clients',
    description: 'View and manage client database',
    category: 'settings',
    keywords: ['customers', 'contacts', 'crm', 'database', 'members', 'guests', 'client list'],
    icon: 'UserCircle',
  },
  {
    id: 'team-settings',
    label: 'Team Settings',
    description: 'Manage team members, schedules, and permissions',
    category: 'settings',
    keywords: ['staff', 'employees', 'manage team', 'add staff', 'permissions', 'schedules'],
    icon: 'Users',
    requiresAuth: true,
  },
  {
    id: 'role-settings',
    label: 'Roles & Permissions',
    description: 'Configure staff roles and access permissions',
    category: 'settings',
    keywords: ['permissions', 'access', 'roles', 'admin', 'manager', 'security'],
    icon: 'Shield',
    requiresAuth: true,
  },
  {
    id: 'frontdesk-settings',
    label: 'Front Desk Settings',
    description: 'Configure front desk display and behavior',
    category: 'settings',
    keywords: ['display', 'layout', 'columns', 'view', 'customize', 'front desk config'],
    icon: 'LayoutGrid',
  },
  {
    id: 'license',
    label: 'License',
    description: 'View and manage your Mango POS license',
    category: 'settings',
    keywords: ['subscription', 'plan', 'billing', 'activate', 'key', 'registration'],
    icon: 'Key',
    requiresAuth: true,
  },
  {
    id: 'schedule',
    label: 'Schedule',
    description: 'View and manage staff schedules',
    category: 'settings',
    keywords: ['shifts', 'hours', 'availability', 'calendar', 'working hours', 'time off'],
    icon: 'CalendarDays',
  },

  // ============================================================================
  // Reports & Tools
  // ============================================================================
  {
    id: 'reports',
    label: 'Reports',
    description: 'View sales reports and analytics',
    category: 'reports',
    keywords: ['analytics', 'sales', 'revenue', 'statistics', 'data', 'insights', 'dashboard'],
    icon: 'BarChart3',
  },
  {
    id: 'turn-tracker',
    label: 'Turn Tracker',
    description: 'Track staff turns for fair service distribution',
    category: 'tools',
    keywords: ['rotation', 'fairness', 'distribution', 'queue', 'next', 'turns'],
    icon: 'RefreshCw',
  },

  // ============================================================================
  // Quick Actions (not pages, but useful to search)
  // ============================================================================
  {
    id: 'new-ticket',
    label: 'New Ticket',
    description: 'Create a new service ticket',
    category: 'tools',
    keywords: ['create', 'add', 'start', 'begin', 'open ticket', 'walk-in'],
    icon: 'Plus',
  },
  {
    id: 'new-appointment',
    label: 'New Appointment',
    description: 'Book a new appointment',
    category: 'tools',
    keywords: ['create', 'add', 'book', 'schedule', 'reserve'],
    icon: 'CalendarPlus',
  },
  {
    id: 'new-client',
    label: 'New Client',
    description: 'Add a new client to the database',
    category: 'tools',
    keywords: ['create', 'add', 'register', 'sign up', 'customer'],
    icon: 'UserPlus',
  },
];

/**
 * Get all pages by category
 */
export function getPagesByCategory(category: PageEntry['category']): PageEntry[] {
  return PAGES_REGISTRY.filter((page) => page.category === category);
}

/**
 * Get a page by ID
 */
export function getPageById(id: string): PageEntry | undefined {
  return PAGES_REGISTRY.find((page) => page.id === id);
}

/**
 * Get pages filtered by device type
 */
export function getPagesForDevice(isMobile: boolean): PageEntry[] {
  return PAGES_REGISTRY.filter((page) => {
    if (isMobile && page.desktopOnly) return false;
    if (!isMobile && page.mobileOnly) return false;
    return true;
  });
}
