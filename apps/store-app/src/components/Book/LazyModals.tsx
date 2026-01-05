/**
 * Lazy Loaded Modals for Book Module
 * Phase 8: Performance Optimization
 *
 * Modals are lazy loaded to reduce initial bundle size and improve
 * time-to-interactive. Components are only loaded when needed.
 */

import { lazy, Suspense, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

// ============================================================================
// LOADING FALLBACK
// ============================================================================

interface ModalLoadingFallbackProps {
  size?: 'sm' | 'md' | 'lg';
}

export function ModalLoadingFallback({ size = 'md' }: ModalLoadingFallbackProps) {
  const sizeClasses = {
    sm: 'w-64 h-48',
    md: 'w-96 h-64',
    lg: 'w-[600px] h-96',
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm`}
    >
      <div
        className={`${sizeClasses[size]} bg-white rounded-2xl shadow-2xl flex items-center justify-center`}
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LAZY LOADED MODALS
// ============================================================================

/**
 * Lazy load NewAppointmentModal.v2
 */
export const LazyNewAppointmentModalV2 = lazy(() =>
  import('./NewAppointmentModal.v2').then(module => ({
    default: module.NewAppointmentModalV2,
  }))
);

/**
 * Lazy load AppointmentDetailsModal
 */
export const LazyAppointmentDetailsModal = lazy(() =>
  import('./AppointmentDetailsModal').then(module => ({
    default: module.AppointmentDetailsModal,
  }))
);

/**
 * Lazy load EditAppointmentModal
 */
export const LazyEditAppointmentModal = lazy(() =>
  import('./EditAppointmentModal').then(module => ({
    default: module.EditAppointmentModal,
  }))
);

/**
 * Lazy load GroupBookingModal
 */
export const LazyGroupBookingModal = lazy(() =>
  import('./GroupBookingModal').then(module => ({
    default: module.GroupBookingModal,
  }))
);

/**
 * Lazy load CustomerSearchModal
 */
export const LazyCustomerSearchModal = lazy(() =>
  import('./CustomerSearchModal').then(module => ({
    default: module.CustomerSearchModal,
  }))
);

/**
 * Lazy load QuickClientModal
 */
export const LazyQuickClientModal = lazy(() =>
  import('./QuickClientModal').then(module => ({
    default: module.QuickClientModal,
  }))
);

/**
 * Lazy load DatePickerModal
 */
export const LazyDatePickerModal = lazy(() =>
  import('./DatePickerModal').then(module => ({
    default: module.DatePickerModal,
  }))
);

/**
 * Lazy load CommandPalette
 */
export const LazyCommandPalette = lazy(() =>
  import('./CommandPalette').then(module => ({
    default: module.CommandPalette,
  }))
);

// ============================================================================
// LAZY LOADED VIEWS
// ============================================================================

/**
 * Lazy load WeekView
 */
export const LazyWeekView = lazy(() =>
  import('./WeekView').then(module => ({
    default: module.WeekView,
  }))
);

/**
 * Lazy load MonthView
 */
export const LazyMonthView = lazy(() =>
  import('./MonthView').then(module => ({
    default: module.MonthView,
  }))
);

/**
 * Lazy load AgendaView
 */
export const LazyAgendaView = lazy(() =>
  import('./AgendaView').then(module => ({
    default: module.AgendaView,
  }))
);

/**
 * Lazy load TimelineView
 */
export const LazyTimelineView = lazy(() =>
  import('./TimelineView').then(module => ({
    default: module.TimelineView,
  }))
);

// ============================================================================
// SUSPENSE WRAPPER
// ============================================================================

interface LazyModalWrapperProps {
  isOpen: boolean;
  children: ReactNode;
  fallbackSize?: 'sm' | 'md' | 'lg';
}

/**
 * Wrapper component that handles Suspense for lazy modals
 * Only renders when isOpen is true to prevent unnecessary loading
 */
export function LazyModalWrapper({
  isOpen,
  children,
  fallbackSize = 'md',
}: LazyModalWrapperProps) {
  if (!isOpen) return null;

  return (
    <Suspense fallback={<ModalLoadingFallback size={fallbackSize} />}>
      {children}
    </Suspense>
  );
}

// ============================================================================
// PRELOAD UTILITIES
// ============================================================================

/**
 * Preload a modal on hover to reduce perceived loading time
 * Call this on mouse enter of the trigger button
 */
export const preloadModals = {
  newAppointment: () => import('./NewAppointmentModal.v2'),
  appointmentDetails: () => import('./AppointmentDetailsModal'),
  editAppointment: () => import('./EditAppointmentModal'),
  groupBooking: () => import('./GroupBookingModal'),
  customerSearch: () => import('./CustomerSearchModal'),
  quickClient: () => import('./QuickClientModal'),
  datePicker: () => import('./DatePickerModal'),
  commandPalette: () => import('./CommandPalette'),
  weekView: () => import('./WeekView'),
  monthView: () => import('./MonthView'),
  agendaView: () => import('./AgendaView'),
  timelineView: () => import('./TimelineView'),
};

/**
 * Hook to preload modal on hover
 * Usage:
 * const preloadProps = usePreloadOnHover(preloadModals.newAppointment);
 * <button {...preloadProps}>New Appointment</button>
 */
export function usePreloadOnHover(preloadFn: () => Promise<unknown>) {
  let loaded = false;

  return {
    onMouseEnter: () => {
      if (!loaded) {
        preloadFn().then(() => {
          loaded = true;
        });
      }
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Modals
  LazyNewAppointmentModalV2,
  LazyAppointmentDetailsModal,
  LazyEditAppointmentModal,
  LazyGroupBookingModal,
  LazyCustomerSearchModal,
  LazyQuickClientModal,
  LazyDatePickerModal,
  LazyCommandPalette,

  // Views
  LazyWeekView,
  LazyMonthView,
  LazyAgendaView,
  LazyTimelineView,

  // Utilities
  ModalLoadingFallback,
  LazyModalWrapper,
  preloadModals,
  usePreloadOnHover,
};
