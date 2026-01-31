/**
 * @mango/ai-tools - Core Type Definitions
 *
 * Types for AI tool definitions, execution context, and results.
 * These types enable type-safe AI tool integration with Mango Connect.
 */

import type { z } from 'zod';

// ============================================================================
// Tool Categories
// ============================================================================

/**
 * Categories of AI tools available in Mango Biz.
 * Each category groups related operations for better tool discovery.
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
 * All supported tool categories
 */
export const AI_TOOL_CATEGORIES: AIToolCategory[] = [
  'clients',
  'appointments',
  'services',
  'tickets',
  'staff',
  'analytics',
  'system',
];

// ============================================================================
// Tool Definition
// ============================================================================

/**
 * Definition of an AI tool.
 * Tools are operations that AI can invoke to interact with Mango Biz.
 *
 * @template TParams - Zod schema for input parameters
 * @template TReturns - Zod schema for return value
 */
export interface AITool<
  TParams extends z.ZodTypeAny = z.ZodTypeAny,
  TReturns extends z.ZodTypeAny = z.ZodTypeAny,
> {
  /**
   * Unique identifier for the tool (e.g., 'searchClients', 'bookAppointment')
   */
  name: string;

  /**
   * Human-readable description explaining what the tool does.
   * This is shown to AI models to help them understand when to use the tool.
   */
  description: string;

  /**
   * Category this tool belongs to for grouping and discovery
   */
  category: AIToolCategory;

  /**
   * Zod schema defining the tool's input parameters.
   * Used for validation and JSON Schema generation.
   */
  parameters: TParams;

  /**
   * Zod schema defining the tool's return type.
   * Used for validation and documentation.
   */
  returns: TReturns;

  /**
   * Whether this tool requires special permissions.
   * Tools marked as sensitive may require manager approval or audit logging.
   */
  requiresPermission?: boolean;

  /**
   * Permission level required to execute this tool.
   * Examples: 'staff', 'manager', 'admin'
   */
  permissionLevel?: 'staff' | 'manager' | 'admin';

  /**
   * Tags for additional categorization and filtering
   */
  tags?: string[];
}

// ============================================================================
// Tool Execution
// ============================================================================

/**
 * Context provided when executing an AI tool.
 * Contains information about the current store, user, and execution environment.
 */
export interface ExecutionContext {
  /**
   * ID of the store where the operation is being performed
   */
  storeId: string;

  /**
   * ID of the user (staff member) invoking the tool
   */
  userId: string;

  /**
   * Logger instance for recording tool execution details
   */
  logger: ToolLogger;

  /**
   * Optional: Request ID for tracing across systems
   */
  requestId?: string;

  /**
   * Optional: Session ID for grouping related tool calls
   */
  sessionId?: string;

  /**
   * Optional: Timezone for date/time operations (IANA format, e.g., 'America/New_York')
   */
  timezone?: string;
}

/**
 * Logger interface for recording tool execution events.
 * Implementations can log to console, files, or external services.
 */
export interface ToolLogger {
  /**
   * Log debug information (verbose, development-only)
   */
  debug: (message: string, data?: Record<string, unknown>) => void;

  /**
   * Log general information
   */
  info: (message: string, data?: Record<string, unknown>) => void;

  /**
   * Log warning conditions
   */
  warn: (message: string, data?: Record<string, unknown>) => void;

  /**
   * Log error conditions
   */
  error: (message: string, data?: Record<string, unknown>) => void;
}

/**
 * Result returned by AI tool execution.
 * Wraps the actual return value with metadata about the execution.
 *
 * @template T - Type of the data returned on success
 */
export interface ToolResult<T = unknown> {
  /**
   * Whether the tool execution succeeded
   */
  success: boolean;

  /**
   * The data returned by the tool (only present on success)
   */
  data?: T;

  /**
   * Error message (only present on failure)
   */
  error?: string;

  /**
   * Error code for programmatic error handling
   */
  errorCode?: ToolErrorCode;

  /**
   * Additional metadata about the execution
   */
  metadata?: ToolResultMetadata;
}

/**
 * Standard error codes for tool failures.
 * Enables consistent error handling across all tools.
 */
export type ToolErrorCode =
  | 'INVALID_INPUT'
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'
  | 'TIMEOUT';

/**
 * Metadata attached to tool execution results.
 */
export interface ToolResultMetadata {
  /**
   * Time taken to execute the tool in milliseconds
   */
  executionTimeMs?: number;

  /**
   * Timestamp when the tool was executed (ISO 8601)
   */
  executedAt?: string;

  /**
   * Number of items returned (for list operations)
   */
  count?: number;

  /**
   * Total number of items available (for paginated results)
   */
  total?: number;

  /**
   * Whether there are more items available
   */
  hasMore?: boolean;

  /**
   * Cursor for pagination
   */
  nextCursor?: string;

  /**
   * Additional tool-specific metadata
   */
  [key: string]: unknown;
}

// ============================================================================
// Tool Handler Types
// ============================================================================

/**
 * Function signature for a tool handler.
 * Handlers implement the actual logic for executing a tool.
 *
 * @template TInput - Type of validated input parameters
 * @template TOutput - Type of the return value
 */
export type ToolHandler<TInput = unknown, TOutput = unknown> = (
  input: TInput,
  context: ExecutionContext
) => Promise<ToolResult<TOutput>>;

/**
 * Registry entry combining a tool definition with its handler.
 */
export interface ToolRegistryEntry<
  TParams extends z.ZodTypeAny = z.ZodTypeAny,
  TReturns extends z.ZodTypeAny = z.ZodTypeAny,
> {
  /**
   * The tool definition
   */
  tool: AITool<TParams, TReturns>;

  /**
   * The handler function that executes the tool
   */
  handler: ToolHandler<z.infer<TParams>, z.infer<TReturns>>;
}

// ============================================================================
// JSON Schema Types (for OpenAI/Anthropic compatibility)
// ============================================================================

/**
 * OpenAI function calling format
 */
export interface OpenAIFunctionDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * Anthropic tool use format
 */
export interface AnthropicToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

/**
 * Unified tool definition that can be converted to OpenAI or Anthropic format
 */
export interface UnifiedToolDefinition {
  name: string;
  description: string;
  category: AIToolCategory;
  parameters: Record<string, unknown>;
  returns?: Record<string, unknown>;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract the input type from an AITool
 */
export type ToolInput<T extends AITool> =
  T['parameters'] extends z.ZodTypeAny ? z.infer<T['parameters']> : never;

/**
 * Extract the output type from an AITool
 */
export type ToolOutput<T extends AITool> =
  T['returns'] extends z.ZodTypeAny ? z.infer<T['returns']> : never;

/**
 * Helper to create a successful tool result
 */
export function successResult<T>(
  data: T,
  metadata?: ToolResultMetadata
): ToolResult<T> {
  return {
    success: true,
    data,
    metadata: {
      executedAt: new Date().toISOString(),
      ...metadata,
    },
  };
}

/**
 * Helper to create a failed tool result
 */
export function errorResult(
  error: string,
  errorCode: ToolErrorCode = 'INTERNAL_ERROR',
  metadata?: ToolResultMetadata
): ToolResult<never> {
  return {
    success: false,
    error,
    errorCode,
    metadata: {
      executedAt: new Date().toISOString(),
      ...metadata,
    },
  };
}
