/**
 * @mango/ai-tools - Tool Registry
 *
 * Central registry for all AI tools. This is the single source of truth
 * that Mango Connect imports for tool definitions.
 *
 * Usage:
 * - getToolByName('searchClients') - Get a specific tool by name
 * - getToolsByCategory('clients') - Get all tools in a category
 * - getAllToolDefinitions() - Get all tools in OpenAI/Anthropic format
 * - validateToolInput('searchClients', input) - Validate input for a tool
 */

import type { z, ZodError } from 'zod';
import type {
  AITool,
  AIToolCategory,
  OpenAIFunctionDefinition,
  AnthropicToolDefinition,
  UnifiedToolDefinition,
} from './types';
import {
  generateOpenAIDefinition,
  generateAnthropicDefinition,
  generateToolDefinition,
} from './utils/schema-converter';

// Import all tool definitions
import { clientTools } from './schemas/clients';
import { appointmentTools } from './schemas/appointments';
import { serviceTools } from './schemas/services';
import { ticketTools } from './schemas/tickets';
import { staffTools } from './schemas/staff';
import { analyticsTools } from './schemas/analytics';
import { systemTools } from './schemas/system';

// ============================================================================
// Tool Registry
// ============================================================================

/**
 * All available AI tools, organized for quick lookup
 */
const allTools: AITool[] = [
  ...clientTools,
  ...appointmentTools,
  ...serviceTools,
  ...ticketTools,
  ...staffTools,
  ...analyticsTools,
  ...systemTools,
];

/**
 * Tool registry map for O(1) lookup by name
 */
const toolsByName = new Map<string, AITool>(
  allTools.map((tool) => [tool.name, tool])
);

/**
 * Tool registry map for O(1) lookup by category
 */
const toolsByCategory = new Map<AIToolCategory, AITool[]>();

// Initialize category map
for (const tool of allTools) {
  const categoryTools = toolsByCategory.get(tool.category) ?? [];
  categoryTools.push(tool);
  toolsByCategory.set(tool.category, categoryTools);
}

/**
 * The tool registry object containing all tools indexed by name.
 * Use this for direct access to tool definitions.
 *
 * @example
 * const tool = toolRegistry['searchClients'];
 * console.log(tool.description);
 */
export const toolRegistry: Record<string, AITool> = Object.fromEntries(toolsByName);

// ============================================================================
// Registry Functions
// ============================================================================

/**
 * Get a specific tool by its name.
 *
 * @param name - The tool name (e.g., 'searchClients', 'bookAppointment')
 * @returns The tool definition, or undefined if not found
 *
 * @example
 * const tool = getToolByName('searchClients');
 * if (tool) {
 *   console.log(tool.description);
 * }
 */
export function getToolByName(name: string): AITool | undefined {
  return toolsByName.get(name);
}

/**
 * Get all tools in a specific category.
 *
 * @param category - The category to filter by
 * @returns Array of tools in that category, or empty array if none
 *
 * @example
 * const clientTools = getToolsByCategory('clients');
 * console.log(`Found ${clientTools.length} client tools`);
 */
export function getToolsByCategory(category: AIToolCategory): AITool[] {
  return toolsByCategory.get(category) ?? [];
}

/**
 * Get all available tools.
 *
 * @returns Array of all registered tools
 */
export function getAllTools(): AITool[] {
  return [...allTools];
}

/**
 * Get all tool names.
 *
 * @returns Array of all tool names
 */
export function getToolNames(): string[] {
  return Array.from(toolsByName.keys());
}

/**
 * Get all categories that have tools.
 *
 * @returns Array of categories with at least one tool
 */
export function getCategories(): AIToolCategory[] {
  return Array.from(toolsByCategory.keys());
}

/**
 * Check if a tool exists in the registry.
 *
 * @param name - The tool name to check
 * @returns True if the tool exists
 */
export function hasTools(name: string): boolean {
  return toolsByName.has(name);
}

// ============================================================================
// Definition Generators
// ============================================================================

/**
 * Get all tool definitions in OpenAI function calling format.
 *
 * @returns Array of OpenAI-compatible function definitions
 *
 * @example
 * const functions = getAllOpenAIDefinitions();
 * // Use with OpenAI API: { functions }
 */
export function getAllOpenAIDefinitions(): OpenAIFunctionDefinition[] {
  return allTools.map(generateOpenAIDefinition);
}

/**
 * Get all tool definitions in Anthropic tool use format.
 *
 * @returns Array of Anthropic-compatible tool definitions
 *
 * @example
 * const tools = getAllAnthropicDefinitions();
 * // Use with Anthropic API: { tools }
 */
export function getAllAnthropicDefinitions(): AnthropicToolDefinition[] {
  return allTools.map(generateAnthropicDefinition);
}

/**
 * Get all tool definitions in unified format with metadata.
 * This is the primary export for Mango Connect.
 *
 * @param format - Output format: 'openai', 'anthropic', or 'unified' (default)
 * @returns Array of tool definitions in the requested format
 *
 * @example
 * // Get unified format (default)
 * const tools = getAllToolDefinitions();
 *
 * // Get OpenAI format
 * const openaiTools = getAllToolDefinitions('openai');
 *
 * // Get Anthropic format
 * const anthropicTools = getAllToolDefinitions('anthropic');
 */
export function getAllToolDefinitions(): UnifiedToolDefinition[];
export function getAllToolDefinitions(format: 'unified'): UnifiedToolDefinition[];
export function getAllToolDefinitions(format: 'openai'): OpenAIFunctionDefinition[];
export function getAllToolDefinitions(format: 'anthropic'): AnthropicToolDefinition[];
export function getAllToolDefinitions(
  format: 'unified' | 'openai' | 'anthropic' = 'unified'
): UnifiedToolDefinition[] | OpenAIFunctionDefinition[] | AnthropicToolDefinition[] {
  switch (format) {
    case 'openai':
      return getAllOpenAIDefinitions();
    case 'anthropic':
      return getAllAnthropicDefinitions();
    case 'unified':
    default:
      return allTools.map((tool) => generateToolDefinition(tool));
  }
}

/**
 * Get tool definitions for specific categories.
 *
 * @param categories - Array of categories to include
 * @param format - Output format (default: 'unified')
 * @returns Array of tool definitions for the specified categories
 */
export function getToolDefinitionsForCategories(
  categories: AIToolCategory[],
  format: 'unified' | 'openai' | 'anthropic' = 'unified'
): UnifiedToolDefinition[] | OpenAIFunctionDefinition[] | AnthropicToolDefinition[] {
  const filteredTools = allTools.filter((tool) => categories.includes(tool.category));

  switch (format) {
    case 'openai':
      return filteredTools.map(generateOpenAIDefinition);
    case 'anthropic':
      return filteredTools.map(generateAnthropicDefinition);
    case 'unified':
    default:
      return filteredTools.map((tool) => generateToolDefinition(tool));
  }
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Result of tool input validation.
 */
export interface ValidationResult<T = unknown> {
  /** Whether validation passed */
  success: boolean;
  /** Validated and parsed data (only present on success) */
  data?: T;
  /** Validation error (only present on failure) */
  error?: ZodError;
  /** Human-readable error message (only present on failure) */
  message?: string;
}

/**
 * Validate input for a specific tool using its Zod schema.
 *
 * @param toolName - The name of the tool to validate input for
 * @param input - The input data to validate
 * @returns Validation result with success status and data or error
 *
 * @example
 * const result = validateToolInput('searchClients', { query: 'John', limit: 10 });
 * if (result.success) {
 *   console.log('Valid input:', result.data);
 * } else {
 *   console.error('Invalid input:', result.message);
 * }
 */
export function validateToolInput<T = unknown>(
  toolName: string,
  input: unknown
): ValidationResult<T> {
  const tool = toolsByName.get(toolName);

  if (!tool) {
    return {
      success: false,
      message: `Tool '${toolName}' not found in registry`,
    };
  }

  try {
    const schema = tool.parameters as z.ZodTypeAny;
    const data = schema.parse(input) as T;
    return {
      success: true,
      data,
    };
  } catch (err) {
    const zodError = err as ZodError;
    return {
      success: false,
      error: zodError,
      message: formatZodError(zodError),
    };
  }
}

/**
 * Format a Zod error into a human-readable message.
 */
function formatZodError(error: ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
    return `${path}${issue.message}`;
  });
  return issues.join('; ');
}

/**
 * Validate input and throw if invalid.
 * Use when you want to fail fast on invalid input.
 *
 * @param toolName - The name of the tool to validate input for
 * @param input - The input data to validate
 * @returns The validated and parsed data
 * @throws Error if tool not found or input is invalid
 */
export function validateToolInputOrThrow<T = unknown>(
  toolName: string,
  input: unknown
): T {
  const result = validateToolInput<T>(toolName, input);

  if (!result.success) {
    throw new Error(`Validation failed for tool '${toolName}': ${result.message}`);
  }

  return result.data as T;
}

// ============================================================================
// Registry Statistics
// ============================================================================

/**
 * Statistics about the tool registry.
 */
export interface RegistryStats {
  /** Total number of tools */
  totalTools: number;
  /** Number of tools by category */
  byCategory: Record<AIToolCategory, number>;
  /** Number of tools requiring permissions */
  requiresPermission: number;
  /** Breakdown of tools by permission level */
  byPermissionLevel: {
    staff: number;
    manager: number;
    admin: number;
  };
}

/**
 * Get statistics about the tool registry.
 *
 * @returns Statistics object with tool counts and breakdowns
 */
export function getRegistryStats(): RegistryStats {
  const stats: RegistryStats = {
    totalTools: allTools.length,
    byCategory: {} as Record<AIToolCategory, number>,
    requiresPermission: 0,
    byPermissionLevel: {
      staff: 0,
      manager: 0,
      admin: 0,
    },
  };

  for (const [category, tools] of toolsByCategory) {
    stats.byCategory[category] = tools.length;
  }

  for (const tool of allTools) {
    if (tool.requiresPermission) {
      stats.requiresPermission++;
      if (tool.permissionLevel) {
        stats.byPermissionLevel[tool.permissionLevel]++;
      }
    }
  }

  return stats;
}

// ============================================================================
// Tool Filtering
// ============================================================================

/**
 * Options for filtering tools.
 */
export interface ToolFilterOptions {
  /** Filter by categories */
  categories?: AIToolCategory[];
  /** Filter by tags (any match) */
  tags?: string[];
  /** Filter by permission requirement */
  requiresPermission?: boolean;
  /** Filter by permission level */
  permissionLevel?: 'staff' | 'manager' | 'admin';
  /** Search in tool names and descriptions */
  search?: string;
}

/**
 * Filter tools based on various criteria.
 *
 * @param options - Filter options
 * @returns Array of tools matching the criteria
 *
 * @example
 * // Get all read-only client tools
 * const tools = filterTools({
 *   categories: ['clients'],
 *   tags: ['read'],
 * });
 */
export function filterTools(options: ToolFilterOptions): AITool[] {
  let result = allTools;

  if (options.categories && options.categories.length > 0) {
    result = result.filter((tool) => options.categories!.includes(tool.category));
  }

  if (options.tags && options.tags.length > 0) {
    result = result.filter(
      (tool) =>
        tool.tags && tool.tags.some((tag) => options.tags!.includes(tag))
    );
  }

  if (options.requiresPermission !== undefined) {
    result = result.filter(
      (tool) => (tool.requiresPermission ?? false) === options.requiresPermission
    );
  }

  if (options.permissionLevel) {
    result = result.filter((tool) => tool.permissionLevel === options.permissionLevel);
  }

  if (options.search) {
    const searchLower = options.search.toLowerCase();
    result = result.filter(
      (tool) =>
        tool.name.toLowerCase().includes(searchLower) ||
        tool.description.toLowerCase().includes(searchLower)
    );
  }

  return result;
}
