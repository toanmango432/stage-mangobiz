/**
 * Unit tests for type conversion utilities
 *
 * @module sqlite-adapter/utils/__tests__/typeConversions
 */

import { describe, it, expect } from 'vitest';
import {
  toISOString,
  boolToSQLite,
  sqliteToBool,
  safeParseJSON,
  toJSONString,
} from '../typeConversions';

describe('toISOString', () => {
  describe('with Date objects', () => {
    it('converts valid Date to ISO string', () => {
      const date = new Date('2024-01-15T12:30:45.123Z');
      expect(toISOString(date)).toBe('2024-01-15T12:30:45.123Z');
    });

    it('handles Date at epoch', () => {
      const date = new Date(0);
      expect(toISOString(date)).toBe('1970-01-01T00:00:00.000Z');
    });

    it('returns null for invalid Date', () => {
      const invalidDate = new Date('invalid');
      expect(toISOString(invalidDate)).toBe(null);
    });

    it('handles Date with local timezone correctly', () => {
      // Create a date that will have consistent ISO output
      const date = new Date(Date.UTC(2024, 5, 15, 10, 30, 0));
      expect(toISOString(date)).toBe('2024-06-15T10:30:00.000Z');
    });
  });

  describe('with string values', () => {
    it('converts valid ISO string', () => {
      const result = toISOString('2024-01-15T12:00:00Z');
      expect(result).toBe('2024-01-15T12:00:00.000Z');
    });

    it('converts date-only string', () => {
      const result = toISOString('2024-01-15');
      // Date-only strings are interpreted as UTC midnight
      expect(result).toBe('2024-01-15T00:00:00.000Z');
    });

    it('returns null for invalid date string', () => {
      expect(toISOString('not a date')).toBe(null);
      expect(toISOString('2024-99-99')).toBe(null);
    });

    it('returns null for empty string', () => {
      expect(toISOString('')).toBe(null);
    });

    it('returns null for whitespace-only string', () => {
      expect(toISOString('   ')).toBe(null);
      expect(toISOString('\t\n')).toBe(null);
    });
  });

  describe('with numeric timestamps', () => {
    it('converts valid timestamp', () => {
      // 1705323600000 = 2024-01-15T13:00:00.000Z
      const timestamp = 1705323600000;
      expect(toISOString(timestamp)).toBe('2024-01-15T13:00:00.000Z');
    });

    it('converts zero timestamp (epoch)', () => {
      expect(toISOString(0)).toBe('1970-01-01T00:00:00.000Z');
    });

    it('returns null for NaN', () => {
      expect(toISOString(NaN)).toBe(null);
    });

    it('returns null for Infinity', () => {
      expect(toISOString(Infinity)).toBe(null);
      expect(toISOString(-Infinity)).toBe(null);
    });
  });

  describe('with null/undefined', () => {
    it('returns null for null input', () => {
      expect(toISOString(null)).toBe(null);
    });

    it('returns null for undefined input', () => {
      expect(toISOString(undefined)).toBe(null);
    });
  });

  describe('with other types', () => {
    it('returns null for objects', () => {
      expect(toISOString({})).toBe(null);
      expect(toISOString({ date: '2024-01-15' })).toBe(null);
    });

    it('returns null for arrays', () => {
      expect(toISOString([])).toBe(null);
      expect(toISOString([2024, 1, 15])).toBe(null);
    });

    it('returns null for booleans', () => {
      expect(toISOString(true)).toBe(null);
      expect(toISOString(false)).toBe(null);
    });
  });
});

describe('boolToSQLite', () => {
  describe('with boolean values', () => {
    it('converts true to 1', () => {
      expect(boolToSQLite(true)).toBe(1);
    });

    it('converts false to 0', () => {
      expect(boolToSQLite(false)).toBe(0);
    });
  });

  describe('with numeric values', () => {
    it('converts 0 to 0', () => {
      expect(boolToSQLite(0)).toBe(0);
    });

    it('converts 1 to 1', () => {
      expect(boolToSQLite(1)).toBe(1);
    });

    it('converts positive numbers to 1', () => {
      expect(boolToSQLite(42)).toBe(1);
      expect(boolToSQLite(0.5)).toBe(1);
    });

    it('converts negative numbers to 1', () => {
      expect(boolToSQLite(-1)).toBe(1);
      expect(boolToSQLite(-100)).toBe(1);
    });
  });

  describe('with string values', () => {
    it('converts "true" to 1', () => {
      expect(boolToSQLite('true')).toBe(1);
      expect(boolToSQLite('TRUE')).toBe(1);
      expect(boolToSQLite('True')).toBe(1);
    });

    it('converts "false" to 0', () => {
      expect(boolToSQLite('false')).toBe(0);
      expect(boolToSQLite('FALSE')).toBe(0);
      expect(boolToSQLite('False')).toBe(0);
    });

    it('converts "0" to 0', () => {
      expect(boolToSQLite('0')).toBe(0);
    });

    it('converts "1" and other non-empty strings to 1', () => {
      expect(boolToSQLite('1')).toBe(1);
      expect(boolToSQLite('yes')).toBe(1);
      expect(boolToSQLite('anything')).toBe(1);
    });

    it('converts empty string to 0', () => {
      expect(boolToSQLite('')).toBe(0);
    });

    it('converts "no" to 0', () => {
      expect(boolToSQLite('no')).toBe(0);
      expect(boolToSQLite('NO')).toBe(0);
    });

    it('converts "null" string to 0', () => {
      expect(boolToSQLite('null')).toBe(0);
      expect(boolToSQLite('NULL')).toBe(0);
    });

    it('handles whitespace in string values', () => {
      expect(boolToSQLite('  true  ')).toBe(1);
      expect(boolToSQLite('  false  ')).toBe(0);
      expect(boolToSQLite('   ')).toBe(0);
    });
  });

  describe('with null/undefined', () => {
    it('returns null for null input', () => {
      expect(boolToSQLite(null)).toBe(null);
    });

    it('returns null for undefined input', () => {
      expect(boolToSQLite(undefined)).toBe(null);
    });
  });

  describe('with other types', () => {
    it('converts truthy objects to 1', () => {
      expect(boolToSQLite({})).toBe(1);
      expect(boolToSQLite({ value: false })).toBe(1);
    });

    it('converts truthy arrays to 1', () => {
      expect(boolToSQLite([])).toBe(1);
      expect(boolToSQLite([false])).toBe(1);
    });
  });
});

describe('sqliteToBool', () => {
  it('converts 1 to true', () => {
    expect(sqliteToBool(1)).toBe(true);
  });

  it('converts 0 to false', () => {
    expect(sqliteToBool(0)).toBe(false);
  });

  it('returns undefined for null', () => {
    expect(sqliteToBool(null)).toBe(undefined);
  });

  it('returns undefined for undefined', () => {
    expect(sqliteToBool(undefined)).toBe(undefined);
  });

  it('treats other numbers as truthy based on value', () => {
    // Any non-1 value is considered false by strict comparison
    expect(sqliteToBool(2)).toBe(false);
    expect(sqliteToBool(-1)).toBe(false);
  });
});

describe('safeParseJSON', () => {
  describe('with valid JSON', () => {
    it('parses object JSON', () => {
      const result = safeParseJSON('{"name":"John","age":30}', {});
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('parses array JSON', () => {
      const result = safeParseJSON('[1,2,3]', []);
      expect(result).toEqual([1, 2, 3]);
    });

    it('parses nested JSON', () => {
      const json = '{"user":{"name":"John","tags":["admin","user"]}}';
      const result = safeParseJSON(json, {});
      expect(result).toEqual({ user: { name: 'John', tags: ['admin', 'user'] } });
    });

    it('parses primitive JSON values', () => {
      expect(safeParseJSON('"hello"', '')).toBe('hello');
      expect(safeParseJSON('42', 0)).toBe(42);
      expect(safeParseJSON('true', false)).toBe(true);
      expect(safeParseJSON('null', 'default')).toBe(null);
    });
  });

  describe('with invalid JSON', () => {
    it('returns fallback for invalid JSON syntax', () => {
      expect(safeParseJSON('{invalid}', { default: true })).toEqual({ default: true });
      expect(safeParseJSON('not json', [])).toEqual([]);
    });

    it('returns fallback for incomplete JSON', () => {
      expect(safeParseJSON('{"name":', {})).toEqual({});
      expect(safeParseJSON('[1,2,', [])).toEqual([]);
    });

    it('returns fallback for single quotes (invalid JSON)', () => {
      expect(safeParseJSON("{'name':'John'}", {})).toEqual({});
    });
  });

  describe('with null/undefined/empty', () => {
    it('returns fallback for null', () => {
      expect(safeParseJSON(null, { fallback: true })).toEqual({ fallback: true });
    });

    it('returns fallback for undefined', () => {
      expect(safeParseJSON(undefined, [])).toEqual([]);
    });

    it('returns fallback for empty string', () => {
      expect(safeParseJSON('', 'default')).toBe('default');
    });

    it('returns fallback for whitespace-only string', () => {
      expect(safeParseJSON('   ', {})).toEqual({});
      expect(safeParseJSON('\n\t', [])).toEqual([]);
    });
  });

  describe('type safety', () => {
    it('maintains type inference from fallback', () => {
      interface User {
        name: string;
        age: number;
      }
      const defaultUser: User = { name: '', age: 0 };
      const result: User = safeParseJSON('{"name":"John","age":30}', defaultUser);
      expect(result.name).toBe('John');
      expect(result.age).toBe(30);
    });
  });
});

describe('toJSONString', () => {
  describe('with valid values', () => {
    it('stringifies objects', () => {
      expect(toJSONString({ name: 'John' })).toBe('{"name":"John"}');
    });

    it('stringifies arrays', () => {
      expect(toJSONString([1, 2, 3])).toBe('[1,2,3]');
    });

    it('stringifies nested structures', () => {
      const value = { user: { tags: ['a', 'b'] } };
      expect(toJSONString(value)).toBe('{"user":{"tags":["a","b"]}}');
    });

    it('stringifies primitive values', () => {
      expect(toJSONString('hello')).toBe('"hello"');
      expect(toJSONString(42)).toBe('42');
      expect(toJSONString(true)).toBe('true');
    });
  });

  describe('with null/undefined', () => {
    it('returns null for null input', () => {
      expect(toJSONString(null)).toBe(null);
    });

    it('returns null for undefined input', () => {
      expect(toJSONString(undefined)).toBe(null);
    });
  });

  describe('with circular references', () => {
    it('returns null for circular objects', () => {
      const circular: Record<string, unknown> = { a: 1 };
      circular.self = circular;
      expect(toJSONString(circular)).toBe(null);
    });
  });

  describe('roundtrip with safeParseJSON', () => {
    it('roundtrips objects correctly', () => {
      const original = { name: 'John', tags: ['admin', 'user'], active: true };
      const stringified = toJSONString(original);
      const parsed = safeParseJSON(stringified, {});
      expect(parsed).toEqual(original);
    });

    it('roundtrips arrays correctly', () => {
      const original = [1, 'two', { three: 3 }];
      const stringified = toJSONString(original);
      const parsed = safeParseJSON(stringified, []);
      expect(parsed).toEqual(original);
    });
  });
});
