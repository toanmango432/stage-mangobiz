/**
 * Portfolio Type Adapters
 * Converts between Supabase rows (snake_case) and app types (camelCase)
 */

import type { PortfolioItemRow, PortfolioItemInsert } from '../types';
import type { PortfolioItem } from '@/types/performance';

/**
 * Convert Supabase row to app type
 */
export function toPortfolioItem(row: PortfolioItemRow): PortfolioItem {
  return {
    id: row.id,
    staffId: row.staff_id,
    storeId: row.store_id,
    imageUrl: row.image_url,
    beforeImageUrl: row.before_image_url || undefined,
    title: row.title || undefined,
    description: row.description || undefined,
    serviceName: row.service_name || undefined,
    tags: row.tags || [],
    isFeatured: row.is_featured,
    isBeforeAfter: row.is_before_after,
    createdAt: row.created_at,
    likes: row.likes,
  };
}

/**
 * Convert app type to Supabase insert format
 */
export function toPortfolioInsert(
  item: Omit<PortfolioItem, 'id' | 'createdAt' | 'likes'> & { storeId?: string }
): PortfolioItemInsert {
  return {
    staff_id: item.staffId,
    store_id: item.storeId || '',
    image_url: item.imageUrl,
    before_image_url: item.beforeImageUrl || null,
    title: item.title || null,
    description: item.description || null,
    service_name: item.serviceName || null,
    tags: item.tags || [],
    is_featured: item.isFeatured || false,
    is_before_after: item.isBeforeAfter || false,
  };
}

/**
 * Convert multiple rows to app types
 */
export function toPortfolioItems(rows: PortfolioItemRow[]): PortfolioItem[] {
  return rows.map(toPortfolioItem);
}
