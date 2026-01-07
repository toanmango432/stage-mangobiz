/**
 * Surveys Repository
 * Handles CRUD operations for survey and response management
 */

import { BaseRepository, QueryOptions, APIError } from './base.repository';
import { supabase, withCircuitBreaker } from '../client';
import {
  Survey,
  SurveyStatus,
  SurveyResponse,
  CreateSurveyInput,
  UpdateSurveyInput,
  CreateSurveyResponseInput,
  createEmptySurveyStats,
  createDefaultAppearance,
  createDefaultThankYou,
} from '@/types/survey';

// Database row type (snake_case)
interface SurveyRow {
  id: string;
  name: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  questions: any[];
  targeting: any;
  trigger: any;
  appearance: any;
  thank_you: any;
  starts_at?: string;
  ends_at?: string;
  max_responses?: number;
  max_responses_per_user?: number;
  stats: any;
  tags?: string[];
  internal_notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  closed_at?: string;
}

interface SurveyResponseRow {
  id: string;
  survey_id: string;
  tenant_id: string;
  store_id?: string;
  user_id?: string;
  answers: any[];
  nps_score?: number;
  csat_score?: number;
  ces_score?: number;
  sentiment?: string;
  sentiment_score?: number;
  completed_at: string;
  started_at: string;
  duration_seconds: number;
  device_type?: string;
  source?: string;
  follow_up_requested?: boolean;
  follow_up_status?: string;
  follow_up_notes?: string;
}

// Convert DB row to app type
function toSurvey(row: SurveyRow): Survey {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    description: row.description,
    type: row.type as Survey['type'],
    status: row.status as SurveyStatus,
    questions: row.questions || [],
    targeting: row.targeting,
    trigger: row.trigger,
    appearance: row.appearance || createDefaultAppearance(),
    thankYou: row.thank_you || createDefaultThankYou(),
    startsAt: row.starts_at ? new Date(row.starts_at) : undefined,
    endsAt: row.ends_at ? new Date(row.ends_at) : undefined,
    maxResponses: row.max_responses,
    maxResponsesPerUser: row.max_responses_per_user,
    stats: row.stats || createEmptySurveyStats(),
    tags: row.tags,
    internalNotes: row.internal_notes,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    publishedAt: row.published_at ? new Date(row.published_at) : undefined,
    closedAt: row.closed_at ? new Date(row.closed_at) : undefined,
  };
}

function toSurveyResponse(row: SurveyResponseRow): SurveyResponse {
  return {
    id: row.id,
    surveyId: row.survey_id,
    tenantId: row.tenant_id,
    storeId: row.store_id,
    userId: row.user_id,
    answers: row.answers || [],
    npsScore: row.nps_score,
    csatScore: row.csat_score,
    cesScore: row.ces_score,
    sentiment: row.sentiment as SurveyResponse['sentiment'],
    sentimentScore: row.sentiment_score,
    completedAt: new Date(row.completed_at),
    startedAt: new Date(row.started_at),
    durationSeconds: row.duration_seconds,
    deviceType: row.device_type as SurveyResponse['deviceType'],
    source: row.source,
    followUpRequested: row.follow_up_requested,
    followUpStatus: row.follow_up_status as SurveyResponse['followUpStatus'],
    followUpNotes: row.follow_up_notes,
  };
}

// Convert input to DB row
function toRow(input: CreateSurveyInput | UpdateSurveyInput): Partial<SurveyRow> {
  const row: Partial<SurveyRow> = {};
  if ('name' in input && input.name !== undefined) row.name = input.name;
  if ('title' in input && input.title !== undefined) row.title = input.title;
  if ('description' in input && input.description !== undefined) row.description = input.description;
  if ('type' in input && input.type !== undefined) row.type = input.type;
  if ('status' in input && input.status !== undefined) row.status = input.status;
  if ('questions' in input && input.questions !== undefined) row.questions = input.questions;
  if ('targeting' in input && input.targeting !== undefined) row.targeting = input.targeting;
  if ('trigger' in input && input.trigger !== undefined) row.trigger = input.trigger;
  if ('appearance' in input && input.appearance !== undefined) row.appearance = input.appearance;
  if ('thankYou' in input && input.thankYou !== undefined) row.thank_you = input.thankYou;
  if ('startsAt' in input && input.startsAt !== undefined) row.starts_at = input.startsAt?.toISOString();
  if ('endsAt' in input && input.endsAt !== undefined) row.ends_at = input.endsAt?.toISOString();
  if ('maxResponses' in input && input.maxResponses !== undefined) row.max_responses = input.maxResponses;
  if ('maxResponsesPerUser' in input && input.maxResponsesPerUser !== undefined) row.max_responses_per_user = input.maxResponsesPerUser;
  if ('tags' in input && input.tags !== undefined) row.tags = input.tags;
  if ('internalNotes' in input && input.internalNotes !== undefined) row.internal_notes = input.internalNotes;
  return row;
}

class SurveysRepository extends BaseRepository<SurveyRow> {
  constructor() {
    super('surveys');
  }

  /**
   * Get all surveys
   */
  async getAll(options?: QueryOptions): Promise<Survey[]> {
    const result = await this.findAll({
      orderBy: 'created_at',
      orderDirection: 'desc',
      ...options,
    });
    return result.data.map(toSurvey);
  }

  /**
   * Get survey by ID
   */
  async getById(id: string): Promise<Survey | null> {
    const result = await this.findById(id);
    return result.data ? toSurvey(result.data) : null;
  }

  /**
   * Get active surveys
   */
  async getActive(options?: QueryOptions): Promise<Survey[]> {
    const result = await this.findByField('status', 'active', {
      orderBy: 'created_at',
      orderDirection: 'desc',
      ...options,
    });
    return result.data.map(toSurvey);
  }

  /**
   * Get surveys by status
   */
  async getByStatus(status: SurveyStatus, options?: QueryOptions): Promise<Survey[]> {
    const result = await this.findByField('status', status, {
      orderBy: 'created_at',
      orderDirection: 'desc',
      ...options,
    });
    return result.data.map(toSurvey);
  }

  /**
   * Get surveys by type
   */
  async getByType(type: Survey['type'], options?: QueryOptions): Promise<Survey[]> {
    const result = await this.findByField('type', type, {
      orderBy: 'created_at',
      orderDirection: 'desc',
      ...options,
    });
    return result.data.map(toSurvey);
  }

  /**
   * Create a new survey
   */
  async createSurvey(input: CreateSurveyInput, createdBy: string): Promise<Survey> {
    const questionsWithIds = (input.questions || []).map((q, i) => ({
      ...q,
      id: `q_${Date.now()}_${i}`,
      order: i,
    }));

    const data = {
      ...toRow(input),
      questions: questionsWithIds,
      created_by: createdBy,
      status: 'draft',
      stats: createEmptySurveyStats(),
      appearance: input.appearance || createDefaultAppearance(),
      thank_you: input.thankYou || createDefaultThankYou(),
    };
    const result = await this.create(data as any);
    return toSurvey(result.data);
  }

  /**
   * Update a survey
   */
  async updateSurvey(id: string, input: UpdateSurveyInput): Promise<Survey> {
    const result = await this.update(id, toRow(input) as any);
    return toSurvey(result.data);
  }

  /**
   * Publish a survey
   */
  async publish(id: string): Promise<Survey> {
    try {
      const { data, error } = await withCircuitBreaker(() =>
        supabase
          .from(this.tableName)
          .update({
            status: 'active',
            published_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single()
      );

      if (error) throw APIError.fromSupabaseError(error);
      return toSurvey(data as SurveyRow);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Pause a survey
   */
  async pause(id: string): Promise<Survey> {
    return this.updateSurvey(id, { status: 'paused' });
  }

  /**
   * Close a survey
   */
  async close(id: string): Promise<Survey> {
    try {
      const { data, error } = await withCircuitBreaker(() =>
        supabase
          .from(this.tableName)
          .update({
            status: 'closed',
            closed_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single()
      );

      if (error) throw APIError.fromSupabaseError(error);
      return toSurvey(data as SurveyRow);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get responses for a survey
   */
  async getResponses(surveyId: string, options?: QueryOptions): Promise<SurveyResponse[]> {
    try {
      let query = supabase
        .from('survey_responses')
        .select('*')
        .eq('survey_id', surveyId)
        .order('completed_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await withCircuitBreaker(() => query);

      if (error) throw APIError.fromSupabaseError(error);
      return (data || []).map(toSurveyResponse);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Create a survey response
   */
  async createResponse(input: CreateSurveyResponseInput): Promise<SurveyResponse> {
    try {
      const completedAt = new Date();
      const durationSeconds = Math.floor((completedAt.getTime() - input.startedAt.getTime()) / 1000);

      const responseData = {
        survey_id: input.surveyId,
        tenant_id: input.tenantId,
        store_id: input.storeId,
        user_id: input.userId,
        answers: input.answers,
        completed_at: completedAt.toISOString(),
        started_at: input.startedAt.toISOString(),
        duration_seconds: durationSeconds,
        device_type: input.deviceType,
        source: input.source,
      };

      const { data, error } = await withCircuitBreaker(() =>
        supabase.from('survey_responses').insert(responseData).select().single()
      );

      if (error) throw APIError.fromSupabaseError(error);
      return toSurveyResponse(data as SurveyResponseRow);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get count by status
   */
  async getCountByStatus(): Promise<Record<string, number>> {
    try {
      const { data, error } = await withCircuitBreaker(() =>
        supabase.from(this.tableName).select('status')
      );

      if (error) throw APIError.fromSupabaseError(error);

      const counts: Record<string, number> = {
        draft: 0,
        scheduled: 0,
        active: 0,
        paused: 0,
        closed: 0,
        archived: 0,
      };
      data?.forEach((row: any) => {
        counts[row.status] = (counts[row.status] || 0) + 1;
      });

      return counts;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Update survey stats
   */
  async updateStats(id: string, stats: Partial<Survey['stats']>): Promise<void> {
    try {
      const current = await this.getById(id);
      if (!current) throw APIError.notFound('Survey', id);

      const updatedStats = { ...current.stats, ...stats };

      const { error } = await withCircuitBreaker(() =>
        supabase
          .from(this.tableName)
          .update({ stats: updatedStats })
          .eq('id', id)
      );

      if (error) throw APIError.fromSupabaseError(error);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }
}

export const surveysRepository = new SurveysRepository();
export { SurveysRepository };
