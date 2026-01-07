import { storefrontHandlers } from './storefront';
import { bookingHandlers } from './booking';
import { cartHandlers } from './cart';
import { promotionHandlers } from './promotions';
import { announcementHandlers } from './announcements';
import { aiHandlers } from './ai';

// Export all handlers
export const handlers = [
  ...storefrontHandlers,
  ...bookingHandlers,
  ...cartHandlers,
  ...promotionHandlers,
  ...announcementHandlers,
  ...aiHandlers,
];




