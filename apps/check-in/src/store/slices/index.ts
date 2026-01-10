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
