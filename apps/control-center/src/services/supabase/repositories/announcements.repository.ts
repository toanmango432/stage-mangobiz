/**
 * Announcements Repository
 * Handles CRUD operations for announcement management
 */

import { BaseRepository, QueryOptions, APIError } from './base.repository';
import { supabase, withCircuitBreaker } from '../client';
import {
  Announcement,
  AnnouncementStatus,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from '@/types/announcement';

// Database row type (snake_case)
interface AnnouncementRow {
  id: string;
  content: any;
  category: string;
  severity: string;
  priority: string;
  channels: string[];
  channel_config?: any;
  targeting: any;
  behavior: any;
  status: string;
  stats: any;
  tags?: string[];
  internal_notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  archived_at?: string;
}

// Convert DB row to app type
function toAnnouncement(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    content: row.content,
    category: row.category as Announcement['category'],
    severity: row.severity as Announcement['severity'],
    priority: row.priority as Announcement['priority'],
    channels: row.channels as Announcement['channels'],
    channelConfig: row.channel_config,
    targeting: row.targeting,
    behavior: row.behavior,
    status: row.status as AnnouncementStatus,
    stats: row.stats || {
      totalViews: 0,
      uniqueViews: 0,
      dismissals: 0,
      acknowledgments: 0,
      ctaClicks: {},
      emailsSent: 0,
      emailsOpened: 0,
      emailsClicked: 0,
    },
    tags: row.tags,
    internalNotes: row.internal_notes,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    publishedAt: row.published_at ? new Date(row.published_at) : undefined,
    archivedAt: row.archived_at ? new Date(row.archived_at) : undefined,
  };
}

// Convert input to DB row
function toRow(input: CreateAnnouncementInput | UpdateAnnouncementInput): Partial<AnnouncementRow> {
  const row: Partial<AnnouncementRow> = {};
  if ('content' in input && input.content !== undefined) row.content = input.content;
  if ('category' in input && input.category !== undefined) row.category = input.category;
  if ('severity' in input && input.severity !== undefined) row.severity = input.severity;
  if ('priority' in input && input.priority !== undefined) row.priority = input.priority;
  if ('channels' in input && input.channels !== undefined) row.channels = input.channels;
  if ('channelConfig' in input && input.channelConfig !== undefined) row.channel_config = input.channelConfig;
  if ('targeting' in input && input.targeting !== undefined) row.targeting = input.targeting;
  if ('behavior' in input && input.behavior !== undefined) row.behavior = input.behavior;
  if ('status' in input && input.status !== undefined) row.status = input.status;
  if ('tags' in input && input.tags !== undefined) row.tags = input.tags;
  if ('internalNotes' in input && input.internalNotes !== undefined) row.internal_notes = input.internalNotes;
  return row;
}

class AnnouncementsRepository extends BaseRepository<AnnouncementRow> {
  constructor() {
    super('announcements');
  }

  /**
   * Get all announcements
   */
  async getAll(options?: QueryOptions): Promise<Announcement[]> {
    const result = await this.findAll({
      orderBy: 'created_at',
      orderDirection: 'desc',
      ...options,
    });
    return result.data.map(toAnnouncement);
  }

  /**
   * Get announcement by ID
   */
  async getById(id: string): Promise<Announcement | null> {
    const result = await this.findById(id);
    return result.data ? toAnnouncement(result.data) : null;
  }

  /**
   * Get active announcements
   */
  async getActive(options?: QueryOptions): Promise<Announcement[]> {
    const result = await this.findByField('status', 'active', {
      orderBy: 'priority',
      orderDirection: 'desc',
      ...options,
    });
    return result.data.map(toAnnouncement);
  }

  /**
   * Get announcements by status
   */
  async getByStatus(status: AnnouncementStatus, options?: QueryOptions): Promise<Announcement[]> {
    const result = await this.findByField('status', status, {
      orderBy: 'created_at',
      orderDirection: 'desc',
      ...options,
    });
    return result.data.map(toAnnouncement);
  }

  /**
   * Get announcements by category
   */
  async getByCategory(category: Announcement['category'], options?: QueryOptions): Promise<Announcement[]> {
    const result = await this.findByField('category', category, {
      orderBy: 'created_at',
      orderDirection: 'desc',
      ...options,
    });
    return result.data.map(toAnnouncement);
  }

  /**
   * Create a new announcement
   */
  async createAnnouncement(input: CreateAnnouncementInput, createdBy: string): Promise<Announcement> {
    const data = {
      ...toRow(input),
      created_by: createdBy,
      status: 'draft',
      stats: {
        totalViews: 0,
        uniqueViews: 0,
        dismissals: 0,
        acknowledgments: 0,
        ctaClicks: {},
        emailsSent: 0,
        emailsOpened: 0,
        emailsClicked: 0,
      },
    };
    const result = await this.create(data as any);
    return toAnnouncement(result.data);
  }

  /**
   * Update an announcement
   */
  async updateAnnouncement(id: string, input: UpdateAnnouncementInput): Promise<Announcement> {
    const result = await this.update(id, toRow(input) as any);
    return toAnnouncement(result.data);
  }

  /**
   * Publish an announcement
   */
  async publish(id: string): Promise<Announcement> {
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
      return toAnnouncement(data as AnnouncementRow);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Unpublish (pause) an announcement
   */
  async unpublish(id: string): Promise<Announcement> {
    return this.updateAnnouncement(id, { status: 'paused' });
  }

  /**
   * Archive an announcement
   */
  async archive(id: string): Promise<Announcement> {
    try {
      const { data, error } = await withCircuitBreaker(() =>
        supabase
          .from(this.tableName)
          .update({
            status: 'archived',
            archived_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single()
      );

      if (error) throw APIError.fromSupabaseError(error);
      return toAnnouncement(data as AnnouncementRow);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Update announcement stats
   */
  async updateStats(id: string, stats: Partial<Announcement['stats']>): Promise<void> {
    try {
      const current = await this.getById(id);
      if (!current) throw APIError.notFound('Announcement', id);

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
        expired: 0,
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
   * Search announcements
   */
  async search(searchTerm: string, options?: QueryOptions): Promise<Announcement[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .or(`content->>title.ilike.%${searchTerm}%,content->>body.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await withCircuitBreaker(() => query);

      if (error) throw APIError.fromSupabaseError(error);
      return (data || []).map(toAnnouncement);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }
}

export const announcementsRepository = new AnnouncementsRepository();
export { AnnouncementsRepository };
