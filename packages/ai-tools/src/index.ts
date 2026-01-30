/**
 * @mango/ai-tools
 *
 * AI tool definitions for Mango Connect integration.
 * This package provides schemas, handlers, and a registry for AI-controllable operations.
 *
 * Usage:
 * - Import tool schemas for AI function calling definitions
 * - Import handlers to execute tool operations
 * - Import registry for tool discovery and validation
 */

// Types (to be implemented in US-002)
// export * from './types';

// Schema converter utilities (to be implemented in US-002)
// export * from './utils/schema-converter';

// Tool schemas by category (to be implemented in US-003 through US-008)
// export * from './schemas';

// Tool registry (to be implemented in US-009)
// export * from './registry';

// Tool handlers (to be implemented in US-010 through US-011)
// export * from './handlers';

/**
 * Package version for tracking compatibility
 */
export const AI_TOOLS_VERSION = '1.0.0';

/**
 * Placeholder: Tool categories supported by this package
 * Full implementation in US-002
 */
export type AIToolCategory =
  | 'clients'
  | 'appointments'
  | 'services'
  | 'tickets'
  | 'staff'
  | 'analytics'
  | 'system';

/**
 * Placeholder: List of supported categories
 */
export const SUPPORTED_CATEGORIES: AIToolCategory[] = [
  'clients',
  'appointments',
  'services',
  'tickets',
  'staff',
  'analytics',
  'system',
];
