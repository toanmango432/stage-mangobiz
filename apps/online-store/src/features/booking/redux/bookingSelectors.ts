import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

// Base selectors
const selectBookingState = (state: RootState) => state.booking;

export const selectCurrentBooking = createSelector(
  [selectBookingState],
  (booking) => booking.currentBooking
);

export const selectServices = createSelector(
  [selectBookingState],
  (booking) => booking.services
);

export const selectCategories = createSelector(
  [selectBookingState],
  (booking) => booking.categories
);

export const selectStaff = createSelector(
  [selectBookingState],
  (booking) => booking.staff
);

export const selectCurrentStep = createSelector(
  [selectBookingState],
  (booking) => booking.currentStep
);

export const selectCartOpen = createSelector(
  [selectBookingState],
  (booking) => booking.cartOpen
);

export const selectLoading = createSelector(
  [selectBookingState],
  (booking) => booking.loading
);

export const selectError = createSelector(
  [selectBookingState],
  (booking) => booking.error
);

// Computed selectors
export const selectSelectedServices = createSelector(
  [selectCurrentBooking],
  (booking) => booking.services
);

export const selectServiceCount = createSelector(
  [selectSelectedServices],
  (services) => services.length
);

export const selectTotalDuration = createSelector(
  [selectSelectedServices],
  (services) => {
    return services.reduce((total, service) => {
      let duration = service.duration;
      
      // Add add-on durations
      if (service.selectedAddOns && service.addOns) {
        service.selectedAddOns.forEach(selected => {
          const addOn = service.addOns!.find(a => a.id === selected.id);
          if (addOn) {
            duration += addOn.duration * selected.quantity;
          }
        });
      }
      
      return total + duration;
    }, 0);
  }
);

export const selectTotalPrice = createSelector(
  [selectSelectedServices],
  (services) => {
    return services.reduce((total, service) => {
      let price = service.price;
      
      // Add add-on prices
      if (service.selectedAddOns && service.addOns) {
        service.selectedAddOns.forEach(selected => {
          const addOn = service.addOns!.find(a => a.id === selected.id);
          if (addOn) {
            price += addOn.price * selected.quantity;
          }
        });
      }
      
      return total + price;
    }, 0);
  }
);

export const selectSelectedStaff = createSelector(
  [selectCurrentBooking, selectStaff],
  (booking, staff) => {
    if (!booking.selectedStaffId) return null;
    return staff.find(s => s.id === booking.selectedStaffId) || null;
  }
);

export const selectAvailableTimeSlots = createSelector(
  [selectBookingState],
  (booking) => booking.availableTimeSlots
);

export const selectStoreOffDays = createSelector(
  [selectBookingState],
  (booking) => booking.storeOffDays
);

export const selectStaffOffDays = createSelector(
  [selectBookingState, selectCurrentBooking],
  (booking, currentBooking) => {
    if (!currentBooking.selectedStaffId) return [];
    return booking.staffOffDays[currentBooking.selectedStaffId] || [];
  }
);

export const selectAllOffDays = createSelector(
  [selectStoreOffDays, selectStaffOffDays],
  (storeOffDays, staffOffDays) => {
    return [...storeOffDays, ...staffOffDays];
  }
);

export const selectCanProceedToNextStep = createSelector(
  [selectCurrentStep, selectCurrentBooking, selectServiceCount],
  (step, booking, serviceCount) => {
    switch (step) {
      case 'services':
        return serviceCount > 0;
      case 'staff':
        return booking.selectedStaffId !== null;
      case 'datetime':
        return booking.selectedDate !== null && booking.selectedTime !== null;
      case 'customer':
        return booking.customer !== null && 
               booking.customer.firstName.trim() !== '' &&
               booking.customer.lastName.trim() !== '' &&
               booking.customer.email.trim() !== '' &&
               booking.customer.phone.trim() !== '';
      case 'review':
        return true;
      default:
        return false;
    }
  }
);

export const selectBookingSummary = createSelector(
  [
    selectSelectedServices,
    selectSelectedStaff,
    selectCurrentBooking,
    selectTotalPrice,
    selectTotalDuration,
  ],
  (services, staff, booking, totalPrice, totalDuration) => {
    return {
      services,
      staff,
      customer: booking.customer,
      date: booking.selectedDate,
      time: booking.selectedTime,
      notes: booking.notes,
      totalPrice,
      totalDuration,
    };
  }
);

export const selectSettings = createSelector(
  [selectBookingState],
  (booking) => booking.settings
);
