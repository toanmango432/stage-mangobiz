/**
 * Portfolio Item Type Adapter
 *
 * Converts between Supabase PortfolioItemRow and app PortfolioItem types.
 */

import type { PortfolioItemRow, PortfolioItemInsert, PortfolioItemUpdate } from '../types';
import type { PortfolioItem } from '@/types/performance';

/**
 * Convert Supabase PortfolioItemRow to app PortfolioItem type
 */
export function toPortfolioItem(row: PortfolioItemRow): PortfolioItem {
  return {
    id: row.id,
    staffId: row.staff_id,
    imageUrl: row.image_url,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    title: row.title ?? undefined,
    description: row.description ?? undefined,
    serviceId: row.service_id ?? undefined,
    serviceName: row.service_name ?? undefined,
    tags: row.tags || [],
    isFeatured: row.is_featured,
    isBeforeAfter: row.is_before_after,
    beforeImageUrl: row.before_image_url ?? undefined,
    createdAt: row.created_at,
    likes: row.likes ?? 0,
  };
}

/**
 * Convert app PortfolioItem to Supabase PortfolioItemInsert
 */
export function toPortfolioInsert(
  item: Omit<PortfolioItem, 'id' | 'createdAt'>,
  storeId: string
): PortfolioItemInsert {
  return {
    store_id: storeId,
    staff_id: item.staffId,
    image_url: item.imageUrl,
    thumbnail_url: item.thumbnailUrl ?? null,
    title: item.title ?? null,
    description: item.description ?? null,
    service_id: item.serviceId ?? null,
    service_name: item.serviceName ?? null,
    tags: item.tags || [],
    is_featured: item.isFeatured ?? false,
    is_before_after: item.isBeforeAfter ?? false,
    before_image_url: item.beforeImageUrl ?? null,
    likes: item.likes ?? 0,
    sync_status: 'synced',
    sync_version: 1,
  };
}

/**
 * Convert partial PortfolioItem updates to Supabase PortfolioItemUpdate
 */
export function toPortfolioUpdate(updates: Partial<PortfolioItem>): PortfolioItemUpdate {
  const result: PortfolioItemUpdate = {};

  if (updates.imageUrl !== undefined) {
    result.image_url = updates.imageUrl;
  }
  if (updates.thumbnailUrl !== undefined) {
    result.thumbnail_url = updates.thumbnailUrl ?? null;
  }
  if (updates.title !== undefined) {
    result.title = updates.title ?? null;
  }
  if (updates.description !== undefined) {
    result.description = updates.description ?? null;
  }
  if (updates.serviceId !== undefined) {
    result.service_id = updates.serviceId ?? null;
  }
  if (updates.serviceName !== undefined) {
    result.service_name = updates.serviceName ?? null;
  }
  if (updates.tags !== undefined) {
    result.tags = updates.tags;
  }
  if (updates.isFeatured !== undefined) {
    result.is_featured = updates.isFeatured;
  }
  if (updates.isBeforeAfter !== undefined) {
    result.is_before_after = updates.isBeforeAfter;
  }
  if (updates.beforeImageUrl !== undefined) {
    result.before_image_url = updates.beforeImageUrl ?? null;
  }
  if (updates.likes !== undefined) {
    result.likes = updates.likes;
  }

  return result;
}

/**
 * Convert array of PortfolioItemRows to PortfolioItems
 */
export function toPortfolioItems(rows: PortfolioItemRow[]): PortfolioItem[] {
  return rows.map(toPortfolioItem);
}
