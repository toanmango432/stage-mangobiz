/**
 * Query Hooks Index
 * Exports all React Query hooks
 */

export { queryKeys } from './keys';

// Tenants
export {
  useTenants,
  useTenant,
  useTenantStats,
  useCreateTenant,
  useUpdateTenant,
  useDeleteTenant,
  useSuspendTenant,
  useActivateTenant,
} from './useTenants';

// Licenses
export {
  useLicenses,
  useLicense,
  useLicensesByTenant,
  useExpiringLicenses,
  useLicenseStats,
  useCreateLicense,
  useUpdateLicense,
  useRevokeLicense,
  useActivateLicense,
} from './useLicenses';
