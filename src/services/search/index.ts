/**
 * Global Search Engine
 *
 * Universal search across all Mango POS entities:
 * - Clients
 * - Staff
 * - Services
 * - Appointments
 * - Tickets
 * - Transactions
 * - Settings
 *
 * Features:
 * - Fuzzy text matching with typo tolerance
 * - Phone number partial matching
 * - Prefix-based filtering (#ticket, @client, $amount, date:, set:, etc.)
 * - Quick actions for immediate entity operations
 * - Offline-first with IndexedDB support
 *
 * Usage:
 * ```typescript
 * import { searchService } from '@/services/search';
 *
 * // Initialize index (call once on app startup)
 * await searchService.initializeSearchIndex(storeId);
 *
 * // Perform search
 * const { results, groups, totalCount } = await searchService.search('Emily');
 *
 * // With prefix
 * const ticketResults = await searchService.search('#91');
 * const clientResults = await searchService.search('@john');
 * const amountResults = await searchService.search('$50-100');
 * const settingsResults = await searchService.search('set:tax');
 * ```
 */

// Main search service
export { searchService, default } from './searchService';
export {
  search,
  initializeSearchIndex,
  isIndexReady,
  getIndexStats,
  rebuildIndex,
  updateEntity,
  removeEntity,
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  removeRecentSearch,
} from './searchService';

// Types
export type {
  SearchEntityType,
  SearchPrefix,
  SearchBadge,
  QuickAction,
  SearchResult,
  SearchResultData,
  SearchOptions,
  FuzzyMatchOptions,
  FuzzyMatchResult,
  ParsedQuery,
  DateFilter,
  AmountFilter,
  IndexedEntity,
  SearchResultDisplayData,
  SearchState,
  SearchResultGroup,
  RecentSearch,
  EntitySearcher,
} from './types';

export {
  ENTITY_CONFIG,
  PREFIX_CONFIG,
  DEFAULT_SEARCH_OPTIONS,
  DEFAULT_FUZZY_OPTIONS,
} from './types';

// Query parser utilities
export {
  parseSearchQuery,
  detectPrefix,
  removePrefix,
  parseDateFilter,
  parseAmountFilter,
  getSuggestedPrefixes,
  isValidSearchQuery,
  formatQueryForDisplay,
} from './queryParser';

// Fuzzy matcher utilities
export {
  levenshteinDistance,
  fuzzyMatch,
  findBestMatch,
  matchFields,
  matchPhone,
  normalizePhone,
  normalizeText,
  tokenize,
  isPhoneQuery,
  extractPhoneDigits,
} from './fuzzyMatcher';

// Search index (for advanced usage)
export { searchIndex, SearchIndex } from './searchIndex';

// Entity searchers (for advanced usage)
export {
  toSearchResult,
  groupResultsByType,
  sortResultsWithinGroups,
  getClientActions,
  getStaffActions,
  getServiceActions,
  getAppointmentActions,
  getTicketActions,
  getTransactionActions,
  getSettingActions,
  getPageActions,
} from './searchers';

// Settings registry (for settings search)
export {
  SETTINGS_REGISTRY,
  SETTING_CATEGORY_CONFIG,
  getSettingsByCategory,
  getSettingById,
  searchSettings,
  getCategorySummary,
} from './settingsRegistry';
export type { SettingEntry, SettingCategory } from './settingsRegistry';

// Pages registry (for page/navigation search)
export {
  PAGES_REGISTRY,
  getPagesByCategory,
  getPageById,
  getPagesForDevice,
} from './pagesRegistry';
export type { PageEntry } from './pagesRegistry';
