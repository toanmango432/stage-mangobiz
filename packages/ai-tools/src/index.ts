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

// Types - Core type definitions for AI tools
export * from './types';

// Schema converter utilities - Convert Zod schemas to JSON Schema
export * from './utils/schema-converter';

// Tool schemas by category
export * from './schemas/clients';
export * from './schemas/appointments';
export * from './schemas/services';
export * from './schemas/tickets';

// Tool registry (to be implemented in US-009)
// export * from './registry';

// Tool handlers (to be implemented in US-010 through US-011)
// export * from './handlers';

/**
 * Package version for tracking compatibility
 */
export const AI_TOOLS_VERSION = '1.0.0';
