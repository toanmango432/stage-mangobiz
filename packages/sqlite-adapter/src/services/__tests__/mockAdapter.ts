/**
 * Mock SQLite Adapter for testing services
 *
 * Uses in-memory storage with SQL-like query support for isolated testing
 * without requiring actual SQLite bindings.
 *
 * @module sqlite-adapter/services/__tests__/mockAdapter
 */

import type { SQLiteAdapter, SQLiteValue } from '../../types';

/**
 * Mock table row type
 */
type MockRow = Record<string, SQLiteValue>;

/**
 * Mock table storage
 */
type MockTables = Record<string, MockRow[]>;

/**
 * Parse SQL SELECT statement to extract table name and basic operations
 */
function parseSelectSQL(sql: string): {
  tableName: string;
  whereClause: string | null;
  orderByClause: string | null;
  limit: number | null;
  offset: number | null;
} {
  const tableMatch = sql.match(/FROM\s+(\w+)/i);
  const tableName = tableMatch ? tableMatch[1] : '';

  const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
  const whereClause = whereMatch ? whereMatch[1].trim() : null;

  const orderMatch = sql.match(/ORDER\s+BY\s+(.+?)(?:\s+LIMIT|$)/i);
  const orderByClause = orderMatch ? orderMatch[1].trim() : null;

  const limitMatch = sql.match(/LIMIT\s+(\?|\d+)/i);
  const limit = limitMatch ? (limitMatch[1] === '?' ? -1 : parseInt(limitMatch[1], 10)) : null;

  const offsetMatch = sql.match(/OFFSET\s+(\?|\d+)/i);
  const offset = offsetMatch ? (offsetMatch[1] === '?' ? -1 : parseInt(offsetMatch[1], 10)) : null;

  return { tableName, whereClause, orderByClause, limit, offset };
}

/**
 * Parse INSERT statement
 */
function parseInsertSQL(sql: string): {
  tableName: string;
  columns: string[];
} {
  const tableMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i);
  const tableName = tableMatch ? tableMatch[1] : '';

  const columnsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
  const columns = columnsMatch
    ? columnsMatch[1].split(',').map((c) => c.trim())
    : [];

  return { tableName, columns };
}

/**
 * Parse UPDATE statement
 */
function parseUpdateSQL(sql: string): {
  tableName: string;
  setClauses: string[];
  whereColumn: string | null;
} {
  const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
  const tableName = tableMatch ? tableMatch[1] : '';

  const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
  const setClauses = setMatch
    ? setMatch[1].split(',').map((c) => c.split('=')[0].trim())
    : [];

  const whereMatch = sql.match(/WHERE\s+(\w+)\s*=/i);
  const whereColumn = whereMatch ? whereMatch[1] : null;

  return { tableName, setClauses, whereColumn };
}

/**
 * Parse DELETE statement
 */
function parseDeleteSQL(sql: string): {
  tableName: string;
  whereColumn: string | null;
} {
  const tableMatch = sql.match(/DELETE\s+FROM\s+(\w+)/i);
  const tableName = tableMatch ? tableMatch[1] : '';

  const whereMatch = sql.match(/WHERE\s+(\w+)\s*=/i);
  const whereColumn = whereMatch ? whereMatch[1] : null;

  return { tableName, whereColumn };
}


/**
 * Evaluate WHERE clause against a row
 *
 * This is a simplified mock that handles basic patterns.
 * For complex SQL queries, the real SQLite adapter should be tested.
 */
function evaluateWhere(
  row: MockRow,
  whereClause: string,
  params: SQLiteValue[],
  startParamIndex: number
): { result: boolean; consumedParams: number } {
  let paramIndex = startParamIndex;

  // Handle = 1 and = 0 literal comparisons (for boolean columns)
  const eqOneMatch = whereClause.match(/(\w+)\s*=\s*1/);
  if (eqOneMatch) {
    const column = eqOneMatch[1];
    if (row[column] !== 1) {
      return { result: false, consumedParams: 0 };
    }
    // Continue checking remaining conditions
  }

  const eqZeroMatch = whereClause.match(/(\w+)\s*=\s*0/);
  if (eqZeroMatch) {
    const column = eqZeroMatch[1];
    if (row[column] !== 0) {
      return { result: false, consumedParams: 0 };
    }
  }

  // Extract simple column = ? conditions
  const simpleConditions = whereClause.match(/(\w+)\s*=\s*\?/g) || [];
  for (const cond of simpleConditions) {
    const colMatch = cond.match(/(\w+)\s*=\s*\?/);
    if (colMatch) {
      const column = colMatch[1];
      const value = params[paramIndex++];
      if (row[column] !== value) {
        return { result: false, consumedParams: paramIndex - startParamIndex };
      }
    }
  }

  // Handle >= conditions
  const gteConditions = whereClause.match(/(\w+)\s*>=\s*\?/g) || [];
  for (const cond of gteConditions) {
    const colMatch = cond.match(/(\w+)\s*>=\s*\?/);
    if (colMatch) {
      const column = colMatch[1];
      const value = params[paramIndex++];
      if ((row[column] ?? '') < (value ?? '')) {
        return { result: false, consumedParams: paramIndex - startParamIndex };
      }
    }
  }

  // Handle <= conditions
  const lteConditions = whereClause.match(/(\w+)\s*<=\s*\?/g) || [];
  for (const cond of lteConditions) {
    const colMatch = cond.match(/(\w+)\s*<=\s*\?/);
    if (colMatch) {
      const column = colMatch[1];
      const value = params[paramIndex++];
      if ((row[column] ?? '') > (value ?? '')) {
        return { result: false, consumedParams: paramIndex - startParamIndex };
      }
    }
  }

  // Handle NOT IN clauses
  const notInMatch = whereClause.match(/(\w+)\s+NOT\s+IN\s*\(([^)]+)\)/i);
  if (notInMatch) {
    const column = notInMatch[1];
    const placeholders = notInMatch[2].split(',').map((p) => p.trim());
    const values: SQLiteValue[] = [];
    for (const ph of placeholders) {
      if (ph === '?') {
        values.push(params[paramIndex++]);
      }
    }
    if (values.includes(row[column])) {
      return { result: false, consumedParams: paramIndex - startParamIndex };
    }
  }

  // Handle IN clauses (but not NOT IN)
  if (!notInMatch) {
    const inMatch = whereClause.match(/(\w+)\s+IN\s*\(([^)]+)\)/i);
    if (inMatch) {
      const column = inMatch[1];
      const placeholders = inMatch[2].split(',').map((p) => p.trim());
      const values: SQLiteValue[] = [];
      for (const ph of placeholders) {
        if (ph === '?') {
          values.push(params[paramIndex++]);
        }
      }
      if (!values.includes(row[column])) {
        return { result: false, consumedParams: paramIndex - startParamIndex };
      }
    }
  }

  // Handle simple LIKE for single column (column LIKE ?)
  const likeMatches = whereClause.match(/(\w+)\s+LIKE\s+\?/gi) || [];
  for (const _ of likeMatches) {
    // Skip LIKE checks - they're often used in OR groups with complex expressions
    // Just consume the parameter
    paramIndex++;
  }

  return { result: true, consumedParams: paramIndex - startParamIndex };
}

/**
 * Create a mock SQLite adapter with in-memory storage
 */
export function createMockAdapter(): SQLiteAdapter & {
  _tables: MockTables;
  _reset: () => void;
  _seed: (tableName: string, rows: MockRow[]) => void;
  _getTable: (tableName: string) => MockRow[];
} {
  const tables: MockTables = {};

  const adapter: SQLiteAdapter & {
    _tables: MockTables;
    _reset: () => void;
    _seed: (tableName: string, rows: MockRow[]) => void;
    _getTable: (tableName: string) => MockRow[];
  } = {
    _tables: tables,

    _reset() {
      for (const key of Object.keys(tables)) {
        delete tables[key];
      }
    },

    _seed(tableName: string, rows: MockRow[]) {
      tables[tableName] = [...rows];
    },

    _getTable(tableName: string) {
      return tables[tableName] || [];
    },

    async exec(sql: string) {
      // Handle CREATE TABLE IF NOT EXISTS
      const createMatch = sql.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)/i);
      if (createMatch) {
        const tableName = createMatch[1];
        if (!tables[tableName]) {
          tables[tableName] = [];
        }
      }
    },

    async run(sql: string, params: SQLiteValue[] = []) {
      // INSERT
      if (/^INSERT/i.test(sql)) {
        const { tableName, columns } = parseInsertSQL(sql);
        if (!tables[tableName]) {
          tables[tableName] = [];
        }

        const row: MockRow = {};
        columns.forEach((col, idx) => {
          row[col] = params[idx] ?? null;
        });

        tables[tableName].push(row);
        return { changes: 1, lastInsertRowid: tables[tableName].length };
      }

      // UPDATE
      if (/^UPDATE/i.test(sql)) {
        const { tableName, setClauses, whereColumn } = parseUpdateSQL(sql);
        if (!tables[tableName]) {
          return { changes: 0, lastInsertRowid: 0 };
        }

        const whereValue = params[setClauses.length]; // Last param is WHERE value
        let changes = 0;

        for (const row of tables[tableName]) {
          if (whereColumn && row[whereColumn] === whereValue) {
            setClauses.forEach((col, idx) => {
              row[col] = params[idx] ?? null;
            });
            changes++;
          }
        }

        return { changes, lastInsertRowid: 0 };
      }

      // DELETE
      if (/^DELETE/i.test(sql)) {
        const { tableName, whereColumn } = parseDeleteSQL(sql);
        if (!tables[tableName]) {
          return { changes: 0, lastInsertRowid: 0 };
        }

        const whereValue = params[0];
        const original = tables[tableName].length;

        if (whereColumn) {
          tables[tableName] = tables[tableName].filter(
            (row) => row[whereColumn] !== whereValue
          );
        }

        return { changes: original - tables[tableName].length, lastInsertRowid: 0 };
      }

      return { changes: 0, lastInsertRowid: 0 };
    },

    async get<T = Record<string, SQLiteValue>>(
      sql: string,
      params: SQLiteValue[] = []
    ): Promise<T | undefined> {
      const results = await this.all<T>(sql, params);
      return results[0];
    },

    async all<T = Record<string, SQLiteValue>>(
      sql: string,
      params: SQLiteValue[] = []
    ): Promise<T[]> {
      // Handle COUNT(*)
      if (/SELECT\s+COUNT\s*\(\s*\*\s*\)/i.test(sql)) {
        const { tableName, whereClause } = parseSelectSQL(sql);
        const tableData = tables[tableName] || [];

        let filtered = tableData;
        if (whereClause) {
          filtered = tableData.filter((row) => {
            const { result } = evaluateWhere(row, whereClause, params, 0);
            return result;
          });
        }

        return [{ count: filtered.length } as unknown as T];
      }

      const { tableName, whereClause, orderByClause, limit, offset } = parseSelectSQL(sql);
      const tableData = tables[tableName] || [];

      // Filter - keep track of where params consumed
      let filtered = [...tableData];
      let whereParamsCount = 0;
      if (whereClause) {
        filtered = tableData.filter((row) => {
          const { result, consumedParams } = evaluateWhere(row, whereClause, params, 0);
          whereParamsCount = consumedParams; // Will be same for all rows
          return result;
        });
      }

      // Sort (simplified - supports column ASC/DESC)
      if (orderByClause) {
        const orderParts = orderByClause.split(',')[0].trim();
        const [column, direction] = orderParts.split(/\s+/);
        const isDesc = /DESC/i.test(direction || '');

        filtered.sort((a, b) => {
          const aVal = a[column] ?? '';
          const bVal = b[column] ?? '';
          const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return isDesc ? -cmp : cmp;
        });
      }

      // Pagination - limit/offset are the last 2 params after WHERE params
      let offsetVal = 0;
      let limitVal = filtered.length;

      // Check if there are LIMIT ? OFFSET ? placeholders
      const hasLimitPlaceholder = /LIMIT\s+\?/i.test(sql);
      const hasOffsetPlaceholder = /OFFSET\s+\?/i.test(sql);

      if (hasLimitPlaceholder && params.length > whereParamsCount) {
        const limitParam = params[params.length - (hasOffsetPlaceholder ? 2 : 1)];
        if (typeof limitParam === 'number') {
          limitVal = limitParam;
        }
      }

      if (hasOffsetPlaceholder && params.length > whereParamsCount + 1) {
        const offsetParam = params[params.length - 1];
        if (typeof offsetParam === 'number') {
          offsetVal = offsetParam;
        }
      }

      // Also check for fixed LIMIT/OFFSET values
      if (limit !== null && limit >= 0 && !hasLimitPlaceholder) {
        limitVal = limit;
      }
      if (offset !== null && offset >= 0 && !hasOffsetPlaceholder) {
        offsetVal = offset;
      }

      return filtered.slice(offsetVal, offsetVal + limitVal) as T[];
    },

    async transaction<T>(fn: () => Promise<T>): Promise<T> {
      // Simple implementation - just execute the function
      return fn();
    },

    async close() {
      // No-op for mock
    },
  };

  return adapter;
}

/**
 * Helper to create a mock row with default values
 */
export function createMockClient(overrides: Partial<MockRow> = {}): MockRow {
  return {
    id: overrides.id ?? `client-${Math.random().toString(36).slice(2)}`,
    store_id: overrides.store_id ?? 'test-store',
    first_name: overrides.first_name ?? 'Test',
    last_name: overrides.last_name ?? 'Client',
    display_name: overrides.display_name ?? null,
    nickname: overrides.nickname ?? null,
    name: overrides.name ?? null,
    phone: overrides.phone ?? '555-1234',
    email: overrides.email ?? null,
    avatar: overrides.avatar ?? null,
    gender: overrides.gender ?? null,
    birthday: overrides.birthday ?? null,
    anniversary: overrides.anniversary ?? null,
    preferred_language: overrides.preferred_language ?? null,
    address: overrides.address ?? null,
    emergency_contacts: overrides.emergency_contacts ?? null,
    staff_alert: overrides.staff_alert ?? null,
    is_blocked: overrides.is_blocked ?? 0,
    blocked_at: overrides.blocked_at ?? null,
    blocked_by: overrides.blocked_by ?? null,
    block_reason: overrides.block_reason ?? null,
    block_reason_note: overrides.block_reason_note ?? null,
    source: overrides.source ?? null,
    source_details: overrides.source_details ?? null,
    referred_by_client_id: overrides.referred_by_client_id ?? null,
    referred_by_client_name: overrides.referred_by_client_name ?? null,
    hair_profile: overrides.hair_profile ?? null,
    skin_profile: overrides.skin_profile ?? null,
    nail_profile: overrides.nail_profile ?? null,
    medical_info: overrides.medical_info ?? null,
    preferences: overrides.preferences ?? null,
    communication_preferences: overrides.communication_preferences ?? null,
    loyalty_info: overrides.loyalty_info ?? null,
    loyalty_tier: overrides.loyalty_tier ?? null,
    membership: overrides.membership ?? null,
    gift_cards: overrides.gift_cards ?? null,
    visit_summary: overrides.visit_summary ?? null,
    last_visit: overrides.last_visit ?? null,
    total_visits: overrides.total_visits ?? null,
    total_spent: overrides.total_spent ?? null,
    outstanding_balance: overrides.outstanding_balance ?? null,
    store_credit: overrides.store_credit ?? null,
    average_rating: overrides.average_rating ?? null,
    total_reviews: overrides.total_reviews ?? null,
    tags: overrides.tags ?? null,
    notes: overrides.notes ?? null,
    is_vip: overrides.is_vip ?? 0,
    created_at: overrides.created_at ?? new Date().toISOString(),
    updated_at: overrides.updated_at ?? new Date().toISOString(),
    sync_status: overrides.sync_status ?? 'local',
    ...overrides,
  };
}

/**
 * Helper to create a mock appointment row
 */
export function createMockAppointment(overrides: Partial<MockRow> = {}): MockRow {
  return {
    id: overrides.id ?? `appt-${Math.random().toString(36).slice(2)}`,
    storeId: overrides.storeId ?? 'test-store',
    clientId: overrides.clientId ?? 'test-client',
    clientName: overrides.clientName ?? null,
    clientPhone: overrides.clientPhone ?? null,
    clientEmail: overrides.clientEmail ?? null,
    staffId: overrides.staffId ?? 'test-staff',
    staffName: overrides.staffName ?? null,
    services: overrides.services ?? '[]',
    status: overrides.status ?? 'scheduled',
    scheduledStartTime: overrides.scheduledStartTime ?? new Date().toISOString(),
    scheduledEndTime: overrides.scheduledEndTime ?? new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    actualStartTime: overrides.actualStartTime ?? null,
    actualEndTime: overrides.actualEndTime ?? null,
    checkInTime: overrides.checkInTime ?? null,
    notes: overrides.notes ?? null,
    source: overrides.source ?? null,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
    createdBy: overrides.createdBy ?? null,
    lastModifiedBy: overrides.lastModifiedBy ?? null,
    syncStatus: overrides.syncStatus ?? 'local',
    ...overrides,
  };
}
