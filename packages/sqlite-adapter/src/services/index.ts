/**
 * SQLite Services
 *
 * Service classes providing SQLite-based implementations of data operations.
 * These services use SQL WHERE clauses for efficient filtering instead of JS filtering.
 *
 * @module sqlite-adapter/services
 */

// Client service
export {
  ClientSQLiteService,
  type Client,
  type ClientFilters,
  type ClientSortOptions,
} from './clientService';
