/**
 * CRM SQLite Services - Batch CRM-related services
 *
 * This file contains SQLite service implementations for all CRM-related tables:
 * - PatchTest - Allergy/sensitivity test records (PRD 2.3.3)
 * - FormTemplate - Consultation form templates (PRD 2.3.4)
 * - FormResponse - Client form submissions (PRD 2.3.4)
 * - Referral - Client referral tracking (PRD 2.3.8)
 * - ClientReview - Client reviews and ratings (PRD 2.3.9)
 * - LoyaltyReward - Loyalty program rewards (PRD 2.3.7)
 * - ReviewRequest - Review invitation tracking (PRD 2.3.9)
 * - CustomSegment - Custom client segmentation (PRD 2.3.10)
 *
 * @module sqlite-adapter/services/crmServices
 */

import type { SQLiteAdapter } from '../types';
import { BaseSQLiteService, type TableSchema } from './BaseSQLiteService';
import { toISOString } from '../utils';

// ==================== PATCH TEST ====================

/**
 * Patch test result types
 */
export type PatchTestResult = 'pass' | 'fail' | 'pending';

/**
 * Patch test entity - Records allergy/sensitivity tests for services
 */
export interface PatchTest extends Record<string, unknown> {
  id: string;
  clientId: string;
  serviceId: string;
  serviceName?: string;
  testDate: string;
  result: PatchTestResult;
  expiresAt: string;
  performedBy: string;
  performedByName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
}

/**
 * Patch test row - SQLite row format
 */
export interface PatchTestRow {
  id: string;
  client_id: string;
  service_id: string;
  service_name: string | null;
  test_date: string;
  result: string;
  expires_at: string;
  performed_by: string;
  performed_by_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
}

const patchTestSchema: TableSchema = {
  tableName: 'patch_tests',
  primaryKey: 'id',
  columns: {
    id: 'id',
    clientId: 'client_id',
    serviceId: 'service_id',
    serviceName: 'service_name',
    testDate: 'test_date',
    result: 'result',
    expiresAt: 'expires_at',
    performedBy: 'performed_by',
    performedByName: 'performed_by_name',
    notes: 'notes',
    createdAt: { column: 'created_at', type: 'date' },
    updatedAt: { column: 'updated_at', type: 'date' },
    syncStatus: 'sync_status',
  },
};

/**
 * Patch Test SQLite Service
 */
export class PatchTestSQLiteService extends BaseSQLiteService<PatchTest, PatchTestRow> {
  constructor(db: SQLiteAdapter) {
    super(db, patchTestSchema);
  }

  /**
   * Get patch tests for a specific client
   */
  async getByClient(clientId: string): Promise<PatchTest[]> {
    return this.findWhere('client_id = ?', [clientId], 'test_date DESC');
  }

  /**
   * Get patch tests expiring within a date range
   */
  async getExpiring(withinDays: number = 30): Promise<PatchTest[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
    return this.findWhere(
      'expires_at >= ? AND expires_at <= ? AND result = ?',
      [toISOString(now), toISOString(futureDate), 'pass'],
      'expires_at ASC'
    );
  }

  /**
   * Get patch test for a specific client and service
   */
  async getByClientAndService(clientId: string, serviceId: string): Promise<PatchTest | undefined> {
    return this.findOneWhere(
      'client_id = ? AND service_id = ?',
      [clientId, serviceId]
    );
  }

  /**
   * Check if client has valid (non-expired, passed) patch test for service
   */
  async hasValidPatchTest(clientId: string, serviceId: string): Promise<boolean> {
    const now = toISOString(new Date());
    const result = await this.findOneWhere(
      'client_id = ? AND service_id = ? AND result = ? AND expires_at > ?',
      [clientId, serviceId, 'pass', now]
    );
    return result !== undefined;
  }

  /**
   * Get all expired patch tests for cleanup
   */
  async getExpired(): Promise<PatchTest[]> {
    const now = toISOString(new Date());
    return this.findWhere('expires_at < ?', [now], 'expires_at ASC');
  }
}

// ==================== FORM TEMPLATE ====================

/**
 * Form section type
 */
export type FormSectionType =
  | 'client_details'
  | 'text_input'
  | 'single_choice'
  | 'multi_choice'
  | 'date_picker'
  | 'number_input'
  | 'file_upload'
  | 'consent_checkbox'
  | 'signature'
  | 'info_text';

/**
 * Form section definition
 */
export interface FormSection {
  id: string;
  type: FormSectionType;
  label: string;
  description?: string;
  required: boolean;
  config: Record<string, unknown>;
  order: number;
}

/**
 * Form template entity
 */
export interface FormTemplate extends Record<string, unknown> {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  sendMode: 'automatic' | 'manual';
  frequency?: 'every_time' | 'once';
  linkedServiceIds?: string[];
  requiresSignature: boolean;
  sections: FormSection[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
}

/**
 * Form template row - SQLite row format
 */
export interface FormTemplateRow {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  send_mode: string;
  frequency: string | null;
  linked_service_ids: string | null;
  requires_signature: number;
  sections: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  sync_status: string;
}

const formTemplateSchema: TableSchema = {
  tableName: 'form_templates',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    name: 'name',
    description: 'description',
    sendMode: 'send_mode',
    frequency: 'frequency',
    linkedServiceIds: { column: 'linked_service_ids', type: 'json', defaultValue: [] },
    requiresSignature: { column: 'requires_signature', type: 'boolean' },
    sections: { column: 'sections', type: 'json', defaultValue: [] },
    isActive: { column: 'is_active', type: 'boolean' },
    createdAt: { column: 'created_at', type: 'date' },
    updatedAt: { column: 'updated_at', type: 'date' },
    syncStatus: 'sync_status',
  },
};

/**
 * Form Template SQLite Service
 */
export class FormTemplateSQLiteService extends BaseSQLiteService<FormTemplate, FormTemplateRow> {
  constructor(db: SQLiteAdapter) {
    super(db, formTemplateSchema);
  }

  /**
   * Get all active form templates for a store
   */
  async getActive(storeId: string): Promise<FormTemplate[]> {
    return this.findWhere(
      'store_id = ? AND is_active = 1',
      [storeId],
      'name ASC'
    );
  }

  /**
   * Get templates by store
   */
  async getByStore(storeId: string): Promise<FormTemplate[]> {
    return this.findWhere('store_id = ?', [storeId], 'name ASC');
  }

  /**
   * Get templates linked to a specific service
   */
  async getByLinkedService(storeId: string, serviceId: string): Promise<FormTemplate[]> {
    // Use JSON search to find templates with this service in linkedServiceIds array
    const sql = `
      SELECT * FROM ${formTemplateSchema.tableName}
      WHERE store_id = ? AND is_active = 1
        AND EXISTS (
          SELECT 1 FROM json_each(linked_service_ids) AS ls
          WHERE ls.value = ?
        )
      ORDER BY name ASC
    `;
    const rows = await this.db.all<FormTemplateRow>(sql, [storeId, serviceId]);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Get automatic send templates for a store
   */
  async getAutomatic(storeId: string): Promise<FormTemplate[]> {
    return this.findWhere(
      'store_id = ? AND is_active = 1 AND send_mode = ?',
      [storeId, 'automatic'],
      'name ASC'
    );
  }
}

// ==================== FORM RESPONSE ====================

/**
 * Form response status
 */
export type FormResponseStatus = 'pending' | 'completed' | 'expired';

/**
 * Form response entity - Client form submissions
 */
export interface FormResponse extends Record<string, unknown> {
  id: string;
  formTemplateId: string;
  templateName?: string;
  clientId: string;
  appointmentId?: string;
  responses: Record<string, unknown>;
  signatureImage?: string;
  status: FormResponseStatus;
  sentAt: string;
  completedAt?: string;
  completedBy: string;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
}

/**
 * Form response row - SQLite row format
 */
export interface FormResponseRow {
  id: string;
  form_template_id: string;
  template_name: string | null;
  client_id: string;
  appointment_id: string | null;
  responses: string;
  signature_image: string | null;
  status: string;
  sent_at: string;
  completed_at: string | null;
  completed_by: string;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
}

const formResponseSchema: TableSchema = {
  tableName: 'form_responses',
  primaryKey: 'id',
  columns: {
    id: 'id',
    formTemplateId: 'form_template_id',
    templateName: 'template_name',
    clientId: 'client_id',
    appointmentId: 'appointment_id',
    responses: { column: 'responses', type: 'json', defaultValue: {} },
    signatureImage: 'signature_image',
    status: 'status',
    sentAt: { column: 'sent_at', type: 'date' },
    completedAt: { column: 'completed_at', type: 'date' },
    completedBy: 'completed_by',
    ipAddress: 'ip_address',
    createdAt: { column: 'created_at', type: 'date' },
    updatedAt: { column: 'updated_at', type: 'date' },
    syncStatus: 'sync_status',
  },
};

/**
 * Form Response SQLite Service
 */
export class FormResponseSQLiteService extends BaseSQLiteService<FormResponse, FormResponseRow> {
  constructor(db: SQLiteAdapter) {
    super(db, formResponseSchema);
  }

  /**
   * Get all form responses for a client
   */
  async getByClient(clientId: string): Promise<FormResponse[]> {
    return this.findWhere('client_id = ?', [clientId], 'created_at DESC');
  }

  /**
   * Get form responses for an appointment
   */
  async getByAppointment(appointmentId: string): Promise<FormResponse[]> {
    return this.findWhere('appointment_id = ?', [appointmentId], 'created_at DESC');
  }

  /**
   * Get pending form responses for a client
   */
  async getPendingByClient(clientId: string): Promise<FormResponse[]> {
    return this.findWhere(
      'client_id = ? AND status = ?',
      [clientId, 'pending'],
      'sent_at DESC'
    );
  }

  /**
   * Get form responses by template
   */
  async getByTemplate(templateId: string): Promise<FormResponse[]> {
    return this.findWhere('form_template_id = ?', [templateId], 'created_at DESC');
  }

  /**
   * Get completed form responses in a date range
   */
  async getCompletedInRange(storeId: string, start: string, end: string): Promise<FormResponse[]> {
    const sql = `
      SELECT fr.* FROM ${formResponseSchema.tableName} fr
      JOIN form_templates ft ON fr.form_template_id = ft.id
      WHERE ft.store_id = ?
        AND fr.status = 'completed'
        AND fr.completed_at >= ?
        AND fr.completed_at <= ?
      ORDER BY fr.completed_at DESC
    `;
    const rows = await this.db.all<FormResponseRow>(sql, [storeId, start, end]);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Mark form response as completed
   */
  async complete(id: string, completedBy: string): Promise<FormResponse | undefined> {
    return this.update(id, {
      status: 'completed',
      completedAt: toISOString(new Date()),
      completedBy,
    } as Partial<FormResponse>);
  }
}

// ==================== REFERRAL ====================

/**
 * Referral entity - Tracks client referrals
 */
export interface Referral extends Record<string, unknown> {
  id: string;
  referrerClientId: string;
  referredClientId: string;
  referredClientName?: string;
  referralLinkCode: string;
  firstAppointmentId?: string;
  referrerRewardIssued: boolean;
  referredRewardIssued: boolean;
  createdAt: string;
  completedAt?: string;
  syncStatus: string;
}

/**
 * Referral row - SQLite row format
 */
export interface ReferralRow {
  id: string;
  referrer_client_id: string;
  referred_client_id: string;
  referred_client_name: string | null;
  referral_link_code: string;
  first_appointment_id: string | null;
  referrer_reward_issued: number;
  referred_reward_issued: number;
  created_at: string;
  completed_at: string | null;
  sync_status: string;
}

const referralSchema: TableSchema = {
  tableName: 'referrals',
  primaryKey: 'id',
  columns: {
    id: 'id',
    referrerClientId: 'referrer_client_id',
    referredClientId: 'referred_client_id',
    referredClientName: 'referred_client_name',
    referralLinkCode: 'referral_link_code',
    firstAppointmentId: 'first_appointment_id',
    referrerRewardIssued: { column: 'referrer_reward_issued', type: 'boolean' },
    referredRewardIssued: { column: 'referred_reward_issued', type: 'boolean' },
    createdAt: { column: 'created_at', type: 'date' },
    completedAt: { column: 'completed_at', type: 'date' },
    syncStatus: 'sync_status',
  },
};

/**
 * Referral SQLite Service
 */
export class ReferralSQLiteService extends BaseSQLiteService<Referral, ReferralRow> {
  constructor(db: SQLiteAdapter) {
    super(db, referralSchema);
  }

  /**
   * Get all referrals made by a client (referrer)
   */
  async getByReferrer(referrerClientId: string): Promise<Referral[]> {
    return this.findWhere('referrer_client_id = ?', [referrerClientId], 'created_at DESC');
  }

  /**
   * Get referral by referral code
   */
  async getByCode(referralLinkCode: string): Promise<Referral | undefined> {
    return this.findOneWhere('referral_link_code = ?', [referralLinkCode]);
  }

  /**
   * Get referral count for a client
   */
  async getReferralCount(referrerClientId: string): Promise<number> {
    return this.countWhere('referrer_client_id = ?', [referrerClientId]);
  }

  /**
   * Get successful referrals (completed with first appointment)
   */
  async getSuccessfulByReferrer(referrerClientId: string): Promise<Referral[]> {
    return this.findWhere(
      'referrer_client_id = ? AND first_appointment_id IS NOT NULL',
      [referrerClientId],
      'created_at DESC'
    );
  }

  /**
   * Get referrals pending reward issuance
   */
  async getPendingRewards(): Promise<Referral[]> {
    return this.findWhere(
      'first_appointment_id IS NOT NULL AND (referrer_reward_issued = 0 OR referred_reward_issued = 0)',
      [],
      'created_at ASC'
    );
  }

  /**
   * Mark referrer reward as issued
   */
  async markReferrerRewardIssued(id: string): Promise<Referral | undefined> {
    return this.update(id, { referrerRewardIssued: true } as Partial<Referral>);
  }

  /**
   * Mark referred reward as issued
   */
  async markReferredRewardIssued(id: string): Promise<Referral | undefined> {
    return this.update(id, { referredRewardIssued: true } as Partial<Referral>);
  }
}

// ==================== CLIENT REVIEW ====================

/**
 * Review platform type
 */
export type ReviewPlatform = 'internal' | 'google' | 'yelp' | 'facebook';

/**
 * Client review entity
 */
export interface ClientReview extends Record<string, unknown> {
  id: string;
  clientId: string;
  appointmentId?: string;
  staffId?: string;
  rating: number;
  comment?: string;
  platform: ReviewPlatform;
  staffResponse?: string;
  respondedAt?: string;
  createdAt: string;
  syncStatus: string;
}

/**
 * Client review row - SQLite row format
 */
export interface ClientReviewRow {
  id: string;
  client_id: string;
  appointment_id: string | null;
  staff_id: string | null;
  rating: number;
  comment: string | null;
  platform: string;
  staff_response: string | null;
  responded_at: string | null;
  created_at: string;
  sync_status: string;
}

const clientReviewSchema: TableSchema = {
  tableName: 'client_reviews',
  primaryKey: 'id',
  columns: {
    id: 'id',
    clientId: 'client_id',
    appointmentId: 'appointment_id',
    staffId: 'staff_id',
    rating: { column: 'rating', type: 'number' },
    comment: 'comment',
    platform: 'platform',
    staffResponse: 'staff_response',
    respondedAt: { column: 'responded_at', type: 'date' },
    createdAt: { column: 'created_at', type: 'date' },
    syncStatus: 'sync_status',
  },
};

/**
 * Client Review SQLite Service
 */
export class ClientReviewSQLiteService extends BaseSQLiteService<ClientReview, ClientReviewRow> {
  constructor(db: SQLiteAdapter) {
    super(db, clientReviewSchema);
  }

  /**
   * Get all reviews for a client
   */
  async getByClient(clientId: string): Promise<ClientReview[]> {
    return this.findWhere('client_id = ?', [clientId], 'created_at DESC');
  }

  /**
   * Get all reviews for a staff member
   */
  async getByStaff(staffId: string): Promise<ClientReview[]> {
    return this.findWhere('staff_id = ?', [staffId], 'created_at DESC');
  }

  /**
   * Get average rating for a staff member using SQL AVG
   */
  async getAverageRating(staffId: string): Promise<number | null> {
    const sql = `
      SELECT COALESCE(AVG(rating), 0) as avg_rating
      FROM ${clientReviewSchema.tableName}
      WHERE staff_id = ?
    `;
    const result = await this.db.get<{ avg_rating: number }>(sql, [staffId]);
    return result?.avg_rating ?? null;
  }

  /**
   * Get average rating for entire store
   */
  async getStoreAverageRating(storeId: string): Promise<{ average: number; count: number }> {
    const sql = `
      SELECT
        COALESCE(AVG(cr.rating), 0) as avg_rating,
        COUNT(*) as review_count
      FROM ${clientReviewSchema.tableName} cr
      JOIN clients c ON cr.client_id = c.id
      WHERE c.store_id = ?
    `;
    const result = await this.db.get<{ avg_rating: number; review_count: number }>(sql, [storeId]);
    return {
      average: result?.avg_rating ?? 0,
      count: result?.review_count ?? 0,
    };
  }

  /**
   * Get reviews by rating threshold
   */
  async getByRatingRange(storeId: string, minRating: number, maxRating: number): Promise<ClientReview[]> {
    const sql = `
      SELECT cr.* FROM ${clientReviewSchema.tableName} cr
      JOIN clients c ON cr.client_id = c.id
      WHERE c.store_id = ?
        AND cr.rating >= ?
        AND cr.rating <= ?
      ORDER BY cr.created_at DESC
    `;
    const rows = await this.db.all<ClientReviewRow>(sql, [storeId, minRating, maxRating]);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Get reviews needing response (no staff_response yet)
   */
  async getNeedingResponse(storeId: string): Promise<ClientReview[]> {
    const sql = `
      SELECT cr.* FROM ${clientReviewSchema.tableName} cr
      JOIN clients c ON cr.client_id = c.id
      WHERE c.store_id = ?
        AND cr.staff_response IS NULL
      ORDER BY cr.created_at DESC
    `;
    const rows = await this.db.all<ClientReviewRow>(sql, [storeId]);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Add response to a review
   */
  async addResponse(id: string, response: string): Promise<ClientReview | undefined> {
    return this.update(id, {
      staffResponse: response,
      respondedAt: toISOString(new Date()),
    } as Partial<ClientReview>);
  }
}

// ==================== LOYALTY REWARD ====================

/**
 * Loyalty reward type
 */
export type LoyaltyRewardType = 'amount_discount' | 'percentage_discount' | 'free_service' | 'free_product';

/**
 * Loyalty reward earned source
 */
export type LoyaltyRewardSource = 'points' | 'tier' | 'referral' | 'manual';

/**
 * Loyalty reward entity
 */
export interface LoyaltyReward extends Record<string, unknown> {
  id: string;
  storeId: string;
  clientId: string;
  type: LoyaltyRewardType;
  value: number;
  description?: string;
  pointsCost?: number;
  productId?: string;
  serviceId?: string;
  minSpend?: number;
  expiresAt?: string;
  earnedFrom: LoyaltyRewardSource;
  redeemedAt?: string;
  createdAt: string;
  syncStatus: string;
}

/**
 * Loyalty reward row - SQLite row format
 */
export interface LoyaltyRewardRow {
  id: string;
  store_id: string;
  client_id: string;
  type: string;
  value: number;
  description: string | null;
  points_cost: number | null;
  product_id: string | null;
  service_id: string | null;
  min_spend: number | null;
  expires_at: string | null;
  earned_from: string;
  redeemed_at: string | null;
  created_at: string;
  sync_status: string;
}

const loyaltyRewardSchema: TableSchema = {
  tableName: 'loyalty_rewards',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    clientId: 'client_id',
    type: 'type',
    value: { column: 'value', type: 'number' },
    description: 'description',
    pointsCost: { column: 'points_cost', type: 'number' },
    productId: 'product_id',
    serviceId: 'service_id',
    minSpend: { column: 'min_spend', type: 'number' },
    expiresAt: { column: 'expires_at', type: 'date' },
    earnedFrom: 'earned_from',
    redeemedAt: { column: 'redeemed_at', type: 'date' },
    createdAt: { column: 'created_at', type: 'date' },
    syncStatus: 'sync_status',
  },
};

/**
 * Loyalty Reward SQLite Service
 */
export class LoyaltyRewardSQLiteService extends BaseSQLiteService<LoyaltyReward, LoyaltyRewardRow> {
  constructor(db: SQLiteAdapter) {
    super(db, loyaltyRewardSchema);
  }

  /**
   * Get all rewards for a client
   */
  async getByClient(clientId: string): Promise<LoyaltyReward[]> {
    return this.findWhere('client_id = ?', [clientId], 'created_at DESC');
  }

  /**
   * Get available (unredeemed, non-expired) rewards for a client
   */
  async getAvailable(clientId: string): Promise<LoyaltyReward[]> {
    const now = toISOString(new Date());
    return this.findWhere(
      'client_id = ? AND redeemed_at IS NULL AND (expires_at IS NULL OR expires_at > ?)',
      [clientId, now],
      'created_at DESC'
    );
  }

  /**
   * Get rewards by store
   */
  async getByStore(storeId: string): Promise<LoyaltyReward[]> {
    return this.findWhere('store_id = ?', [storeId], 'created_at DESC');
  }

  /**
   * Get rewards by type
   */
  async getByType(storeId: string, type: LoyaltyRewardType): Promise<LoyaltyReward[]> {
    return this.findWhere(
      'store_id = ? AND type = ?',
      [storeId, type],
      'created_at DESC'
    );
  }

  /**
   * Get expiring rewards (within N days)
   */
  async getExpiringSoon(storeId: string, withinDays: number = 7): Promise<LoyaltyReward[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
    return this.findWhere(
      'store_id = ? AND redeemed_at IS NULL AND expires_at >= ? AND expires_at <= ?',
      [storeId, toISOString(now), toISOString(futureDate)],
      'expires_at ASC'
    );
  }

  /**
   * Redeem a reward
   */
  async redeem(id: string): Promise<LoyaltyReward | undefined> {
    return this.update(id, {
      redeemedAt: toISOString(new Date()),
    } as Partial<LoyaltyReward>);
  }

  /**
   * Count available rewards for a client
   */
  async countAvailable(clientId: string): Promise<number> {
    const now = toISOString(new Date());
    return this.countWhere(
      'client_id = ? AND redeemed_at IS NULL AND (expires_at IS NULL OR expires_at > ?)',
      [clientId, now]
    );
  }
}

// ==================== REVIEW REQUEST ====================

/**
 * Review request status
 */
export type ReviewRequestStatus = 'pending' | 'sent' | 'opened' | 'completed' | 'expired';

/**
 * Review request entity - Tracks sent review invitations
 */
export interface ReviewRequest extends Record<string, unknown> {
  id: string;
  storeId: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  appointmentId?: string;
  staffId?: string;
  staffName?: string;
  status: ReviewRequestStatus;
  sentVia: 'email' | 'sms' | 'both';
  sentAt?: string;
  openedAt?: string;
  completedAt?: string;
  reviewId?: string;
  reminderCount: number;
  lastReminderAt?: string;
  expiresAt: string;
  createdAt: string;
  syncStatus: string;
}

/**
 * Review request row - SQLite row format
 */
export interface ReviewRequestRow {
  id: string;
  store_id: string;
  client_id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  appointment_id: string | null;
  staff_id: string | null;
  staff_name: string | null;
  status: string;
  sent_via: string;
  sent_at: string | null;
  opened_at: string | null;
  completed_at: string | null;
  review_id: string | null;
  reminder_count: number;
  last_reminder_at: string | null;
  expires_at: string;
  created_at: string;
  sync_status: string;
}

const reviewRequestSchema: TableSchema = {
  tableName: 'review_requests',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    clientId: 'client_id',
    clientName: 'client_name',
    clientEmail: 'client_email',
    clientPhone: 'client_phone',
    appointmentId: 'appointment_id',
    staffId: 'staff_id',
    staffName: 'staff_name',
    status: 'status',
    sentVia: 'sent_via',
    sentAt: { column: 'sent_at', type: 'date' },
    openedAt: { column: 'opened_at', type: 'date' },
    completedAt: { column: 'completed_at', type: 'date' },
    reviewId: 'review_id',
    reminderCount: { column: 'reminder_count', type: 'number' },
    lastReminderAt: { column: 'last_reminder_at', type: 'date' },
    expiresAt: { column: 'expires_at', type: 'date' },
    createdAt: { column: 'created_at', type: 'date' },
    syncStatus: 'sync_status',
  },
};

/**
 * Review Request SQLite Service
 */
export class ReviewRequestSQLiteService extends BaseSQLiteService<ReviewRequest, ReviewRequestRow> {
  constructor(db: SQLiteAdapter) {
    super(db, reviewRequestSchema);
  }

  /**
   * Get review requests by status
   */
  async getByStatus(storeId: string, status: ReviewRequestStatus): Promise<ReviewRequest[]> {
    return this.findWhere(
      'store_id = ? AND status = ?',
      [storeId, status],
      'created_at DESC'
    );
  }

  /**
   * Get pending review requests
   */
  async getPending(storeId: string): Promise<ReviewRequest[]> {
    return this.getByStatus(storeId, 'pending');
  }

  /**
   * Get review requests for a client
   */
  async getByClient(clientId: string): Promise<ReviewRequest[]> {
    return this.findWhere('client_id = ?', [clientId], 'created_at DESC');
  }

  /**
   * Get review requests by store
   */
  async getByStore(storeId: string): Promise<ReviewRequest[]> {
    return this.findWhere('store_id = ?', [storeId], 'created_at DESC');
  }

  /**
   * Get requests needing reminder (sent but not completed, not at max reminders)
   */
  async getNeedingReminder(storeId: string, maxReminders: number = 3): Promise<ReviewRequest[]> {
    const now = toISOString(new Date());
    return this.findWhere(
      'store_id = ? AND status = ? AND reminder_count < ? AND expires_at > ?',
      [storeId, 'sent', maxReminders, now],
      'sent_at ASC'
    );
  }

  /**
   * Get expired requests for cleanup
   */
  async getExpired(storeId: string): Promise<ReviewRequest[]> {
    const now = toISOString(new Date());
    return this.findWhere(
      'store_id = ? AND status != ? AND expires_at < ?',
      [storeId, 'completed', now],
      'expires_at ASC'
    );
  }

  /**
   * Mark request as sent
   */
  async markSent(id: string): Promise<ReviewRequest | undefined> {
    return this.update(id, {
      status: 'sent',
      sentAt: toISOString(new Date()),
    } as Partial<ReviewRequest>);
  }

  /**
   * Mark request as opened
   */
  async markOpened(id: string): Promise<ReviewRequest | undefined> {
    return this.update(id, {
      status: 'opened',
      openedAt: toISOString(new Date()),
    } as Partial<ReviewRequest>);
  }

  /**
   * Mark request as completed
   */
  async markCompleted(id: string, reviewId: string): Promise<ReviewRequest | undefined> {
    return this.update(id, {
      status: 'completed',
      completedAt: toISOString(new Date()),
      reviewId,
    } as Partial<ReviewRequest>);
  }

  /**
   * Increment reminder count
   */
  async incrementReminderCount(id: string): Promise<ReviewRequest | undefined> {
    const current = await this.getById(id);
    if (!current) return undefined;
    return this.update(id, {
      reminderCount: (current.reminderCount || 0) + 1,
      lastReminderAt: toISOString(new Date()),
    } as Partial<ReviewRequest>);
  }
}

// ==================== CUSTOM SEGMENT ====================

/**
 * Segment comparison operator
 */
export type SegmentComparisonOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'in_list'
  | 'not_in_list';

/**
 * Segment filter condition
 */
export interface SegmentFilterCondition {
  field: string;
  operator: SegmentComparisonOperator;
  value: string | number | boolean | string[];
}

/**
 * Segment filter group with AND/OR logic
 */
export interface SegmentFilterGroup {
  logic: 'and' | 'or';
  conditions: (SegmentFilterCondition | SegmentFilterGroup)[];
}

/**
 * Custom segment entity - User-defined client segments
 */
export interface CustomSegment extends Record<string, unknown> {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  filters: SegmentFilterGroup;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  syncStatus: string;
}

/**
 * Custom segment row - SQLite row format
 */
export interface CustomSegmentRow {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  filters: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  sync_status: string;
}

const customSegmentSchema: TableSchema = {
  tableName: 'custom_segments',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    name: 'name',
    description: 'description',
    color: 'color',
    icon: 'icon',
    filters: { column: 'filters', type: 'json', defaultValue: { logic: 'and', conditions: [] } },
    isActive: { column: 'is_active', type: 'boolean' },
    createdAt: { column: 'created_at', type: 'date' },
    updatedAt: { column: 'updated_at', type: 'date' },
    createdBy: 'created_by',
    syncStatus: 'sync_status',
  },
};

/**
 * Custom Segment SQLite Service
 */
export class CustomSegmentSQLiteService extends BaseSQLiteService<CustomSegment, CustomSegmentRow> {
  constructor(db: SQLiteAdapter) {
    super(db, customSegmentSchema);
  }

  /**
   * Get all active custom segments for a store
   */
  async getActive(storeId: string): Promise<CustomSegment[]> {
    return this.findWhere(
      'store_id = ? AND is_active = 1',
      [storeId],
      'name ASC'
    );
  }

  /**
   * Get all segments for a store (including inactive)
   */
  async getByStore(storeId: string): Promise<CustomSegment[]> {
    return this.findWhere('store_id = ?', [storeId], 'name ASC');
  }

  /**
   * Get segment by name (for uniqueness check)
   */
  async getByName(storeId: string, name: string): Promise<CustomSegment | undefined> {
    return this.findOneWhere(
      'store_id = ? AND name = ?',
      [storeId, name]
    );
  }

  /**
   * Activate a segment
   */
  async activate(id: string): Promise<CustomSegment | undefined> {
    return this.update(id, { isActive: true } as Partial<CustomSegment>);
  }

  /**
   * Deactivate a segment
   */
  async deactivate(id: string): Promise<CustomSegment | undefined> {
    return this.update(id, { isActive: false } as Partial<CustomSegment>);
  }

  /**
   * Count active segments for a store
   */
  async countActive(storeId: string): Promise<number> {
    return this.countWhere('store_id = ? AND is_active = 1', [storeId]);
  }
}
