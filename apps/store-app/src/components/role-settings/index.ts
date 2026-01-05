/**
 * Role Settings Module
 * Public exports for the role management feature
 */

export { RoleSettings, default as RoleSettingsDefault } from './RoleSettings';
export { RoleList } from './RoleList';
export { RoleEditor } from './RoleEditor';

// Types
export type {
  RoleDefinition,
  RoleTemplate,
  QuickAccessPermissions,
  DetailedPermission,
  PermissionCategory,
  PermissionLevel,
  LocationScope,
  RoleHierarchy,
  RoleColor,
  RoleGroup,
  RoleSettingsState,
  RoleOperations,
  PermissionInheritance,
} from './types';

// Constants
export {
  roleColors,
  permissionCategories,
  defaultDetailedPermissions,
  defaultSystemRoles,
  specialtyRoles,
  roleTemplates,
  quickAccessLabels,
  allDefaultRoles,
  roleSettingsTokens,
} from './constants';
