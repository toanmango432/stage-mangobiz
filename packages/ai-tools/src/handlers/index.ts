/**
 * @mango/ai-tools - Tool Handlers Index & Dispatcher
 *
 * Central export for all tool handlers and the unified executeTool dispatcher.
 * The dispatcher validates input and routes to the appropriate handler.
 *
 * Usage:
 * - Import individual handlers for direct use
 * - Import executeTool for unified tool execution with validation
 * - Import set*DataProvider functions to configure data providers at startup
 */

import type { ExecutionContext, ToolResult, ToolHandler } from '../types';
import { errorResult } from '../types';
import { validateToolInput } from '../registry';
import { getToolByName } from '../registry';

// Re-export all handlers by category
export * from './clients';
export * from './appointments';
export * from './services';
export * from './tickets';
export * from './staff';
export * from './analytics';
export * from './system';

// Import handler registries
import { clientHandlers } from './clients';
import { appointmentHandlers } from './appointments';
import { serviceHandlers } from './services';
import { ticketHandlers } from './tickets';
import { staffHandlers } from './staff';
import { analyticsHandlers } from './analytics';
import { systemHandlers } from './system';

// ============================================================================
// Handler Registry
// ============================================================================

/**
 * All handlers combined into a single registry for dispatch.
 * Keys are tool names, values are handler functions.
 *
 * Note: We use `unknown` for the generic parameters because the dispatcher
 * validates input against schemas before calling handlers.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const allHandlers: Record<string, ToolHandler<any, any>> = {
  // Client handlers
  ...clientHandlers,

  // Appointment handlers
  ...appointmentHandlers,

  // Service handlers
  ...serviceHandlers,

  // Ticket handlers
  ...ticketHandlers,

  // Staff handlers
  ...staffHandlers,

  // Analytics handlers
  ...analyticsHandlers,

  // System handlers
  ...systemHandlers,
};

// ============================================================================
// Tool Dispatcher
// ============================================================================

/**
 * Options for tool execution
 */
export interface ExecuteToolOptions {
  /**
   * Skip input validation (use if you've already validated)
   */
  skipValidation?: boolean;

  /**
   * Include stack trace in error responses (for debugging)
   */
  includeStackTrace?: boolean;
}

/**
 * Execute a tool by name with validated input.
 *
 * This is the primary entry point for executing AI tools. It:
 * 1. Validates the tool exists in the registry
 * 2. Validates input against the tool's schema (unless skipped)
 * 3. Executes the appropriate handler
 * 4. Returns a standardized ToolResult
 *
 * @param toolName - The name of the tool to execute (e.g., 'searchClients')
 * @param input - The input parameters for the tool
 * @param context - Execution context with storeId, userId, and logger
 * @param options - Optional execution options
 * @returns Promise<ToolResult> with success/error and data
 *
 * @example
 * const result = await executeTool(
 *   'searchClients',
 *   { query: 'John', limit: 10 },
 *   { storeId: 'store-123', userId: 'user-456', logger }
 * );
 *
 * if (result.success) {
 *   console.log('Found clients:', result.data);
 * } else {
 *   console.error('Error:', result.error);
 * }
 */
export async function executeTool<T = unknown>(
  toolName: string,
  input: unknown,
  context: ExecutionContext,
  options: ExecuteToolOptions = {}
): Promise<ToolResult<T>> {
  const startTime = Date.now();

  // Log the execution start
  context.logger.info('Executing tool', {
    toolName,
    storeId: context.storeId,
    userId: context.userId,
    requestId: context.requestId,
  });

  try {
    // Check if tool exists
    const tool = getToolByName(toolName);
    if (!tool) {
      context.logger.warn('Tool not found', { toolName });
      return errorResult(
        `Tool '${toolName}' not found in registry`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      ) as ToolResult<T>;
    }

    // Get the handler
    const handler = allHandlers[toolName];
    if (!handler) {
      context.logger.error('Handler not found for tool', { toolName });
      return errorResult(
        `Handler not implemented for tool '${toolName}'`,
        'INTERNAL_ERROR',
        { executionTimeMs: Date.now() - startTime }
      ) as ToolResult<T>;
    }

    // Validate input unless skipped
    let validatedInput = input;
    if (!options.skipValidation) {
      const validationResult = validateToolInput(toolName, input);
      if (!validationResult.success) {
        context.logger.warn('Input validation failed', {
          toolName,
          error: validationResult.message,
        });
        return errorResult(
          `Invalid input for tool '${toolName}': ${validationResult.message}`,
          'INVALID_INPUT',
          { executionTimeMs: Date.now() - startTime }
        ) as ToolResult<T>;
      }
      validatedInput = validationResult.data;
    }

    // Check permissions if tool requires them
    if (tool.requiresPermission) {
      context.logger.info('Tool requires permission', {
        toolName,
        permissionLevel: tool.permissionLevel,
      });
      // Note: Actual permission checking should be done by the data provider
      // This is just logging for awareness
    }

    // Execute the handler
    const result = await handler(validatedInput, context);

    // Log completion
    context.logger.info('Tool execution completed', {
      toolName,
      success: result.success,
      executionTimeMs: result.metadata?.executionTimeMs ?? Date.now() - startTime,
    });

    return result as ToolResult<T>;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    context.logger.error('Tool execution failed with exception', {
      toolName,
      error: errorMessage,
      stack: options.includeStackTrace ? errorStack : undefined,
    });

    return errorResult(
      `Tool execution failed: ${errorMessage}`,
      'INTERNAL_ERROR',
      {
        executionTimeMs: Date.now() - startTime,
        stack: options.includeStackTrace ? errorStack : undefined,
      }
    ) as ToolResult<T>;
  }
}

/**
 * Execute multiple tools in parallel.
 *
 * Useful when you need to gather data from multiple tools simultaneously.
 * All tools execute in parallel, and results are returned in an array.
 *
 * @param tools - Array of tool execution requests
 * @param context - Shared execution context
 * @param options - Optional execution options
 * @returns Promise<ToolResult[]> array of results in same order as input
 *
 * @example
 * const results = await executeToolsParallel([
 *   { toolName: 'searchClients', input: { query: 'John' } },
 *   { toolName: 'getOnDutyStaff', input: {} },
 * ], context);
 */
export async function executeToolsParallel<T = unknown>(
  tools: Array<{ toolName: string; input: unknown }>,
  context: ExecutionContext,
  options: ExecuteToolOptions = {}
): Promise<ToolResult<T>[]> {
  context.logger.info('Executing tools in parallel', {
    count: tools.length,
    tools: tools.map((t) => t.toolName),
  });

  const promises = tools.map((t) =>
    executeTool<T>(t.toolName, t.input, context, options)
  );

  const results = await Promise.all(promises);

  const successCount = results.filter((r) => r.success).length;
  context.logger.info('Parallel tool execution completed', {
    total: results.length,
    successful: successCount,
    failed: results.length - successCount,
  });

  return results;
}

/**
 * Execute multiple tools in sequence.
 *
 * Useful when you need to execute tools that depend on each other.
 * Each tool executes after the previous one completes.
 *
 * @param tools - Array of tool execution requests
 * @param context - Shared execution context
 * @param options - Optional execution options
 * @param stopOnError - If true, stops execution on first error (default: false)
 * @returns Promise<ToolResult[]> array of results in same order as input
 */
export async function executeToolsSequential<T = unknown>(
  tools: Array<{ toolName: string; input: unknown }>,
  context: ExecutionContext,
  options: ExecuteToolOptions = {},
  stopOnError = false
): Promise<ToolResult<T>[]> {
  context.logger.info('Executing tools sequentially', {
    count: tools.length,
    tools: tools.map((t) => t.toolName),
    stopOnError,
  });

  const results: ToolResult<T>[] = [];

  for (const tool of tools) {
    const result = await executeTool<T>(tool.toolName, tool.input, context, options);
    results.push(result);

    if (stopOnError && !result.success) {
      context.logger.warn('Sequential execution stopped due to error', {
        failedTool: tool.toolName,
        completedCount: results.length,
      });
      break;
    }
  }

  return results;
}

// ============================================================================
// Handler Information
// ============================================================================

/**
 * Get list of all implemented handler names.
 */
export function getImplementedHandlers(): string[] {
  return Object.keys(allHandlers);
}

/**
 * Check if a handler is implemented for a tool.
 */
export function hasHandler(toolName: string): boolean {
  return toolName in allHandlers;
}

/**
 * Get handler counts by category.
 */
export function getHandlerStats(): Record<string, number> {
  return {
    clients: Object.keys(clientHandlers).length,
    appointments: Object.keys(appointmentHandlers).length,
    services: Object.keys(serviceHandlers).length,
    tickets: Object.keys(ticketHandlers).length,
    staff: Object.keys(staffHandlers).length,
    analytics: Object.keys(analyticsHandlers).length,
    system: Object.keys(systemHandlers).length,
    total: Object.keys(allHandlers).length,
  };
}
