// Performance: Use memoized refactored versions as default exports
export { WaitListTicketCard } from './WaitListTicketCardRefactored';
export { ServiceTicketCard } from './ServiceTicketCardRefactored';

// Legacy exports for backwards compatibility (deprecated)
export { WaitListTicketCard as WaitListTicketCardRefactored } from './WaitListTicketCardRefactored';
export { ServiceTicketCard as ServiceTicketCardRefactored } from './ServiceTicketCardRefactored';
export { WaitListTicketCard as WaitListTicketCardLegacy } from './WaitListTicketCard';
export { ServiceTicketCard as ServiceTicketCardLegacy } from './ServiceTicketCard';
