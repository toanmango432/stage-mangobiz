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

// Stores
export {
  useStores,
  useStore,
  useStoresByTenant,
  useStoresByLicense,
  useStoreStats,
  useCreateStore,
  useUpdateStore,
  useDeleteStore,
  useSuspendStore,
  useActivateStore,
} from './useStores';

// Admin Users
export {
  useAdminUsers,
  useAdminUser,
  useCreateAdminUser,
  useUpdateAdminUser,
  useDeleteAdminUser,
  useActivateAdminUser,
  useDeactivateAdminUser,
} from './useAdminUsers';

// Devices
export {
  useDevices,
  useDevice,
  useDevicesByStore,
  useDevicesByLicense,
  useDeviceStats,
  useBlockDevice,
  useUnblockDevice,
  useUpdateDevice,
  useDeleteDevice,
} from './useDevices';

// Members
export {
  useMembers,
  useMember,
  useMembersByTenant,
  useMembersByStore,
  useMemberStats,
  useCreateMember,
  useUpdateMember,
  useDeleteMember,
  useActivateMember,
  useDeactivateMember,
  useSuspendMember,
} from './useMembers';

// Audit Logs
export {
  useAuditLogs,
  useAuditLog,
  useAuditLogsByUser,
  useAuditLogsByEntity,
  useAuditLogsByDateRange,
  useRecentActivity,
  useSearchAuditLogs,
  useCreateAuditLog,
  useAuditLogActionStats,
} from './useAuditLogs';

// Feature Flags
export {
  useFeatureFlags,
  useFeatureFlag,
  useFeatureFlagByKey,
  useFeatureFlagsByCategory,
  useFeatureFlagsForTier,
  useFeatureFlagStats,
  useCreateFeatureFlag,
  useUpdateFeatureFlag,
  useDeleteFeatureFlag,
  useToggleFeatureFlag,
  useEnableFeatureForTier,
  useDisableFeatureForTier,
  useUpdateFeatureRollout,
} from './useFeatureFlags';

// Announcements
export {
  useAnnouncements,
  useAnnouncement,
  useActiveAnnouncements,
  useAnnouncementsByStatus,
  useAnnouncementsByCategory,
  useAnnouncementStats,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  usePublishAnnouncement,
  useUnpublishAnnouncement,
  useArchiveAnnouncement,
  useSearchAnnouncements,
} from './useAnnouncements';

// Surveys
export {
  useSurveys,
  useSurvey,
  useActiveSurveys,
  useSurveysByStatus,
  useSurveysByType,
  useSurveyResponses,
  useSurveyStats,
  useCreateSurvey,
  useUpdateSurvey,
  useDeleteSurvey,
  usePublishSurvey,
  usePauseSurvey,
  useCloseSurvey,
  useSubmitSurveyResponse,
} from './useSurveys';

// System Config
export {
  useSystemConfig,
  useUpdateSystemConfig,
  useResetSystemConfig,
  useTaxSettings,
  useAddTax,
  useUpdateTax,
  useDeleteTax,
  useServiceCategories,
  useAddCategory,
  useUpdateCategory,
  useDeleteCategory,
  useServiceItems,
  useAddServiceItem,
  useUpdateServiceItem,
  useDeleteServiceItem,
  useEmployeeRoles,
  useAddRole,
  useUpdateRole,
  useDeleteRole,
  usePaymentMethods,
  useAddPaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
} from './useSystemConfig';
