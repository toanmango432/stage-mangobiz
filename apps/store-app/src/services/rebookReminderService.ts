/**
 * Rebook Reminder Service
 * Calculates recommended next booking dates based on completed services
 *
 * This service works with MenuService.rebookReminderDays to suggest
 * when clients should return for repeat services (e.g., hair color every 6 weeks)
 */

import { MenuService } from '../types/catalog';
import { Client } from '../types/client';

/**
 * RebookSuggestion - Represents a suggested next booking for a client
 */
export interface RebookSuggestion {
  id: string;
  clientId: string;
  serviceId: string;
  serviceName: string;
  completedAt: Date;
  suggestedDate: Date;
  rebookDays: number;
  daysRemaining: number;
  isOverdue: boolean;
  confidence: number; // 0-100 based on service type and client history
  notificationSent: boolean;
  notificationSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Calculate recommended rebook date for a completed service
 *
 * @param service - The completed service
 * @param completedAt - When the service was completed
 * @returns The recommended next booking date, or null if service has no rebook reminder
 *
 * @example
 * const service = { name: "Hair Color", rebookReminderDays: 42 };
 * const completed = new Date("2026-01-01");
 * const nextDate = calculateRebookDate(service, completed);
 * // Returns: Date("2026-02-12") - 42 days after completion
 */
export function calculateRebookDate(
  service: MenuService | Pick<MenuService, 'rebookReminderDays'>,
  completedAt: Date
): Date | null {
  // Service must have rebookReminderDays configured
  if (!service.rebookReminderDays || service.rebookReminderDays <= 0) {
    return null;
  }

  const nextDate = new Date(completedAt);
  nextDate.setDate(nextDate.getDate() + service.rebookReminderDays);

  return nextDate;
}

/**
 * Store a rebook suggestion in client history
 *
 * This creates a record that can be used for:
 * - Automatic reminder notifications
 * - Client dashboard "suggested appointments"
 * - Analytics on rebooking rates
 *
 * @param clientId - Client UUID
 * @param suggestion - The rebook suggestion to store
 * @returns Promise resolving when stored
 *
 * @example
 * const suggestion = {
 *   id: "uuid",
 *   clientId: "client-uuid",
 *   serviceId: "service-uuid",
 *   serviceName: "Hair Color",
 *   completedAt: new Date("2026-01-01"),
 *   suggestedDate: new Date("2026-02-12"),
 *   rebookDays: 42,
 *   daysRemaining: 7,
 *   isOverdue: false,
 *   confidence: 85,
 *   notificationSent: false,
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 * await storeRebookSuggestion("client-uuid", suggestion);
 */
export async function storeRebookSuggestion(
  clientId: string,
  suggestion: RebookSuggestion
): Promise<void> {
  // TODO: Implement storage when client history table is available
  // For now, this is a placeholder that documents the interface

  // Future implementation will:
  // 1. Store in client_rebook_suggestions table (to be created)
  // 2. Trigger notification scheduler if within notification window
  // 3. Update client's "next suggested appointment" field

  console.log('Rebook suggestion stored (placeholder):', {
    clientId,
    suggestionId: suggestion.id,
    serviceId: suggestion.serviceId,
    suggestedDate: suggestion.suggestedDate,
  });

  // Placeholder: Store in localStorage for demo purposes
  try {
    const key = `rebook_suggestions_${clientId}`;
    const existing = localStorage.getItem(key);
    const suggestions: RebookSuggestion[] = existing ? JSON.parse(existing) : [];

    // Remove any existing suggestion for the same service
    const filtered = suggestions.filter(s => s.serviceId !== suggestion.serviceId);
    filtered.push(suggestion);

    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to store rebook suggestion:', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Create a rebook suggestion from a completed service
 *
 * Helper function that combines calculateRebookDate with suggestion metadata
 *
 * @param client - The client who received the service
 * @param service - The completed service
 * @param completedAt - When the service was completed
 * @returns RebookSuggestion or null if service has no reminder configured
 */
export function createRebookSuggestion(
  client: Client,
  service: MenuService,
  completedAt: Date
): RebookSuggestion | null {
  const suggestedDate = calculateRebookDate(service, completedAt);

  if (!suggestedDate) {
    return null;
  }

  const now = new Date();
  const daysRemaining = Math.floor(
    (suggestedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate confidence based on service type
  // Services with rebookReminderDays are usually recurring (high confidence)
  const confidence = Math.min(100, 70 + (service.rebookReminderDays || 0) / 2);

  return {
    id: crypto.randomUUID(),
    clientId: client.id,
    serviceId: service.id,
    serviceName: service.name,
    completedAt,
    suggestedDate,
    rebookDays: service.rebookReminderDays || 0,
    daysRemaining,
    isOverdue: daysRemaining < 0,
    confidence,
    notificationSent: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get rebook suggestions for a client
 *
 * @param clientId - Client UUID
 * @returns Array of rebook suggestions
 */
export async function getRebookSuggestions(
  clientId: string
): Promise<RebookSuggestion[]> {
  // TODO: Query client_rebook_suggestions table when available

  // Placeholder: Read from localStorage
  try {
    const key = `rebook_suggestions_${clientId}`;
    const data = localStorage.getItem(key);
    if (!data) return [];

    const suggestions: RebookSuggestion[] = JSON.parse(data);

    // Recalculate daysRemaining and isOverdue
    const now = new Date();
    return suggestions.map(s => ({
      ...s,
      completedAt: new Date(s.completedAt),
      suggestedDate: new Date(s.suggestedDate),
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
      notificationSentAt: s.notificationSentAt ? new Date(s.notificationSentAt) : undefined,
      daysRemaining: Math.floor(
        (new Date(s.suggestedDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
      isOverdue: new Date(s.suggestedDate) < now,
    }));
  } catch (error) {
    console.error('Failed to get rebook suggestions:', error);
    return [];
  }
}

/**
 * Mark a rebook suggestion as notification sent
 *
 * @param suggestionId - RebookSuggestion UUID
 */
export async function markNotificationSent(suggestionId: string): Promise<void> {
  // TODO: Update client_rebook_suggestions table when available

  // Placeholder: Update in localStorage
  try {
    // Search all clients' suggestions (inefficient but works for demo)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('rebook_suggestions_')) {
        const data = localStorage.getItem(key);
        if (data) {
          const suggestions: RebookSuggestion[] = JSON.parse(data);
          const updated = suggestions.map(s =>
            s.id === suggestionId
              ? { ...s, notificationSent: true, notificationSentAt: new Date(), updatedAt: new Date() }
              : s
          );

          if (suggestions.length !== updated.filter(s => s.id === suggestionId).length) {
            // Found and updated
            localStorage.setItem(key, JSON.stringify(updated));
            return;
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to mark notification sent:', error);
  }
}

/**
 * Get all rebook suggestions due within N days
 *
 * Useful for scheduling reminder notifications
 *
 * @param daysAhead - How many days ahead to look (default: 7)
 * @returns Array of suggestions due within the window
 */
export async function getSuggestionsDueWithin(
  daysAhead = 7
): Promise<RebookSuggestion[]> {
  const allSuggestions: RebookSuggestion[] = [];

  // Collect from all clients (inefficient but works for demo)
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('rebook_suggestions_')) {
        const clientId = key.replace('rebook_suggestions_', '');
        const clientSuggestions = await getRebookSuggestions(clientId);
        allSuggestions.push(...clientSuggestions);
      }
    }
  } catch (error) {
    console.error('Failed to get suggestions due within:', error);
  }

  const now = new Date();
  const cutoffDate = new Date(now);
  cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

  return allSuggestions.filter(s =>
    s.suggestedDate >= now &&
    s.suggestedDate <= cutoffDate &&
    !s.notificationSent
  );
}
