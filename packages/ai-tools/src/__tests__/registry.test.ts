/**
 * Unit Tests for AI Tool Registry
 *
 * Tests the registry functions for tool lookup, filtering, validation, and definition generation.
 */

import { describe, it, expect } from 'vitest';
import {
  toolRegistry,
  getToolByName,
  getToolsByCategory,
  getAllTools,
  getToolNames,
  getCategories,
  hasTools,
  getAllToolDefinitions,
  getAllOpenAIDefinitions,
  getAllAnthropicDefinitions,
  getToolDefinitionsForCategories,
  validateToolInput,
  validateToolInputOrThrow,
  getRegistryStats,
  filterTools,
} from '../registry';
import type { AIToolCategory } from '../types';

// ============================================================================
// Test Data
// ============================================================================

/** Valid UUID for testing */
const validUuid = '550e8400-e29b-41d4-a716-446655440000';

/** All expected categories */
const allCategories: AIToolCategory[] = [
  'clients',
  'appointments',
  'services',
  'tickets',
  'staff',
  'analytics',
  'system',
];

// ============================================================================
// REGISTRY OBJECT TESTS
// ============================================================================

describe('toolRegistry', () => {
  it('should be a non-empty object', () => {
    expect(typeof toolRegistry).toBe('object');
    expect(Object.keys(toolRegistry).length).toBeGreaterThan(0);
  });

  it('should contain searchClients tool', () => {
    expect(toolRegistry['searchClients']).toBeDefined();
    expect(toolRegistry['searchClients'].name).toBe('searchClients');
    expect(toolRegistry['searchClients'].category).toBe('clients');
  });

  it('should contain bookAppointment tool', () => {
    expect(toolRegistry['bookAppointment']).toBeDefined();
    expect(toolRegistry['bookAppointment'].name).toBe('bookAppointment');
    expect(toolRegistry['bookAppointment'].category).toBe('appointments');
  });

  it('should have tools with required properties', () => {
    Object.values(toolRegistry).forEach((tool) => {
      expect(tool.name).toBeDefined();
      expect(typeof tool.name).toBe('string');
      expect(tool.description).toBeDefined();
      expect(typeof tool.description).toBe('string');
      expect(tool.category).toBeDefined();
      expect(allCategories).toContain(tool.category);
      expect(tool.parameters).toBeDefined();
    });
  });
});

// ============================================================================
// getToolByName TESTS
// ============================================================================

describe('getToolByName', () => {
  it('should return tool for valid name', () => {
    const tool = getToolByName('searchClients');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('searchClients');
  });

  it('should return undefined for unknown name', () => {
    const tool = getToolByName('nonExistentTool');
    expect(tool).toBeUndefined();
  });

  it('should be case-sensitive', () => {
    const tool = getToolByName('SearchClients'); // Wrong case
    expect(tool).toBeUndefined();
  });

  it('should return tools from each category', () => {
    const toolNames = [
      'searchClients', // clients
      'bookAppointment', // appointments
      'searchServices', // services
      'createTicket', // tickets
      'searchStaff', // staff
      'getDashboardMetrics', // analytics
      'getStoreInfo', // system
    ];

    toolNames.forEach((name) => {
      const tool = getToolByName(name);
      expect(tool).toBeDefined();
      expect(tool?.name).toBe(name);
    });
  });
});

// ============================================================================
// getToolsByCategory TESTS
// ============================================================================

describe('getToolsByCategory', () => {
  it('should return array of tools for valid category', () => {
    const tools = getToolsByCategory('clients');
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);
  });

  it('should return empty array for invalid category', () => {
    // @ts-expect-error - Testing invalid category
    const tools = getToolsByCategory('invalid_category');
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBe(0);
  });

  it('should return tools only in the specified category', () => {
    const clientTools = getToolsByCategory('clients');
    clientTools.forEach((tool) => {
      expect(tool.category).toBe('clients');
    });
  });

  it('should return tools for all categories', () => {
    allCategories.forEach((category) => {
      const tools = getToolsByCategory(category);
      expect(tools.length).toBeGreaterThan(0);
    });
  });

  it('should return correct number of client tools', () => {
    const clientTools = getToolsByCategory('clients');
    // We have 6 client tools: searchClients, getClient, getClientHistory, createClient, updateClient, addClientNote
    expect(clientTools.length).toBe(6);
  });

  it('should return correct number of appointment tools', () => {
    const appointmentTools = getToolsByCategory('appointments');
    // We have 6 appointment tools
    expect(appointmentTools.length).toBe(6);
  });
});

// ============================================================================
// getAllTools TESTS
// ============================================================================

describe('getAllTools', () => {
  it('should return array of all tools', () => {
    const tools = getAllTools();
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);
  });

  it('should return a new array (not the internal array)', () => {
    const tools1 = getAllTools();
    const tools2 = getAllTools();
    expect(tools1).not.toBe(tools2);
    expect(tools1).toEqual(tools2);
  });

  it('should contain tools from all categories', () => {
    const tools = getAllTools();
    const categoriesInTools = new Set(tools.map((t) => t.category));
    allCategories.forEach((category) => {
      expect(categoriesInTools.has(category)).toBe(true);
    });
  });
});

// ============================================================================
// getToolNames TESTS
// ============================================================================

describe('getToolNames', () => {
  it('should return array of tool names', () => {
    const names = getToolNames();
    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBeGreaterThan(0);
    names.forEach((name) => {
      expect(typeof name).toBe('string');
    });
  });

  it('should include known tool names', () => {
    const names = getToolNames();
    expect(names).toContain('searchClients');
    expect(names).toContain('bookAppointment');
    expect(names).toContain('createTicket');
  });

  it('should match the number of tools in registry', () => {
    const names = getToolNames();
    const tools = getAllTools();
    expect(names.length).toBe(tools.length);
  });
});

// ============================================================================
// getCategories TESTS
// ============================================================================

describe('getCategories', () => {
  it('should return all categories', () => {
    const categories = getCategories();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBe(allCategories.length);
  });

  it('should contain all expected categories', () => {
    const categories = getCategories();
    allCategories.forEach((category) => {
      expect(categories).toContain(category);
    });
  });
});

// ============================================================================
// hasTools TESTS
// ============================================================================

describe('hasTools', () => {
  it('should return true for existing tool', () => {
    expect(hasTools('searchClients')).toBe(true);
  });

  it('should return false for non-existent tool', () => {
    expect(hasTools('nonExistentTool')).toBe(false);
  });

  it('should be case-sensitive', () => {
    expect(hasTools('SearchClients')).toBe(false);
  });
});

// ============================================================================
// getAllToolDefinitions TESTS
// ============================================================================

describe('getAllToolDefinitions', () => {
  it('should return unified definitions by default', () => {
    const definitions = getAllToolDefinitions();
    expect(Array.isArray(definitions)).toBe(true);
    expect(definitions.length).toBeGreaterThan(0);

    // Unified format should have all properties
    const firstDef = definitions[0];
    expect(firstDef).toHaveProperty('name');
    expect(firstDef).toHaveProperty('description');
    expect(firstDef).toHaveProperty('parameters');
    expect(firstDef).toHaveProperty('category');
  });

  it('should return unified format when specified', () => {
    const definitions = getAllToolDefinitions('unified');
    expect(Array.isArray(definitions)).toBe(true);
    expect(definitions[0]).toHaveProperty('category');
  });

  it('should return OpenAI format when specified', () => {
    const definitions = getAllToolDefinitions('openai');
    expect(Array.isArray(definitions)).toBe(true);

    // OpenAI format has specific structure
    const firstDef = definitions[0];
    expect(firstDef).toHaveProperty('name');
    expect(firstDef).toHaveProperty('description');
    expect(firstDef).toHaveProperty('parameters');
    expect(firstDef.parameters).toHaveProperty('type');
    expect(firstDef.parameters.type).toBe('object');
  });

  it('should return Anthropic format when specified', () => {
    const definitions = getAllToolDefinitions('anthropic');
    expect(Array.isArray(definitions)).toBe(true);

    // Anthropic format has input_schema
    const firstDef = definitions[0];
    expect(firstDef).toHaveProperty('name');
    expect(firstDef).toHaveProperty('description');
    expect(firstDef).toHaveProperty('input_schema');
  });
});

// ============================================================================
// getAllOpenAIDefinitions TESTS
// ============================================================================

describe('getAllOpenAIDefinitions', () => {
  it('should return OpenAI-compatible definitions', () => {
    const definitions = getAllOpenAIDefinitions();
    expect(Array.isArray(definitions)).toBe(true);

    definitions.forEach((def) => {
      expect(def).toHaveProperty('name');
      expect(def).toHaveProperty('description');
      expect(def).toHaveProperty('parameters');
      expect(def.parameters).toHaveProperty('type', 'object');
    });
  });
});

// ============================================================================
// getAllAnthropicDefinitions TESTS
// ============================================================================

describe('getAllAnthropicDefinitions', () => {
  it('should return Anthropic-compatible definitions', () => {
    const definitions = getAllAnthropicDefinitions();
    expect(Array.isArray(definitions)).toBe(true);

    definitions.forEach((def) => {
      expect(def).toHaveProperty('name');
      expect(def).toHaveProperty('description');
      expect(def).toHaveProperty('input_schema');
    });
  });
});

// ============================================================================
// getToolDefinitionsForCategories TESTS
// ============================================================================

describe('getToolDefinitionsForCategories', () => {
  it('should filter to specified categories', () => {
    const definitions = getToolDefinitionsForCategories(['clients', 'appointments']);
    expect(Array.isArray(definitions)).toBe(true);

    // All definitions should be from clients or appointments
    definitions.forEach((def) => {
      // For unified format, check category
      if ('category' in def) {
        expect(['clients', 'appointments']).toContain(def.category);
      }
    });
  });

  it('should return empty array for empty categories', () => {
    const definitions = getToolDefinitionsForCategories([]);
    expect(definitions.length).toBe(0);
  });

  it('should respect format parameter', () => {
    const openaiDefs = getToolDefinitionsForCategories(['clients'], 'openai');
    const anthropicDefs = getToolDefinitionsForCategories(['clients'], 'anthropic');

    // OpenAI has 'parameters', Anthropic has 'input_schema'
    if (openaiDefs.length > 0) {
      expect(openaiDefs[0]).toHaveProperty('parameters');
    }
    if (anthropicDefs.length > 0) {
      expect(anthropicDefs[0]).toHaveProperty('input_schema');
    }
  });
});

// ============================================================================
// validateToolInput TESTS
// ============================================================================

describe('validateToolInput', () => {
  it('should return success for valid input', () => {
    const result = validateToolInput('searchClients', {
      query: 'John',
      limit: 10,
    });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should return error for invalid input', () => {
    const result = validateToolInput('searchClients', {
      query: '', // Empty query is invalid
    });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.message).toBeDefined();
  });

  it('should return error for unknown tool', () => {
    const result = validateToolInput('nonExistentTool', { foo: 'bar' });
    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('should validate complex input with nested objects', () => {
    const result = validateToolInput('createClient', {
      firstName: 'John',
      lastName: 'Doe',
      phone: '5551234567',
      address: {
        street: '123 Main St',
        city: 'Anytown',
      },
    });
    expect(result.success).toBe(true);
  });

  it('should apply default values', () => {
    const result = validateToolInput('searchClients', {
      query: 'test',
    });
    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect((result.data as { limit: number }).limit).toBe(10);
    }
  });

  it('should validate UUID format', () => {
    const validResult = validateToolInput('getClient', {
      clientId: validUuid,
    });
    expect(validResult.success).toBe(true);

    const invalidResult = validateToolInput('getClient', {
      clientId: 'not-a-uuid',
    });
    expect(invalidResult.success).toBe(false);
  });
});

// ============================================================================
// validateToolInputOrThrow TESTS
// ============================================================================

describe('validateToolInputOrThrow', () => {
  it('should return validated data for valid input', () => {
    const data = validateToolInputOrThrow('searchClients', {
      query: 'John',
      limit: 10,
    });
    expect(data).toBeDefined();
    expect((data as { query: string }).query).toBe('John');
  });

  it('should throw for invalid input', () => {
    expect(() => {
      validateToolInputOrThrow('searchClients', {
        query: '', // Invalid
      });
    }).toThrow();
  });

  it('should throw for unknown tool', () => {
    expect(() => {
      validateToolInputOrThrow('nonExistentTool', {});
    }).toThrow('not found');
  });

  it('should include tool name in error message', () => {
    try {
      validateToolInputOrThrow('searchClients', { query: '' });
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect((error as Error).message).toContain('searchClients');
    }
  });
});

// ============================================================================
// getRegistryStats TESTS
// ============================================================================

describe('getRegistryStats', () => {
  it('should return valid statistics', () => {
    const stats = getRegistryStats();
    expect(stats).toBeDefined();
    expect(stats.totalTools).toBeGreaterThan(0);
    expect(typeof stats.byCategory).toBe('object');
    expect(typeof stats.requiresPermission).toBe('number');
    expect(typeof stats.byPermissionLevel).toBe('object');
  });

  it('should have category counts matching tool counts', () => {
    const stats = getRegistryStats();
    let totalFromCategories = 0;
    Object.values(stats.byCategory).forEach((count) => {
      totalFromCategories += count;
    });
    expect(totalFromCategories).toBe(stats.totalTools);
  });

  it('should have correct category breakdown', () => {
    const stats = getRegistryStats();
    expect(stats.byCategory.clients).toBe(6);
    expect(stats.byCategory.appointments).toBe(6);
    expect(stats.byCategory.services).toBe(5);
    expect(stats.byCategory.tickets).toBe(8);
    expect(stats.byCategory.staff).toBe(6);
    expect(stats.byCategory.analytics).toBe(5);
    expect(stats.byCategory.system).toBe(6);
  });

  it('should count tools requiring permissions', () => {
    const stats = getRegistryStats();
    // Some tools should require permissions
    expect(stats.requiresPermission).toBeGreaterThan(0);
    expect(stats.byPermissionLevel.manager).toBeGreaterThan(0);
  });
});

// ============================================================================
// filterTools TESTS
// ============================================================================

describe('filterTools', () => {
  it('should filter by categories', () => {
    const tools = filterTools({ categories: ['clients'] });
    expect(tools.length).toBeGreaterThan(0);
    tools.forEach((tool) => {
      expect(tool.category).toBe('clients');
    });
  });

  it('should filter by multiple categories', () => {
    const tools = filterTools({ categories: ['clients', 'appointments'] });
    tools.forEach((tool) => {
      expect(['clients', 'appointments']).toContain(tool.category);
    });
  });

  it('should filter by tags', () => {
    const readTools = filterTools({ tags: ['read'] });
    expect(readTools.length).toBeGreaterThan(0);
    readTools.forEach((tool) => {
      expect(tool.tags).toContain('read');
    });
  });

  it('should filter by permission requirement', () => {
    const permissionTools = filterTools({ requiresPermission: true });
    permissionTools.forEach((tool) => {
      expect(tool.requiresPermission).toBe(true);
    });
  });

  it('should filter by permission level', () => {
    const managerTools = filterTools({ permissionLevel: 'manager' });
    managerTools.forEach((tool) => {
      expect(tool.permissionLevel).toBe('manager');
    });
  });

  it('should filter by search term in name', () => {
    const tools = filterTools({ search: 'client' });
    expect(tools.length).toBeGreaterThan(0);
    tools.forEach((tool) => {
      const matchesName = tool.name.toLowerCase().includes('client');
      const matchesDesc = tool.description.toLowerCase().includes('client');
      expect(matchesName || matchesDesc).toBe(true);
    });
  });

  it('should combine multiple filters', () => {
    const tools = filterTools({
      categories: ['clients'],
      tags: ['read'],
    });
    tools.forEach((tool) => {
      expect(tool.category).toBe('clients');
      expect(tool.tags).toContain('read');
    });
  });

  it('should return all tools with empty filter', () => {
    const allFilteredTools = filterTools({});
    const allTools = getAllTools();
    expect(allFilteredTools.length).toBe(allTools.length);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Registry Integration', () => {
  it('should have consistent data across functions', () => {
    const allTools = getAllTools();
    const allNames = getToolNames();
    const stats = getRegistryStats();

    expect(allTools.length).toBe(allNames.length);
    expect(allTools.length).toBe(stats.totalTools);
  });

  it('should have all tools in registry object accessible by name', () => {
    getAllTools().forEach((tool) => {
      expect(toolRegistry[tool.name]).toBeDefined();
      expect(toolRegistry[tool.name]).toBe(tool);
    });
  });

  it('should have consistent category counts', () => {
    const stats = getRegistryStats();
    const categories = getCategories();

    categories.forEach((category) => {
      const toolsInCategory = getToolsByCategory(category);
      expect(toolsInCategory.length).toBe(stats.byCategory[category]);
    });
  });

  it('should validate all tools in registry have valid definitions', () => {
    const openaiDefs = getAllOpenAIDefinitions();
    const anthropicDefs = getAllAnthropicDefinitions();
    const allTools = getAllTools();

    expect(openaiDefs.length).toBe(allTools.length);
    expect(anthropicDefs.length).toBe(allTools.length);
  });
});
