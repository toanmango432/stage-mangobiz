/**
 * Supabase Table Operations - Barrel Export
 * Central export for all Supabase table CRUD operations
 */

// Core Module Tables
export { clientsTable } from './clientsTable';
export { staffTable } from './staffTable';
export { servicesTable } from './servicesTable';
export { appointmentsTable } from './appointmentsTable';
export { ticketsTable } from './ticketsTable';
export { transactionsTable } from './transactionsTable';

// Team Module Tables
export { timesheetsTable } from './timesheetsTable';
export { payRunsTable } from './payRunsTable';
export { turnLogsTable } from './turnLogsTable';
export { timeOffRequestsTable } from './timeOffRequestsTable';
export { staffRatingsTable } from './staffRatingsTable';

// Gift Card Tables
export { giftCardsTable } from './giftCardsTable';

// Catalog Module Tables (migration 031)
export { serviceCategoriesTable } from './serviceCategoriesTable';
export { menuServicesTable } from './menuServicesTable';
export { serviceVariantsTable } from './serviceVariantsTable';
export { servicePackagesTable } from './servicePackagesTable';
export { addOnGroupsTable } from './addOnGroupsTable';
export { addOnOptionsTable } from './addOnOptionsTable';
export { staffServiceAssignmentsTable } from './staffServiceAssignmentsTable';
export { catalogSettingsTable } from './catalogSettingsTable';
export { bookingSequencesTable } from './bookingSequencesTable';
export { productsTable } from './productsTable';
export { giftCardDenominationsTable } from './giftCardDenominationsTable';
export { giftCardSettingsTable } from './giftCardSettingsTable';
