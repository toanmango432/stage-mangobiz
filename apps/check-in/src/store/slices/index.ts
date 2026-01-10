export { default as authReducer, setStore, setDeviceId, clearAuth } from './authSlice';
export { default as uiReducer, setCurrentStep, setLoading, setError, setOffline, resetUI } from './uiSlice';
export {
  default as checkinReducer,
  setPhoneNumber,
  setLookupStatus,
  setCurrentClient,
  setNewClient,
  setServices,
  setServiceCategories,
  addSelectedService,
  removeSelectedService,
  clearSelectedServices,
  setTechnicians,
  setTechnicianPreference,
  addGuest,
  removeGuest,
  updateGuest,
  setPartyPreference,
  setQueueStatus,
  setCheckInNumber,
  setQueuePosition,
  setEstimatedWaitMinutes,
  setCompletedCheckInId,
  resetCheckin,
} from './checkinSlice';

export {
  default as clientReducer,
  setCurrentClient as setClientCurrent,
  clearPhoneSearch,
  clearError as clearClientError,
  resetClient,
  fetchClientByPhone,
  createClient,
} from './clientSlice';

export {
  default as syncReducer,
  setOnlineStatus,
  setSyncStatus,
  setLastSyncedAt,
  addToSyncQueue,
  removeFromSyncQueue,
  incrementAttempts,
  clearSyncQueue,
  setSyncError,
  resetSync,
} from './syncSlice';

export {
  default as servicesReducer,
  fetchServices,
  clearServicesError,
} from './servicesSlice';

export {
  default as technicianReducer,
  fetchTechnicians,
  updateTechnicianStatus,
  updateTechnicianStatuses,
  clearTechniciansError,
} from './technicianSlice';
export type { StaffStatusUpdate } from './technicianSlice';

export {
  default as appointmentReducer,
  fetchAppointmentByQrCode,
  confirmAppointmentArrival,
  resetAppointment,
  setAppointment,
} from './appointmentSlice';

export {
  default as adminReducer,
  requestHelp,
  cancelHelpRequest,
  showPinModal,
  hidePinModal,
  setPinError,
  activateAdminMode,
  deactivateAdminMode,
  resetAdmin,
} from './adminSlice';
