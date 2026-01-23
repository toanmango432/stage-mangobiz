/**
 * Client Type Adapter
 *
 * Converts between Supabase ClientRow and app Client types.
 */

import type { ClientRow, ClientInsert, ClientUpdate, Json } from '../types';
import type { Client, LoyaltyInfo, VisitSummary, ClientTag, ClientNote, ClientPreferences, SyncStatus } from '@mango/types';

/**
 * Convert Supabase ClientRow to app Client type
 */
export function toClient(row: ClientRow): Client {
  const loyaltyInfo = parseLoyaltyInfo(row.loyalty_info);
  const visitSummary = parseVisitSummary(row.visit_summary);
  const preferences = parsePreferences(row.preferences);
  const tags = parseTags(row.tags);
  const notes = parseNotes(row.notes);

  return {
    id: row.id,
    storeId: row.store_id,
    firstName: row.first_name,
    lastName: row.last_name,
    name: `${row.first_name} ${row.last_name}`.trim(),
    phone: row.phone,
    email: row.email || undefined,
    isBlocked: row.is_blocked,
    isVip: row.is_vip,
    preferences,
    loyaltyInfo,
    visitSummary,
    tags,
    notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status as SyncStatus,
  };
}

/**
 * Convert app Client to Supabase ClientInsert
 */
export function toClientInsert(
  client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>,
  storeId?: string
): Omit<ClientInsert, 'store_id'> & { store_id?: string } {
  return {
    store_id: storeId || client.storeId,
    first_name: client.firstName,
    last_name: client.lastName,
    phone: client.phone,
    email: client.email || null,
    is_blocked: client.isBlocked,
    is_vip: client.isVip,
    preferences: serializePreferences(client.preferences) as Json,
    loyalty_info: serializeLoyaltyInfo(client.loyaltyInfo) as Json,
    visit_summary: serializeVisitSummary(client.visitSummary) as Json,
    tags: serializeTags(client.tags) as Json,
    notes: serializeNotes(client.notes) as Json,
    sync_status: client.syncStatus || 'synced',
    sync_version: 1,
  };
}

/**
 * Convert partial Client updates to Supabase ClientUpdate
 */
export function toClientUpdate(updates: Partial<Client>): ClientUpdate {
  const result: ClientUpdate = {};

  if (updates.firstName !== undefined) {
    result.first_name = updates.firstName;
  }
  if (updates.lastName !== undefined) {
    result.last_name = updates.lastName;
  }
  if (updates.phone !== undefined) {
    result.phone = updates.phone;
  }
  if (updates.email !== undefined) {
    result.email = updates.email || null;
  }
  if (updates.isBlocked !== undefined) {
    result.is_blocked = updates.isBlocked;
  }
  if (updates.isVip !== undefined) {
    result.is_vip = updates.isVip;
  }
  if (updates.preferences !== undefined) {
    result.preferences = serializePreferences(updates.preferences) as Json;
  }
  if (updates.loyaltyInfo !== undefined) {
    result.loyalty_info = serializeLoyaltyInfo(updates.loyaltyInfo) as Json;
  }
  if (updates.visitSummary !== undefined) {
    result.visit_summary = serializeVisitSummary(updates.visitSummary) as Json;
  }
  if (updates.tags !== undefined) {
    result.tags = serializeTags(updates.tags) as Json;
  }
  if (updates.notes !== undefined) {
    result.notes = serializeNotes(updates.notes) as Json;
  }
  if (updates.syncStatus !== undefined) {
    result.sync_status = updates.syncStatus;
  }

  return result;
}

// ==================== PARSE HELPERS ====================

function parseLoyaltyInfo(json: Json): LoyaltyInfo | undefined {
  if (!json || typeof json !== 'object') return undefined;
  const data = json as Record<string, unknown>;
  return {
    tier: (data.tier as LoyaltyInfo['tier']) || 'bronze',
    pointsBalance: Number(data.pointsBalance || data.points_balance || 0),
    lifetimePoints: Number(data.lifetimePoints || data.lifetime_points || 0),
    memberSince: data.memberSince as string || data.member_since as string,
    referralCode: data.referralCode as string || data.referral_code as string,
    referredBy: data.referredBy as string || data.referred_by as string,
    referralCount: Number(data.referralCount || data.referral_count || 0),
    rewardsRedeemed: Number(data.rewardsRedeemed || data.rewards_redeemed || 0),
  };
}

function parseVisitSummary(json: Json): VisitSummary | undefined {
  if (!json || typeof json !== 'object') return undefined;
  const data = json as Record<string, unknown>;
  return {
    totalVisits: Number(data.totalVisits || data.total_visits || 0),
    totalSpent: Number(data.totalSpent || data.total_spent || 0),
    averageTicket: Number(data.averageTicket || data.average_ticket || 0),
    lastVisitDate: data.lastVisitDate as string || data.last_visit_date as string,
    favoriteService: data.favoriteService as string || data.favorite_service as string,
    noShowCount: Number(data.noShowCount || data.no_show_count || 0),
    lateCancelCount: Number(data.lateCancelCount || data.late_cancel_count || 0),
  };
}

function parsePreferences(json: Json): ClientPreferences | undefined {
  if (!json || typeof json !== 'object') return undefined;
  const data = json as Record<string, unknown>;
  return {
    preferredStaffIds: data.preferredStaffIds as string[] || data.preferred_staff_ids as string[],
    preferredServices: data.preferredServices as string[] || data.preferred_services as string[],
    beveragePreference: data.beveragePreference as string || data.beverage_preference as string,
    otherNotes: data.otherNotes as string || data.other_notes as string,
  };
}

function parseTags(json: Json): ClientTag[] | undefined {
  if (!Array.isArray(json)) return undefined;
  return json.map((t) => {
    const tag = t as Record<string, unknown>;
    return {
      id: String(tag.id || ''),
      name: String(tag.name || ''),
      color: String(tag.color || '#888888'),
    };
  });
}

function parseNotes(json: Json): ClientNote[] | undefined {
  if (!Array.isArray(json)) return undefined;
  return json.map((n) => {
    const note = n as Record<string, unknown>;
    return {
      id: String(note.id || ''),
      date: String(note.date || ''),
      content: String(note.content || ''),
      type: (note.type as ClientNote['type']) || 'general',
      isPrivate: Boolean(note.isPrivate || note.is_private),
      createdBy: String(note.createdBy || note.created_by || ''),
      createdByName: note.createdByName as string || note.created_by_name as string,
    };
  });
}

// ==================== SERIALIZE HELPERS ====================

function serializeLoyaltyInfo(info?: LoyaltyInfo): Record<string, unknown> | null {
  if (!info) return null;
  return {
    tier: info.tier,
    pointsBalance: info.pointsBalance,
    lifetimePoints: info.lifetimePoints,
    memberSince: info.memberSince,
    referralCode: info.referralCode,
    referredBy: info.referredBy,
    referralCount: info.referralCount,
    rewardsRedeemed: info.rewardsRedeemed,
  };
}

function serializeVisitSummary(summary?: VisitSummary): Record<string, unknown> | null {
  if (!summary) return null;
  return {
    totalVisits: summary.totalVisits,
    totalSpent: summary.totalSpent,
    averageTicket: summary.averageTicket,
    lastVisitDate: summary.lastVisitDate,
    favoriteService: summary.favoriteService,
    noShowCount: summary.noShowCount,
    lateCancelCount: summary.lateCancelCount,
  };
}

function serializePreferences(prefs?: ClientPreferences): Record<string, unknown> | null {
  if (!prefs) return null;
  return {
    preferredStaffIds: prefs.preferredStaffIds,
    preferredServices: prefs.preferredServices,
    beveragePreference: prefs.beveragePreference,
    otherNotes: prefs.otherNotes,
  };
}

function serializeTags(tags?: ClientTag[]): unknown[] | null {
  if (!tags) return null;
  return tags.map(t => ({
    id: t.id,
    name: t.name,
    color: t.color,
  }));
}

function serializeNotes(notes?: ClientNote[]): unknown[] | null {
  if (!notes) return null;
  return notes.map(n => ({
    id: n.id,
    date: n.date,
    content: n.content,
    type: n.type,
    isPrivate: n.isPrivate,
    createdBy: n.createdBy,
    createdByName: n.createdByName,
  }));
}

/**
 * Convert array of ClientRows to Clients
 */
export function toClients(rows: ClientRow[]): Client[] {
  return rows.map(toClient);
}
