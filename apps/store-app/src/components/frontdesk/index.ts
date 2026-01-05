// Front Desk Module - Barrel Export
export { FrontDesk } from './FrontDesk';
export { FrontDeskMetrics } from './FrontDeskMetrics';
export { StaffSidebar } from './StaffSidebar';
export { ServiceSection } from './ServiceSection';
export { WaitListSection } from './WaitListSection';
export { ComingAppointments } from './ComingAppointments';
export { CreateTicketButton } from './CreateTicketButton';
export { FloatingActionButton } from './FloatingActionButton';

// Sub-components
export { MobileTabBar, tabColors } from './MobileTabBar';
export type { MobileTab } from './MobileTabBar';
export { MobileTeamSection } from './MobileTeamSection';
export { FrontDeskHeader, HeaderActionButton } from './FrontDeskHeader';
export { FrontDeskEmptyState } from './FrontDeskEmptyState';
export * from './FrontDeskSkeleton';
export { FrontDeskSubTabs } from './FrontDeskSubTabs';
export { ErrorBoundary } from './ErrorBoundary';
export { SearchBar } from './SearchBar';
export { ViewModeToggle } from './ViewModeToggle';
export { PendingSectionFooter } from './PendingSectionFooter';
export { EmbeddableWaitList } from './EmbeddableWaitList';

// Error Boundaries
export {
  TeamSectionErrorBoundary,
  WaitListErrorBoundary,
  ServiceSectionErrorBoundary,
  ComingAppointmentsErrorBoundary,
  SettingsErrorBoundary
} from './SectionErrorBoundary';

// Tokens & Themes
export * from './headerTokens';
