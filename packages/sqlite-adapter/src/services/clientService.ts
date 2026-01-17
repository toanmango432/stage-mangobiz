/**
 * SQLite Client Service
 *
 * SQLite-based implementation of client data operations.
 * Uses SQL WHERE clauses for efficient filtering instead of JS filtering.
 *
 * @module sqlite-adapter/services/clientService
 */

import type { SQLiteAdapter, SQLiteValue } from '../types';

// ==================== TYPE DEFINITIONS ====================

/**
 * Client entity matching Dexie schema
 */
export interface Client {
  id: string;
  storeId: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  nickname?: string;
  name?: string;
  phone: string;
  email?: string;
  avatar?: string;
  gender?: string;
  birthday?: string;
  anniversary?: string;
  preferredLanguage?: string;
  address?: string; // JSON string
  emergencyContacts?: string; // JSON string
  staffAlert?: string; // JSON string
  isBlocked: boolean;
  blockedAt?: string;
  blockedBy?: string;
  blockReason?: string;
  blockReasonNote?: string;
  source?: string;
  sourceDetails?: string;
  referredByClientId?: string;
  referredByClientName?: string;
  hairProfile?: string; // JSON string
  skinProfile?: string; // JSON string
  nailProfile?: string; // JSON string
  medicalInfo?: string; // JSON string
  preferences?: string; // JSON string
  communicationPreferences?: string; // JSON string
  loyaltyInfo?: string; // JSON string
  loyaltyTier?: string;
  membership?: string; // JSON string
  giftCards?: string; // JSON string
  visitSummary?: string; // JSON string
  lastVisit?: string;
  totalVisits?: number;
  totalSpent?: number;
  outstandingBalance?: number;
  storeCredit?: number;
  averageRating?: number;
  totalReviews?: number;
  tags?: string; // JSON string
  notes?: string; // JSON string
  isVip: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
}

/**
 * Client filters for querying
 */
export interface ClientFilters {
  searchQuery?: string;
  loyaltyTier?: string;
  status?: 'all' | 'active' | 'blocked' | 'vip';
  hasUpcomingAppointment?: boolean;
  lastVisitRange?: 'week' | 'month' | 'quarter' | 'year' | 'over_year';
  tags?: string[];
  preferredStaff?: string[];
  source?: string;
}

/**
 * Client sort options
 */
export interface ClientSortOptions {
  field: 'name' | 'lastVisit' | 'totalSpent' | 'visitCount' | 'createdAt';
  order: 'asc' | 'desc';
}

// ==================== ROW TYPE ====================

/**
 * SQLite row representation (snake_case columns)
 */
interface ClientRow {
  id: string;
  store_id: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  nickname: string | null;
  name: string | null;
  phone: string;
  email: string | null;
  avatar: string | null;
  gender: string | null;
  birthday: string | null;
  anniversary: string | null;
  preferred_language: string | null;
  address: string | null;
  emergency_contacts: string | null;
  staff_alert: string | null;
  is_blocked: number;
  blocked_at: string | null;
  blocked_by: string | null;
  block_reason: string | null;
  block_reason_note: string | null;
  source: string | null;
  source_details: string | null;
  referred_by_client_id: string | null;
  referred_by_client_name: string | null;
  hair_profile: string | null;
  skin_profile: string | null;
  nail_profile: string | null;
  medical_info: string | null;
  preferences: string | null;
  communication_preferences: string | null;
  loyalty_info: string | null;
  loyalty_tier: string | null;
  membership: string | null;
  gift_cards: string | null;
  visit_summary: string | null;
  last_visit: string | null;
  total_visits: number | null;
  total_spent: number | null;
  outstanding_balance: number | null;
  store_credit: number | null;
  average_rating: number | null;
  total_reviews: number | null;
  tags: string | null;
  notes: string | null;
  is_vip: number;
  created_at: string;
  updated_at: string;
  sync_status: string;
}

// ==================== CONVERSION FUNCTIONS ====================

/**
 * Convert SQLite row to Client entity
 */
function rowToClient(row: ClientRow): Client {
  return {
    id: row.id,
    storeId: row.store_id,
    firstName: row.first_name,
    lastName: row.last_name,
    displayName: row.display_name ?? undefined,
    nickname: row.nickname ?? undefined,
    name: row.name ?? undefined,
    phone: row.phone,
    email: row.email ?? undefined,
    avatar: row.avatar ?? undefined,
    gender: row.gender ?? undefined,
    birthday: row.birthday ?? undefined,
    anniversary: row.anniversary ?? undefined,
    preferredLanguage: row.preferred_language ?? undefined,
    address: row.address ?? undefined,
    emergencyContacts: row.emergency_contacts ?? undefined,
    staffAlert: row.staff_alert ?? undefined,
    isBlocked: row.is_blocked === 1,
    blockedAt: row.blocked_at ?? undefined,
    blockedBy: row.blocked_by ?? undefined,
    blockReason: row.block_reason ?? undefined,
    blockReasonNote: row.block_reason_note ?? undefined,
    source: row.source ?? undefined,
    sourceDetails: row.source_details ?? undefined,
    referredByClientId: row.referred_by_client_id ?? undefined,
    referredByClientName: row.referred_by_client_name ?? undefined,
    hairProfile: row.hair_profile ?? undefined,
    skinProfile: row.skin_profile ?? undefined,
    nailProfile: row.nail_profile ?? undefined,
    medicalInfo: row.medical_info ?? undefined,
    preferences: row.preferences ?? undefined,
    communicationPreferences: row.communication_preferences ?? undefined,
    loyaltyInfo: row.loyalty_info ?? undefined,
    loyaltyTier: row.loyalty_tier ?? undefined,
    membership: row.membership ?? undefined,
    giftCards: row.gift_cards ?? undefined,
    visitSummary: row.visit_summary ?? undefined,
    lastVisit: row.last_visit ?? undefined,
    totalVisits: row.total_visits ?? undefined,
    totalSpent: row.total_spent ?? undefined,
    outstandingBalance: row.outstanding_balance ?? undefined,
    storeCredit: row.store_credit ?? undefined,
    averageRating: row.average_rating ?? undefined,
    totalReviews: row.total_reviews ?? undefined,
    tags: row.tags ?? undefined,
    notes: row.notes ?? undefined,
    isVip: row.is_vip === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

/**
 * Generate UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ==================== CLIENT SQLITE SERVICE ====================

/**
 * SQLite-based client service
 *
 * Key benefits over Dexie:
 * - getFiltered uses SQL WHERE/LIKE instead of JS filter
 * - SQL aggregations for counts/sums
 * - Efficient index usage with compound queries
 */
export class ClientSQLiteService {
  private db: SQLiteAdapter;

  constructor(db: SQLiteAdapter) {
    this.db = db;
  }

  /**
   * Get all clients for a store with pagination
   */
  async getAll(
    storeId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Client[]> {
    const sql = `
      SELECT * FROM clients
      WHERE store_id = ?
      ORDER BY last_name, first_name
      LIMIT ? OFFSET ?
    `;
    const rows = await this.db.all<ClientRow>(sql, [storeId, limit, offset]);
    return rows.map(rowToClient);
  }

  /**
   * Get a single client by ID
   */
  async getById(id: string): Promise<Client | undefined> {
    const sql = 'SELECT * FROM clients WHERE id = ?';
    const row = await this.db.get<ClientRow>(sql, [id]);
    return row ? rowToClient(row) : undefined;
  }

  /**
   * Get filtered clients with SQL WHERE clauses
   *
   * Key advantage: SQL filtering is more efficient than loading all records
   * and filtering in JavaScript.
   */
  async getFiltered(
    storeId: string,
    filters: ClientFilters,
    sort: ClientSortOptions = { field: 'name', order: 'asc' },
    limit: number = 100,
    offset: number = 0
  ): Promise<{ clients: Client[]; total: number }> {
    const whereClauses: string[] = ['store_id = ?'];
    const params: SQLiteValue[] = [storeId];

    // Search query - name, phone, or email
    if (filters.searchQuery) {
      const searchPattern = `%${filters.searchQuery.toLowerCase()}%`;
      whereClauses.push(`(
        LOWER(first_name || ' ' || last_name) LIKE ?
        OR phone LIKE ?
        OR LOWER(email) LIKE ?
      )`);
      params.push(searchPattern, `%${filters.searchQuery}%`, searchPattern);
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'blocked') {
        whereClauses.push('is_blocked = 1');
      } else if (filters.status === 'vip') {
        whereClauses.push('is_vip = 1');
      } else if (filters.status === 'active') {
        whereClauses.push('is_blocked = 0');
      }
    }

    // Loyalty tier filter
    if (filters.loyaltyTier && filters.loyaltyTier !== 'all') {
      whereClauses.push('loyalty_tier = ?');
      params.push(filters.loyaltyTier);
    }

    // Source filter
    if (filters.source) {
      whereClauses.push('source = ?');
      params.push(filters.source);
    }

    // Last visit range filter
    if (filters.lastVisitRange) {
      const now = new Date();
      let daysAgo: number;
      let isOverYear = false;

      switch (filters.lastVisitRange) {
        case 'week':
          daysAgo = 7;
          break;
        case 'month':
          daysAgo = 30;
          break;
        case 'quarter':
          daysAgo = 90;
          break;
        case 'year':
          daysAgo = 365;
          break;
        case 'over_year':
          daysAgo = 365;
          isOverYear = true;
          break;
        default:
          daysAgo = 0;
      }

      if (daysAgo > 0) {
        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        const cutoffISO = cutoffDate.toISOString();

        if (isOverYear) {
          whereClauses.push('(last_visit IS NULL OR last_visit < ?)');
        } else {
          whereClauses.push('last_visit >= ?');
        }
        params.push(cutoffISO);
      }
    }

    // Tags filter - check if any tag matches (JSON contains)
    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(() => 'tags LIKE ?');
      whereClauses.push(`(${tagConditions.join(' OR ')})`);
      filters.tags.forEach((tag) => {
        params.push(`%"id":"${tag}"%`);
      });
    }

    // Preferred staff filter - check if any staff matches (JSON contains)
    if (filters.preferredStaff && filters.preferredStaff.length > 0) {
      const staffConditions = filters.preferredStaff.map(() => 'preferences LIKE ?');
      whereClauses.push(`(${staffConditions.join(' OR ')})`);
      filters.preferredStaff.forEach((staffId) => {
        params.push(`%${staffId}%`);
      });
    }

    const whereClause = whereClauses.join(' AND ');

    // Build ORDER BY clause
    let orderBy: string;
    switch (sort.field) {
      case 'name':
        orderBy = `last_name ${sort.order.toUpperCase()}, first_name ${sort.order.toUpperCase()}`;
        break;
      case 'lastVisit':
        orderBy = `last_visit ${sort.order.toUpperCase()} NULLS LAST`;
        break;
      case 'totalSpent':
        orderBy = `total_spent ${sort.order.toUpperCase()} NULLS LAST`;
        break;
      case 'visitCount':
        orderBy = `total_visits ${sort.order.toUpperCase()} NULLS LAST`;
        break;
      case 'createdAt':
        orderBy = `created_at ${sort.order.toUpperCase()}`;
        break;
      default:
        orderBy = `last_name ${sort.order.toUpperCase()}, first_name ${sort.order.toUpperCase()}`;
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM clients WHERE ${whereClause}`;
    const countResult = await this.db.get<{ count: number }>(countSql, params);
    const total = countResult?.count ?? 0;

    // Get paginated results
    const selectSql = `
      SELECT * FROM clients
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    const selectParams: SQLiteValue[] = [...params, limit, offset];
    const rows = await this.db.all<ClientRow>(selectSql, selectParams);

    return {
      clients: rows.map(rowToClient),
      total,
    };
  }

  /**
   * Create a new client
   */
  async create(
    client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Client> {
    const now = new Date().toISOString();
    const id = generateUUID();

    const sql = `
      INSERT INTO clients (
        id, store_id, first_name, last_name, display_name, nickname, name,
        phone, email, avatar, gender, birthday, anniversary, preferred_language,
        address, emergency_contacts, staff_alert,
        is_blocked, blocked_at, blocked_by, block_reason, block_reason_note,
        source, source_details, referred_by_client_id, referred_by_client_name,
        hair_profile, skin_profile, nail_profile, medical_info,
        preferences, communication_preferences,
        loyalty_info, loyalty_tier, membership, gift_cards,
        visit_summary, last_visit, total_visits, total_spent,
        outstanding_balance, store_credit, average_rating, total_reviews,
        tags, notes, is_vip,
        created_at, updated_at, sync_status
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?
      )
    `;

    const params: SQLiteValue[] = [
      id,
      client.storeId,
      client.firstName,
      client.lastName,
      client.displayName ?? null,
      client.nickname ?? null,
      client.name ?? null,
      client.phone,
      client.email ?? null,
      client.avatar ?? null,
      client.gender ?? null,
      client.birthday ?? null,
      client.anniversary ?? null,
      client.preferredLanguage ?? null,
      client.address ?? null,
      client.emergencyContacts ?? null,
      client.staffAlert ?? null,
      client.isBlocked ? 1 : 0,
      client.blockedAt ?? null,
      client.blockedBy ?? null,
      client.blockReason ?? null,
      client.blockReasonNote ?? null,
      client.source ?? null,
      client.sourceDetails ?? null,
      client.referredByClientId ?? null,
      client.referredByClientName ?? null,
      client.hairProfile ?? null,
      client.skinProfile ?? null,
      client.nailProfile ?? null,
      client.medicalInfo ?? null,
      client.preferences ?? null,
      client.communicationPreferences ?? null,
      client.loyaltyInfo ?? null,
      client.loyaltyTier ?? null,
      client.membership ?? null,
      client.giftCards ?? null,
      client.visitSummary ?? null,
      client.lastVisit ?? null,
      client.totalVisits ?? null,
      client.totalSpent ?? null,
      client.outstandingBalance ?? null,
      client.storeCredit ?? null,
      client.averageRating ?? null,
      client.totalReviews ?? null,
      client.tags ?? null,
      client.notes ?? null,
      client.isVip ? 1 : 0,
      now,
      now,
      client.syncStatus ?? 'local',
    ];

    await this.db.run(sql, params);

    return {
      ...client,
      id,
      createdAt: now,
      updatedAt: now,
      syncStatus: client.syncStatus ?? 'local',
    };
  }

  /**
   * Update an existing client
   */
  async update(
    id: string,
    updates: Partial<Client>
  ): Promise<Client | undefined> {
    // First check if client exists
    const existing = await this.getById(id);
    if (!existing) {
      return undefined;
    }

    const now = new Date().toISOString();
    const setClauses: string[] = ['updated_at = ?', 'sync_status = ?'];
    const params: SQLiteValue[] = [now, 'local'];

    // Build SET clauses dynamically
    const fieldMappings: Record<string, string> = {
      storeId: 'store_id',
      firstName: 'first_name',
      lastName: 'last_name',
      displayName: 'display_name',
      nickname: 'nickname',
      name: 'name',
      phone: 'phone',
      email: 'email',
      avatar: 'avatar',
      gender: 'gender',
      birthday: 'birthday',
      anniversary: 'anniversary',
      preferredLanguage: 'preferred_language',
      address: 'address',
      emergencyContacts: 'emergency_contacts',
      staffAlert: 'staff_alert',
      isBlocked: 'is_blocked',
      blockedAt: 'blocked_at',
      blockedBy: 'blocked_by',
      blockReason: 'block_reason',
      blockReasonNote: 'block_reason_note',
      source: 'source',
      sourceDetails: 'source_details',
      referredByClientId: 'referred_by_client_id',
      referredByClientName: 'referred_by_client_name',
      hairProfile: 'hair_profile',
      skinProfile: 'skin_profile',
      nailProfile: 'nail_profile',
      medicalInfo: 'medical_info',
      preferences: 'preferences',
      communicationPreferences: 'communication_preferences',
      loyaltyInfo: 'loyalty_info',
      loyaltyTier: 'loyalty_tier',
      membership: 'membership',
      giftCards: 'gift_cards',
      visitSummary: 'visit_summary',
      lastVisit: 'last_visit',
      totalVisits: 'total_visits',
      totalSpent: 'total_spent',
      outstandingBalance: 'outstanding_balance',
      storeCredit: 'store_credit',
      averageRating: 'average_rating',
      totalReviews: 'total_reviews',
      tags: 'tags',
      notes: 'notes',
      isVip: 'is_vip',
    };

    for (const [key, column] of Object.entries(fieldMappings)) {
      if (key in updates) {
        setClauses.push(`${column} = ?`);
        const value = updates[key as keyof Client];
        // Convert booleans to integers for SQLite
        if (typeof value === 'boolean') {
          params.push(value ? 1 : 0);
        } else if (value === undefined) {
          params.push(null);
        } else {
          params.push(value as SQLiteValue);
        }
      }
    }

    const sql = `UPDATE clients SET ${setClauses.join(', ')} WHERE id = ?`;
    params.push(id);

    await this.db.run(sql, params);

    // Return updated client
    return this.getById(id);
  }

  /**
   * Delete a client by ID
   */
  async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM clients WHERE id = ?';
    const result = await this.db.run(sql, [id]);
    return result.changes > 0;
  }

  /**
   * Search clients by name, phone, or email
   */
  async search(
    storeId: string,
    query: string,
    limit: number = 50
  ): Promise<Client[]> {
    const searchPattern = `%${query.toLowerCase()}%`;
    const sql = `
      SELECT * FROM clients
      WHERE store_id = ?
        AND (
          LOWER(first_name || ' ' || last_name) LIKE ?
          OR phone LIKE ?
          OR LOWER(email) LIKE ?
        )
      ORDER BY last_name, first_name
      LIMIT ?
    `;
    const rows = await this.db.all<ClientRow>(sql, [
      storeId,
      searchPattern,
      `%${query}%`,
      searchPattern,
      limit,
    ]);
    return rows.map(rowToClient);
  }

  /**
   * Get blocked clients for a store
   */
  async getBlocked(storeId: string, limit: number = 100): Promise<Client[]> {
    const sql = `
      SELECT * FROM clients
      WHERE store_id = ? AND is_blocked = 1
      ORDER BY blocked_at DESC
      LIMIT ?
    `;
    const rows = await this.db.all<ClientRow>(sql, [storeId, limit]);
    return rows.map(rowToClient);
  }

  /**
   * Get VIP clients for a store
   */
  async getVip(storeId: string, limit: number = 100): Promise<Client[]> {
    const sql = `
      SELECT * FROM clients
      WHERE store_id = ? AND is_vip = 1
      ORDER BY last_name, first_name
      LIMIT ?
    `;
    const rows = await this.db.all<ClientRow>(sql, [storeId, limit]);
    return rows.map(rowToClient);
  }

  /**
   * Get client count for a store
   */
  async getCount(storeId: string): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM clients WHERE store_id = ?';
    const result = await this.db.get<{ count: number }>(sql, [storeId]);
    return result?.count ?? 0;
  }

  /**
   * Get clients by IDs
   */
  async getByIds(ids: string[]): Promise<Client[]> {
    if (ids.length === 0) {
      return [];
    }

    const placeholders = ids.map(() => '?').join(', ');
    const sql = `SELECT * FROM clients WHERE id IN (${placeholders})`;
    const rows = await this.db.all<ClientRow>(sql, ids);
    return rows.map(rowToClient);
  }
}
