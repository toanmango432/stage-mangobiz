// Booking Module - Main Export File
// Import everything you need from this single file

// Pages
export { BookingPage } from './pages/BookingPage';
export { ServiceSelection } from './pages/ServiceSelection';
export { StaffSelection } from './pages/StaffSelection';
export { TimeSelection } from './pages/TimeSelection';
export { CustomerInfo } from './pages/CustomerInfo';
export { BookingReview } from './pages/BookingReview';
export { BookingConfirmation } from './pages/BookingConfirmation';

// Components
export { Calendar } from './components/Calendar';
export { TimeSlots } from './components/TimeSlots';
export { ServiceCard } from './components/ServiceCard';
export { StaffCard } from './components/StaffCard';
export { Cart } from './components/Cart';
export { BookingSummary } from './components/BookingSummary';

// Redux
export { default as bookingReducer } from './redux/bookingSlice';
export * from './redux/bookingSlice';
export * from './redux/bookingSelectors';

// Services
export { BookingAPIService, bookingThunks } from './services/bookingService';

// Utils
export { TimeUtils } from './utils/timeUtils';

// Types
export type * from './types/booking.types';
