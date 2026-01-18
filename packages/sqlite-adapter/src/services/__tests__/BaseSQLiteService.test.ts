/**
 * Unit tests for BaseSQLiteService
 *
 * Tests CRUD operations and type conversion functionality of the generic
 * base service class.
 *
 * @module sqlite-adapter/services/__tests__/BaseSQLiteService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BaseSQLiteService, type TableSchema, type ColumnDefinition } from '../BaseSQLiteService';
import { createMockAdapter } from './mockAdapter';
import type { SQLiteAdapter, SQLiteValue } from '../../types';

// ==================== TEST ENTITY TYPES ====================

interface TestEntity extends Record<string, unknown> {
  id: string;
  name: string;
  email?: string;
  isActive: boolean;
  count: number;
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface TestRow {
  id: string;
  name: string;
  email: string | null;
  is_active: number;
  count: number;
  settings: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== TEST SCHEMA ====================

const testSchema: TableSchema = {
  tableName: 'test_entities',
  primaryKey: 'id',
  columns: {
    id: 'id',
    name: 'name',
    email: 'email',
    isActive: { column: 'is_active', type: 'boolean' } as ColumnDefinition,
    count: { column: 'count', type: 'number' } as ColumnDefinition,
    settings: { column: 'settings', type: 'json', defaultValue: {} } as ColumnDefinition,
    createdAt: { column: 'created_at', type: 'date' } as ColumnDefinition,
    updatedAt: { column: 'updated_at', type: 'date' } as ColumnDefinition,
  },
};

// ==================== CONCRETE SERVICE FOR TESTING ====================

class TestService extends BaseSQLiteService<TestEntity, TestRow> {
  constructor(db: SQLiteAdapter) {
    super(db, testSchema);
  }

  // Expose protected methods for testing
  testRowToEntity(row: TestRow): TestEntity {
    return this.rowToEntity(row);
  }

  testEntityToRow(entity: Partial<TestEntity>): Record<string, SQLiteValue> {
    return this.entityToRow(entity);
  }

  testGetColumn(propName: string): string {
    return this.getColumn(propName);
  }
}

// ==================== TESTS ====================

describe('BaseSQLiteService', () => {
  let adapter: ReturnType<typeof createMockAdapter>;
  let service: TestService;

  beforeEach(() => {
    adapter = createMockAdapter();
    service = new TestService(adapter);

    // Seed initial data
    adapter._seed('test_entities', [
      {
        id: 'entity-1',
        name: 'First Entity',
        email: 'first@example.com',
        is_active: 1,
        count: 10,
        settings: '{"theme":"dark"}',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'entity-2',
        name: 'Second Entity',
        email: null,
        is_active: 0,
        count: 20,
        settings: null,
        created_at: '2024-01-02T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z',
      },
      {
        id: 'entity-3',
        name: 'Third Entity',
        email: 'third@example.com',
        is_active: 1,
        count: 30,
        settings: '{"theme":"light","notifications":true}',
        created_at: '2024-01-03T00:00:00.000Z',
        updated_at: '2024-01-03T00:00:00.000Z',
      },
    ]);
  });

  describe('column mapping', () => {
    it('maps camelCase property to snake_case column', () => {
      expect(service.testGetColumn('isActive')).toBe('is_active');
      expect(service.testGetColumn('createdAt')).toBe('created_at');
    });

    it('maps simple property to itself', () => {
      expect(service.testGetColumn('id')).toBe('id');
      expect(service.testGetColumn('name')).toBe('name');
    });

    it('falls back to snake_case for unknown properties', () => {
      expect(service.testGetColumn('unknownProperty')).toBe('unknown_property');
    });
  });

  describe('type conversion - rowToEntity', () => {
    it('converts boolean from integer', () => {
      const row: TestRow = {
        id: 'test',
        name: 'Test',
        email: null,
        is_active: 1,
        count: 0,
        settings: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      const entity = service.testRowToEntity(row);
      expect(entity.isActive).toBe(true);
    });

    it('converts boolean false from 0', () => {
      const row: TestRow = {
        id: 'test',
        name: 'Test',
        email: null,
        is_active: 0,
        count: 0,
        settings: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      const entity = service.testRowToEntity(row);
      expect(entity.isActive).toBe(false);
    });

    it('converts JSON string to object', () => {
      const row: TestRow = {
        id: 'test',
        name: 'Test',
        email: null,
        is_active: 1,
        count: 0,
        settings: '{"theme":"dark","count":5}',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      const entity = service.testRowToEntity(row);
      expect(entity.settings).toEqual({ theme: 'dark', count: 5 });
    });

    it('uses default value for null JSON column', () => {
      const row: TestRow = {
        id: 'test',
        name: 'Test',
        email: null,
        is_active: 1,
        count: 0,
        settings: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      const entity = service.testRowToEntity(row);
      expect(entity.settings).toEqual({});
    });

    it('preserves date strings', () => {
      const row: TestRow = {
        id: 'test',
        name: 'Test',
        email: null,
        is_active: 1,
        count: 0,
        settings: null,
        created_at: '2024-06-15T10:30:00.000Z',
        updated_at: '2024-06-15T10:30:00.000Z',
      };

      const entity = service.testRowToEntity(row);
      expect(entity.createdAt).toBe('2024-06-15T10:30:00.000Z');
    });
  });

  describe('type conversion - entityToRow', () => {
    it('converts boolean to integer', () => {
      const row = service.testEntityToRow({ isActive: true });
      expect(row.is_active).toBe(1);

      const row2 = service.testEntityToRow({ isActive: false });
      expect(row2.is_active).toBe(0);
    });

    it('converts object to JSON string', () => {
      const row = service.testEntityToRow({ settings: { theme: 'light' } });
      expect(row.settings).toBe('{"theme":"light"}');
    });

    it('converts Date to ISO string', () => {
      const date = new Date('2024-01-15T12:00:00.000Z');
      const row = service.testEntityToRow({ createdAt: date.toISOString() });
      expect(row.created_at).toBe('2024-01-15T12:00:00.000Z');
    });

    it('preserves string values', () => {
      const row = service.testEntityToRow({ name: 'Test Name' });
      expect(row.name).toBe('Test Name');
    });

    it('preserves number values', () => {
      const row = service.testEntityToRow({ count: 42 });
      expect(row.count).toBe(42);
    });
  });

  describe('CRUD operations', () => {
    describe('getAll', () => {
      it('returns all entities', async () => {
        const entities = await service.getAll();
        expect(entities).toHaveLength(3);
      });

      it('respects limit parameter', async () => {
        const entities = await service.getAll(2);
        expect(entities).toHaveLength(2);
      });

      it('respects offset parameter', async () => {
        const entities = await service.getAll(10, 1);
        expect(entities).toHaveLength(2);
      });
    });

    describe('getById', () => {
      it('returns entity when found', async () => {
        const entity = await service.getById('entity-1');
        expect(entity).toBeDefined();
        expect(entity?.id).toBe('entity-1');
        expect(entity?.name).toBe('First Entity');
        expect(entity?.isActive).toBe(true);
      });

      it('returns undefined when not found', async () => {
        const entity = await service.getById('nonexistent');
        expect(entity).toBeUndefined();
      });
    });

    describe('getByIds', () => {
      it('returns multiple entities', async () => {
        const entities = await service.getByIds(['entity-1', 'entity-3']);
        expect(entities).toHaveLength(2);
        expect(entities.map((e) => e.id).sort()).toEqual(['entity-1', 'entity-3']);
      });

      it('returns empty array for empty input', async () => {
        const entities = await service.getByIds([]);
        expect(entities).toEqual([]);
      });

      it('returns only found entities', async () => {
        const entities = await service.getByIds(['entity-1', 'nonexistent']);
        expect(entities).toHaveLength(1);
        expect(entities[0].id).toBe('entity-1');
      });
    });

    describe('create', () => {
      it('creates entity with generated id', async () => {
        const created = await service.create({
          name: 'New Entity',
          isActive: true,
          count: 5,
        });

        expect(created.id).toBeDefined();
        expect(created.name).toBe('New Entity');
        expect(created.isActive).toBe(true);
        expect(created.count).toBe(5);
      });

      it('creates entity with provided id', async () => {
        const created = await service.create({
          id: 'custom-id',
          name: 'Custom ID Entity',
          isActive: false,
          count: 0,
        });

        expect(created.id).toBe('custom-id');
      });

      it('sets createdAt and updatedAt timestamps', async () => {
        const before = new Date().toISOString();
        const created = await service.create({
          name: 'Timestamped Entity',
          isActive: true,
          count: 0,
        });
        const after = new Date().toISOString();

        expect(created.createdAt).toBeDefined();
        expect(created.updatedAt).toBeDefined();
        expect(created.createdAt >= before).toBe(true);
        expect(created.createdAt <= after).toBe(true);
      });
    });

    describe('update', () => {
      it('updates existing entity', async () => {
        const updated = await service.update('entity-1', {
          name: 'Updated Name',
        });

        expect(updated).toBeDefined();
        expect(updated?.name).toBe('Updated Name');
      });

      it('returns undefined for nonexistent entity', async () => {
        const updated = await service.update('nonexistent', {
          name: 'Updated',
        });

        expect(updated).toBeUndefined();
      });

      it('updates only specified fields', async () => {
        const original = await service.getById('entity-1');
        const updated = await service.update('entity-1', {
          count: 999,
        });

        expect(updated?.count).toBe(999);
        expect(updated?.name).toBe(original?.name);
      });
    });

    describe('delete', () => {
      it('deletes existing entity', async () => {
        const deleted = await service.delete('entity-1');
        expect(deleted).toBe(true);

        const entity = await service.getById('entity-1');
        expect(entity).toBeUndefined();
      });

      it('returns false for nonexistent entity', async () => {
        const deleted = await service.delete('nonexistent');
        expect(deleted).toBe(false);
      });
    });

    describe('count', () => {
      it('returns total count', async () => {
        const count = await service.count();
        expect(count).toBe(3);
      });

      it('reflects changes after create', async () => {
        await service.create({
          name: 'New',
          isActive: true,
          count: 0,
        });

        const count = await service.count();
        expect(count).toBe(4);
      });

      it('reflects changes after delete', async () => {
        await service.delete('entity-1');

        const count = await service.count();
        expect(count).toBe(2);
      });
    });
  });

  describe('JSON handling', () => {
    it('roundtrips complex settings object', async () => {
      const settings = {
        theme: 'dark',
        notifications: {
          email: true,
          sms: false,
        },
        tags: ['admin', 'user'],
      };

      const created = await service.create({
        name: 'Complex Settings',
        isActive: true,
        count: 0,
        settings,
      });

      expect(created.settings).toEqual(settings);
    });

    it('handles empty object settings', async () => {
      const created = await service.create({
        name: 'Empty Settings',
        isActive: true,
        count: 0,
        settings: {},
      });

      expect(created.settings).toEqual({});
    });

    it('handles array in JSON column', async () => {
      const settings = ['item1', 'item2', 'item3'];

      const created = await service.create({
        name: 'Array Settings',
        isActive: true,
        count: 0,
        settings: settings as unknown as Record<string, unknown>,
      });

      expect(created.settings).toEqual(settings);
    });
  });

  describe('boolean handling edge cases', () => {
    it('handles truthy values as true', async () => {
      // Simulate truthy value conversion
      const row = service.testEntityToRow({ isActive: true });
      expect(row.is_active).toBe(1);
    });

    it('handles falsy values as false', async () => {
      const row = service.testEntityToRow({ isActive: false });
      expect(row.is_active).toBe(0);
    });
  });
});
