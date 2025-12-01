// Client Settings Module - Main exports

export { ClientSettings } from './ClientSettings';
export { default as ClientSettingsDefault } from './ClientSettings';

// Types
export type {
  EnhancedClient,
  ClientContact,
  ClientAddress,
  EmergencyContact,
  HairProfile,
  SkinProfile,
  NailProfile,
  MedicalInfo,
  ClientPreferences,
  CommunicationPreferences,
  LoyaltyInfo,
  MembershipInfo,
  GiftCardBalance,
  VisitSummary,
  ClientTag,
  ClientNote,
  ColorFormula,
  ClientSettingsSection,
  ClientSettingsUIState,
  ClientFormErrors,
  ClientFilters,
  ClientSortOptions,
  ClientGender,
  LoyaltyTier,
  ClientSource,
  CommunicationChannel,
  ContactTimePreference,
  HairType,
  HairTexture,
  HairDensity,
  HairPorosity,
  ScalpCondition,
  SkinType,
  SkinConcern,
  NailCondition,
  NailShape,
} from './types';

// Constants
export {
  clientSettingsTokens,
  tierLabels,
  sourceLabels,
  genderLabels,
  defaultTags,
  mockClients,
  defaultClient,
} from './constants';

// Components
export { ClientList } from './components/ClientList';
export { AddClient } from './components/AddClient';

// Sections
export { ProfileSection } from './sections/ProfileSection';
export { PreferencesSection } from './sections/PreferencesSection';
export { BeautyProfileSection } from './sections/BeautyProfileSection';
export { HistorySection } from './sections/HistorySection';
export { NotesSection } from './sections/NotesSection';
export { LoyaltySection } from './sections/LoyaltySection';
