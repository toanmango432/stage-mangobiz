/**
 * Role Settings Types
 * Defines the structure for customizable roles and their permissions
 */

// Permission level for detailed permissions
export type PermissionLevel = 'full' | 'limited' | 'view_only' | 'none';

// Location scope for multi-location support
export type LocationScope = 'all_locations' | 'specific_locations';

// Quick access permission keys
export interface QuickAccessPermissions {
  canAccessAdminPortal: boolean;
  canAccessReports: boolean;
  canModifyPrices: boolean;
  canProcessRefunds: boolean;
  canDeleteRecords: boolean;
  canManageTeam: boolean;
  canViewOthersCalendar: boolean;
  canBookForOthers: boolean;
  canEditOthersAppointments: boolean;
}

// Detailed permission definition
export interface DetailedPermission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
  level: PermissionLevel;
}

// Permission categories
export type PermissionCategory =
  | 'appointments'
  | 'clients'
  | 'services'
  | 'inventory'
  | 'reports'
  | 'team'
  | 'settings';

// Role color theme
export interface RoleColor {
  bg: string;      // Background color class (e.g., 'bg-cyan-100')
  text: string;    // Text color class (e.g., 'text-cyan-700')
  border: string;  // Border color class (e.g., 'border-cyan-300')
}

// Role hierarchy level (higher = more permissions)
export type RoleHierarchy = 1 | 2 | 3 | 4 | 5;

// Main Role Definition interface
export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  color: RoleColor;
  hierarchy: RoleHierarchy;

  // Role flags
  isSystem: boolean;           // Built-in roles (owner, manager) cannot be deleted
  isDefault: boolean;          // Default role for new team members
  isServiceProvider: boolean;  // Can provide services (stylists, therapists, etc.)

  // Location scope
  locationScope: LocationScope;
  locationIds?: string[];      // Specific location IDs if scope is 'specific_locations'

  // Permissions
  quickAccessPermissions: QuickAccessPermissions;
  detailedPermissions: DetailedPermission[];

  // Metadata
  memberCount?: number;        // Number of team members with this role
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// Role template for creating new roles
export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  category: 'management' | 'service_provider' | 'support' | 'specialty';
  icon: string;
  suggestedPermissions: QuickAccessPermissions;
  isPopular?: boolean;
}

// Role category for grouping in UI
export interface RoleGroup {
  id: string;
  name: string;
  description: string;
  roles: RoleDefinition[];
}

// Role settings state
export interface RoleSettingsState {
  roles: RoleDefinition[];
  selectedRoleId: string | null;
  isEditing: boolean;
  isAddingNew: boolean;
  hasUnsavedChanges: boolean;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filterCategory: 'all' | 'system' | 'custom' | 'service_provider';
}

// Role CRUD operations
export interface RoleOperations {
  createRole: (role: Omit<RoleDefinition, 'id' | 'createdAt' | 'updatedAt'>) => Promise<RoleDefinition>;
  updateRole: (id: string, updates: Partial<RoleDefinition>) => Promise<RoleDefinition>;
  deleteRole: (id: string, reassignToRoleId: string) => Promise<void>;
  duplicateRole: (id: string, newName: string) => Promise<RoleDefinition>;
  setDefaultRole: (id: string) => Promise<void>;
}

// Permission inheritance (for role hierarchy)
export interface PermissionInheritance {
  roleId: string;
  inheritsFrom: string | null;  // Parent role ID or null for base permissions
  overrides: Partial<QuickAccessPermissions>;
}
