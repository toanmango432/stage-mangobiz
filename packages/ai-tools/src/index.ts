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
export * from './schemas/staff';
export * from './schemas/analytics';
export * from './schemas/system';

// Tool registry
export * from './registry';

// Schema index (all schemas re-exported)
export * from './schemas';

// Tool handlers (to be implemented in US-010 through US-011)
// export * from './handlers';

/**
 * Package version for tracking compatibility
 */
export const AI_TOOLS_VERSION = '1.0.0';
