/**
 * @mango/ai-tools - Schema Converter Utilities
 *
 * Utilities for converting Zod schemas to JSON Schema format
 * compatible with OpenAI function calling and Anthropic tool use.
 */

import { zodToJsonSchema as zodToJsonSchemaLib } from 'zod-to-json-schema';
import type { z } from 'zod';
import type {
  AITool,
  OpenAIFunctionDefinition,
  AnthropicToolDefinition,
  UnifiedToolDefinition,
} from '../types';

// ============================================================================
// Core Schema Conversion
// ============================================================================

/**
 * Convert a Zod schema to JSON Schema format.
 *
 * Uses the zod-to-json-schema library with optimal settings for AI function calling.
 *
 * @param schema - Zod schema to convert
 * @param name - Optional name for the schema (used for references)
 * @returns JSON Schema object
 *
 * @example
 * const schema = z.object({ name: z.string() });
 * const jsonSchema = zodToJsonSchema(schema, 'SearchParams');
 */
export function zodToJsonSchema(
  schema: z.ZodTypeAny,
  name?: string
): Record<string, unknown> {
  const result = zodToJsonSchemaLib(schema, {
    name,
    target: 'openAi',
    $refStrategy: 'none',
    errorMessages: false,
  });

  // If a name was provided, the schema is wrapped in definitions
  // Extract just the schema for cleaner output
  if (name && result && typeof result === 'object') {
    const typedResult = result as Record<string, unknown>;
    if ('definitions' in typedResult && typedResult.definitions) {
      const definitions = typedResult.definitions as Record<string, unknown>;
      if (name in definitions) {
        return definitions[name] as Record<string, unknown>;
      }
    }
    // For openAi target, the result might be direct
    const { $schema, ...rest } = typedResult;
    return rest;
  }

  // Remove $schema from output for cleaner API definitions
  if (result && typeof result === 'object') {
    const { $schema, ...rest } = result as Record<string, unknown>;
    return rest;
  }

  return result as Record<string, unknown>;
}

// ============================================================================
// Tool Definition Generators
// ============================================================================

/**
 * Generate an OpenAI function definition from an AITool.
 *
 * @param tool - The AI tool to convert
 * @returns OpenAI-compatible function definition
 *
 * @example
 * const openAIDef = generateOpenAIDefinition(searchClientsTool);
 * // Use with OpenAI API: { functions: [openAIDef] }
 */
export function generateOpenAIDefinition(
  tool: AITool
): OpenAIFunctionDefinition {
  return {
    name: tool.name,
    description: tool.description,
    parameters: zodToJsonSchema(tool.parameters, tool.name),
  };
}

/**
 * Generate an Anthropic tool definition from an AITool.
 *
 * @param tool - The AI tool to convert
 * @returns Anthropic-compatible tool definition
 *
 * @example
 * const anthropicDef = generateAnthropicDefinition(searchClientsTool);
 * // Use with Anthropic API: { tools: [anthropicDef] }
 */
export function generateAnthropicDefinition(
  tool: AITool
): AnthropicToolDefinition {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: zodToJsonSchema(tool.parameters, tool.name),
  };
}

/**
 * Generate a unified tool definition that includes metadata.
 *
 * This format is useful for internal tool registries and documentation.
 *
 * @param tool - The AI tool to convert
 * @param includeReturns - Whether to include return schema (default: true)
 * @returns Unified tool definition with all metadata
 */
export function generateToolDefinition(
  tool: AITool,
  includeReturns = true
): UnifiedToolDefinition {
  const definition: UnifiedToolDefinition = {
    name: tool.name,
    description: tool.description,
    category: tool.category,
    parameters: zodToJsonSchema(tool.parameters, `${tool.name}Params`),
  };

  if (includeReturns && tool.returns) {
    definition.returns = zodToJsonSchema(tool.returns, `${tool.name}Returns`);
  }

  return definition;
}

// ============================================================================
// Batch Conversion Utilities
// ============================================================================

/**
 * Convert multiple AITools to OpenAI function definitions.
 *
 * @param tools - Array of AI tools
 * @returns Array of OpenAI function definitions
 */
export function generateOpenAIDefinitions(
  tools: AITool[]
): OpenAIFunctionDefinition[] {
  return tools.map(generateOpenAIDefinition);
}

/**
 * Convert multiple AITools to Anthropic tool definitions.
 *
 * @param tools - Array of AI tools
 * @returns Array of Anthropic tool definitions
 */
export function generateAnthropicDefinitions(
  tools: AITool[]
): AnthropicToolDefinition[] {
  return tools.map(generateAnthropicDefinition);
}

/**
 * Convert multiple AITools to unified tool definitions.
 *
 * @param tools - Array of AI tools
 * @param includeReturns - Whether to include return schemas
 * @returns Array of unified tool definitions
 */
export function generateToolDefinitions(
  tools: AITool[],
  includeReturns = true
): UnifiedToolDefinition[] {
  return tools.map((tool) => generateToolDefinition(tool, includeReturns));
}

// ============================================================================
// Schema Inspection Utilities
// ============================================================================

/**
 * Extract parameter names from a tool's schema.
 *
 * Useful for validation error messages and documentation.
 *
 * @param tool - The AI tool
 * @returns Array of parameter names
 */
export function getToolParameterNames(tool: AITool): string[] {
  const schema = zodToJsonSchema(tool.parameters);
  if (
    schema &&
    typeof schema === 'object' &&
    'properties' in schema &&
    schema.properties
  ) {
    return Object.keys(schema.properties as Record<string, unknown>);
  }
  return [];
}

/**
 * Check if a tool has required parameters.
 *
 * @param tool - The AI tool
 * @returns True if the tool has required parameters
 */
export function hasRequiredParameters(tool: AITool): boolean {
  const schema = zodToJsonSchema(tool.parameters);
  if (
    schema &&
    typeof schema === 'object' &&
    'required' in schema &&
    Array.isArray(schema.required)
  ) {
    return schema.required.length > 0;
  }
  return false;
}

/**
 * Get the list of required parameter names.
 *
 * @param tool - The AI tool
 * @returns Array of required parameter names
 */
export function getRequiredParameters(tool: AITool): string[] {
  const schema = zodToJsonSchema(tool.parameters);
  if (
    schema &&
    typeof schema === 'object' &&
    'required' in schema &&
    Array.isArray(schema.required)
  ) {
    return schema.required;
  }
  return [];
}
