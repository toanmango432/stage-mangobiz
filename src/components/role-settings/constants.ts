/**
 * Role Settings Constants
 * Default roles, templates, and permission definitions for salon/spa businesses
 */

import type {
  RoleDefinition,
  RoleTemplate,
  RoleColor,
  QuickAccessPermissions,
  DetailedPermission,
  PermissionCategory,
} from './types';

// Role color presets
export const roleColors: Record<string, RoleColor> = {
  owner: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  manager: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  senior: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  standard: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
  junior: { bg: 'bg-brand-100', text: 'text-brand-700', border: 'border-brand-300' },
  support: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  specialty: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
  custom: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
};

// Permission category definitions
export const permissionCategories: { id: PermissionCategory; name: string; icon: string }[] = [
  { id: 'appointments', name: 'Appointments', icon: 'calendar' },
  { id: 'clients', name: 'Clients', icon: 'users' },
  { id: 'services', name: 'Services & Pricing', icon: 'scissors' },
  { id: 'inventory', name: 'Inventory', icon: 'package' },
  { id: 'reports', name: 'Reports & Analytics', icon: 'bar-chart' },
  { id: 'team', name: 'Team Management', icon: 'user-cog' },
  { id: 'settings', name: 'Settings', icon: 'settings' },
];

// Default detailed permissions
export const defaultDetailedPermissions: DetailedPermission[] = [
  // Appointments
  { id: 'view_appointments', name: 'View Appointments', description: 'View appointment calendar and details', category: 'appointments', level: 'full' },
  { id: 'create_appointments', name: 'Create Appointments', description: 'Book new appointments', category: 'appointments', level: 'full' },
  { id: 'edit_appointments', name: 'Edit Appointments', description: 'Modify existing appointments', category: 'appointments', level: 'limited' },
  { id: 'cancel_appointments', name: 'Cancel Appointments', description: 'Cancel or reschedule appointments', category: 'appointments', level: 'limited' },

  // Clients
  { id: 'view_clients', name: 'View Clients', description: 'View client profiles and history', category: 'clients', level: 'full' },
  { id: 'edit_clients', name: 'Edit Clients', description: 'Update client information', category: 'clients', level: 'limited' },
  { id: 'delete_clients', name: 'Delete Clients', description: 'Remove client records', category: 'clients', level: 'none' },

  // Services
  { id: 'view_services', name: 'View Services', description: 'View service menu and prices', category: 'services', level: 'full' },
  { id: 'edit_services', name: 'Edit Services', description: 'Modify service details and pricing', category: 'services', level: 'none' },

  // Inventory
  { id: 'view_inventory', name: 'View Inventory', description: 'View product inventory', category: 'inventory', level: 'view_only' },
  { id: 'manage_inventory', name: 'Manage Inventory', description: 'Add, edit, or remove products', category: 'inventory', level: 'none' },

  // Reports
  { id: 'view_own_reports', name: 'View Own Reports', description: 'View personal performance reports', category: 'reports', level: 'full' },
  { id: 'view_team_reports', name: 'View Team Reports', description: 'View reports for all team members', category: 'reports', level: 'none' },
  { id: 'view_financial_reports', name: 'View Financial Reports', description: 'View revenue and financial data', category: 'reports', level: 'none' },

  // Team
  { id: 'view_team', name: 'View Team', description: 'View team member profiles', category: 'team', level: 'view_only' },
  { id: 'manage_team', name: 'Manage Team', description: 'Add, edit, or remove team members', category: 'team', level: 'none' },

  // Settings
  { id: 'access_settings', name: 'Access Settings', description: 'Access business settings', category: 'settings', level: 'none' },
];

// Base permission sets by hierarchy
const ownerPermissions: QuickAccessPermissions = {
  canAccessAdminPortal: true,
  canAccessReports: true,
  canModifyPrices: true,
  canProcessRefunds: true,
  canDeleteRecords: true,
  canManageTeam: true,
  canViewOthersCalendar: true,
  canBookForOthers: true,
  canEditOthersAppointments: true,
};

const managerPermissions: QuickAccessPermissions = {
  canAccessAdminPortal: true,
  canAccessReports: true,
  canModifyPrices: true,
  canProcessRefunds: true,
  canDeleteRecords: false,
  canManageTeam: true,
  canViewOthersCalendar: true,
  canBookForOthers: true,
  canEditOthersAppointments: true,
};

const seniorProviderPermissions: QuickAccessPermissions = {
  canAccessAdminPortal: false,
  canAccessReports: true,
  canModifyPrices: false,
  canProcessRefunds: true,
  canDeleteRecords: false,
  canManageTeam: false,
  canViewOthersCalendar: true,
  canBookForOthers: true,
  canEditOthersAppointments: false,
};

const standardProviderPermissions: QuickAccessPermissions = {
  canAccessAdminPortal: false,
  canAccessReports: false,
  canModifyPrices: false,
  canProcessRefunds: false,
  canDeleteRecords: false,
  canManageTeam: false,
  canViewOthersCalendar: true,
  canBookForOthers: false,
  canEditOthersAppointments: false,
};

const juniorProviderPermissions: QuickAccessPermissions = {
  canAccessAdminPortal: false,
  canAccessReports: false,
  canModifyPrices: false,
  canProcessRefunds: false,
  canDeleteRecords: false,
  canManageTeam: false,
  canViewOthersCalendar: false,
  canBookForOthers: false,
  canEditOthersAppointments: false,
};

const supportPermissions: QuickAccessPermissions = {
  canAccessAdminPortal: false,
  canAccessReports: false,
  canModifyPrices: false,
  canProcessRefunds: false,
  canDeleteRecords: false,
  canManageTeam: false,
  canViewOthersCalendar: true,
  canBookForOthers: true,
  canEditOthersAppointments: true,
};

// Default system roles based on salon/spa best practices
export const defaultSystemRoles: RoleDefinition[] = [
  {
    id: 'owner',
    name: 'Owner',
    description: 'Full access to all features. Can manage business settings, view all reports, and control team permissions.',
    color: roleColors.owner,
    hierarchy: 5,
    isSystem: true,
    isDefault: false,
    isServiceProvider: true,
    locationScope: 'all_locations',
    quickAccessPermissions: ownerPermissions,
    detailedPermissions: defaultDetailedPermissions.map(p => ({ ...p, level: 'full' as const })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Manage daily operations, team schedules, and view reports. Cannot delete records or change business settings.',
    color: roleColors.manager,
    hierarchy: 4,
    isSystem: true,
    isDefault: false,
    isServiceProvider: true,
    locationScope: 'all_locations',
    quickAccessPermissions: managerPermissions,
    detailedPermissions: defaultDetailedPermissions.map(p => ({
      ...p,
      level: p.id.includes('delete') ? 'none' as const : p.id.includes('settings') ? 'view_only' as const : 'full' as const
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'senior_stylist',
    name: 'Senior Stylist',
    description: 'Experienced service provider with access to reports and ability to manage appointments for others.',
    color: roleColors.senior,
    hierarchy: 3,
    isSystem: false,
    isDefault: false,
    isServiceProvider: true,
    locationScope: 'all_locations',
    quickAccessPermissions: seniorProviderPermissions,
    detailedPermissions: defaultDetailedPermissions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stylist',
    name: 'Stylist',
    description: 'Standard service provider. Can view calendar, manage own appointments and clients.',
    color: roleColors.standard,
    hierarchy: 2,
    isSystem: false,
    isDefault: true, // Default for new team members
    isServiceProvider: true,
    locationScope: 'all_locations',
    quickAccessPermissions: standardProviderPermissions,
    detailedPermissions: defaultDetailedPermissions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'junior_stylist',
    name: 'Junior Stylist',
    description: 'Entry-level service provider. Limited access to own schedule and clients only.',
    color: roleColors.junior,
    hierarchy: 1,
    isSystem: false,
    isDefault: false,
    isServiceProvider: true,
    locationScope: 'all_locations',
    quickAccessPermissions: juniorProviderPermissions,
    detailedPermissions: defaultDetailedPermissions.map(p => ({
      ...p,
      level: p.category === 'appointments' || p.category === 'clients' ? 'limited' as const : 'none' as const
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apprentice',
    name: 'Apprentice',
    description: 'Training position. View-only access with supervised service capabilities.',
    color: roleColors.junior,
    hierarchy: 1,
    isSystem: false,
    isDefault: false,
    isServiceProvider: true,
    locationScope: 'all_locations',
    quickAccessPermissions: juniorProviderPermissions,
    detailedPermissions: defaultDetailedPermissions.map(p => ({
      ...p,
      level: 'view_only' as const
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'receptionist',
    name: 'Receptionist',
    description: 'Front desk operations. Can book appointments for all staff and manage client check-ins.',
    color: roleColors.support,
    hierarchy: 2,
    isSystem: false,
    isDefault: false,
    isServiceProvider: false,
    locationScope: 'all_locations',
    quickAccessPermissions: supportPermissions,
    detailedPermissions: defaultDetailedPermissions.map(p => ({
      ...p,
      level: p.category === 'appointments' || p.category === 'clients' ? 'full' as const : 'view_only' as const
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'assistant',
    name: 'Assistant',
    description: 'Support role for stylists. Limited booking capabilities, view-only for most features.',
    color: roleColors.support,
    hierarchy: 1,
    isSystem: false,
    isDefault: false,
    isServiceProvider: false,
    locationScope: 'all_locations',
    quickAccessPermissions: juniorProviderPermissions,
    detailedPermissions: defaultDetailedPermissions.map(p => ({
      ...p,
      level: 'view_only' as const
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Specialty roles (can be added based on business type)
export const specialtyRoles: RoleDefinition[] = [
  {
    id: 'nail_technician',
    name: 'Nail Technician',
    description: 'Nail services specialist. Standard service provider permissions.',
    color: roleColors.specialty,
    hierarchy: 2,
    isSystem: false,
    isDefault: false,
    isServiceProvider: true,
    locationScope: 'all_locations',
    quickAccessPermissions: standardProviderPermissions,
    detailedPermissions: defaultDetailedPermissions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'esthetician',
    name: 'Esthetician',
    description: 'Skin care and facial specialist. Standard service provider permissions.',
    color: roleColors.specialty,
    hierarchy: 2,
    isSystem: false,
    isDefault: false,
    isServiceProvider: true,
    locationScope: 'all_locations',
    quickAccessPermissions: standardProviderPermissions,
    detailedPermissions: defaultDetailedPermissions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'massage_therapist',
    name: 'Massage Therapist',
    description: 'Massage and body treatment specialist. Standard service provider permissions.',
    color: roleColors.specialty,
    hierarchy: 2,
    isSystem: false,
    isDefault: false,
    isServiceProvider: true,
    locationScope: 'all_locations',
    quickAccessPermissions: standardProviderPermissions,
    detailedPermissions: defaultDetailedPermissions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'barber',
    name: 'Barber',
    description: 'Barbering and men\'s grooming specialist. Standard service provider permissions.',
    color: roleColors.specialty,
    hierarchy: 2,
    isSystem: false,
    isDefault: false,
    isServiceProvider: true,
    locationScope: 'all_locations',
    quickAccessPermissions: standardProviderPermissions,
    detailedPermissions: defaultDetailedPermissions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'colorist',
    name: 'Colorist',
    description: 'Hair color specialist. Standard service provider permissions.',
    color: roleColors.specialty,
    hierarchy: 2,
    isSystem: false,
    isDefault: false,
    isServiceProvider: true,
    locationScope: 'all_locations',
    quickAccessPermissions: standardProviderPermissions,
    detailedPermissions: defaultDetailedPermissions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'makeup_artist',
    name: 'Makeup Artist',
    description: 'Professional makeup services. Standard service provider permissions.',
    color: roleColors.specialty,
    hierarchy: 2,
    isSystem: false,
    isDefault: false,
    isServiceProvider: true,
    locationScope: 'all_locations',
    quickAccessPermissions: standardProviderPermissions,
    detailedPermissions: defaultDetailedPermissions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Role templates for creating new custom roles
export const roleTemplates: RoleTemplate[] = [
  {
    id: 'management_template',
    name: 'Management Role',
    description: 'For supervisors and team leads with elevated permissions',
    category: 'management',
    icon: 'crown',
    suggestedPermissions: managerPermissions,
    isPopular: true,
  },
  {
    id: 'service_provider_template',
    name: 'Service Provider',
    description: 'For stylists, technicians, and therapists who provide services',
    category: 'service_provider',
    icon: 'scissors',
    suggestedPermissions: standardProviderPermissions,
    isPopular: true,
  },
  {
    id: 'support_template',
    name: 'Support Staff',
    description: 'For receptionists, assistants, and other support roles',
    category: 'support',
    icon: 'headphones',
    suggestedPermissions: supportPermissions,
    isPopular: true,
  },
  {
    id: 'specialty_template',
    name: 'Specialty Provider',
    description: 'For specialized service providers (nail tech, esthetician, etc.)',
    category: 'specialty',
    icon: 'star',
    suggestedPermissions: standardProviderPermissions,
    isPopular: false,
  },
];

// Quick access permission labels
export const quickAccessLabels: Record<keyof QuickAccessPermissions, { label: string; description: string }> = {
  canAccessAdminPortal: {
    label: 'Admin Portal Access',
    description: 'Access the admin back office and business settings',
  },
  canAccessReports: {
    label: 'Reports & Analytics',
    description: 'View business reports and performance analytics',
  },
  canModifyPrices: {
    label: 'Modify Prices',
    description: 'Change service prices and discounts',
  },
  canProcessRefunds: {
    label: 'Process Refunds',
    description: 'Issue refunds and void transactions',
  },
  canDeleteRecords: {
    label: 'Delete Records',
    description: 'Permanently delete appointments, clients, and records',
  },
  canManageTeam: {
    label: 'Manage Team',
    description: 'Add, edit, or remove team members',
  },
  canViewOthersCalendar: {
    label: "View Others' Calendar",
    description: 'See appointments for other team members',
  },
  canBookForOthers: {
    label: 'Book for Others',
    description: 'Create appointments for other team members',
  },
  canEditOthersAppointments: {
    label: "Edit Others' Appointments",
    description: 'Modify or cancel appointments for other team members',
  },
};

// All default roles combined
export const allDefaultRoles: RoleDefinition[] = [...defaultSystemRoles, ...specialtyRoles];

// Design tokens
export const roleSettingsTokens = {
  colors: roleColors,
  spacing: {
    cardPadding: 'p-6',
    sectionGap: 'space-y-6',
    itemGap: 'gap-4',
  },
  animation: {
    transition: 'transition-all duration-200',
    hover: 'hover:shadow-md',
  },
};
