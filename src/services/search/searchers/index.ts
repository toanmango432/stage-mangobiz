/**
 * Entity Searchers
 *
 * Transform IndexedEntity objects into SearchResult objects with:
 * - Entity-specific formatting
 * - Quick actions
 * - Status badges
 */

import type {
  SearchEntityType,
  SearchResult,
  QuickAction,
  IndexedEntity,
} from '../types';

// ============================================================================
// Quick Action Factories
// ============================================================================

/**
 * Create quick actions for a client
 */
export function getClientActions(
  clientId: string,
  clientData: Record<string, unknown>
): QuickAction[] {
  const phone = clientData.phone as string | undefined;

  return [
    {
      id: 'book',
      label: 'Book',
      icon: 'Calendar',
      variant: 'primary',
      action: () => {
        // Navigate to booking with client pre-selected
        window.dispatchEvent(
          new CustomEvent('global-search-action', {
            detail: {
              action: 'book',
              entityType: 'client',
              entityId: clientId,
              clientData: {
                id: clientId,
                name: clientData.title as string,
                phone: clientData.phone as string,
                email: clientData.email as string,
              },
            },
          })
        );
      },
    },
    ...(phone
      ? [
          {
            id: 'call',
            label: 'Call',
            icon: 'Phone',
            action: () => {
              window.location.href = `tel:${phone}`;
            },
          } as QuickAction,
        ]
      : []),
    {
      id: 'view',
      label: 'View',
      icon: 'User',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('global-search-action', {
            detail: { action: 'view', entityType: 'client', entityId: clientId },
          })
        );
      },
    },
    {
      id: 'ticket',
      label: 'New Ticket',
      icon: 'Plus',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('global-search-action', {
            detail: { action: 'create-ticket', entityType: 'client', entityId: clientId },
          })
        );
      },
    },
  ];
}

/**
 * Create quick actions for staff
 */
export function getStaffActions(
  staffId: string,
  _staffData: Record<string, unknown>
): QuickAction[] {
  return [
    {
      id: 'schedule',
      label: 'Schedule',
      icon: 'Calendar',
      variant: 'primary',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('global-search-action', {
            detail: { action: 'view-schedule', entityType: 'staff', entityId: staffId },
          })
        );
      },
    },
    {
      id: 'assign',
      label: 'Assign',
      icon: 'UserPlus',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('global-search-action', {
            detail: { action: 'assign', entityType: 'staff', entityId: staffId },
          })
        );
      },
    },
    {
      id: 'view',
      label: 'Profile',
      icon: 'User',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('global-search-action', {
            detail: { action: 'view', entityType: 'staff', entityId: staffId },
          })
        );
      },
    },
  ];
}

/**
 * Create quick actions for service
 */
export function getServiceActions(
  serviceId: string,
  _serviceData: Record<string, unknown>
): QuickAction[] {
  return [
    {
      id: 'book',
      label: 'Book',
      icon: 'Calendar',
      variant: 'primary',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('global-search-action', {
            detail: { action: 'book', entityType: 'service', entityId: serviceId },
          })
        );
      },
    },
    {
      id: 'add-to-ticket',
      label: 'Add to Ticket',
      icon: 'Plus',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('global-search-action', {
            detail: { action: 'add-to-ticket', entityType: 'service', entityId: serviceId },
          })
        );
      },
    },
    {
      id: 'view',
      label: 'Details',
      icon: 'Eye',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('global-search-action', {
            detail: { action: 'view', entityType: 'service', entityId: serviceId },
          })
        );
      },
    },
  ];
}

/**
 * Create quick actions for appointment
 */
export function getAppointmentActions(
  appointmentId: string,
  appointmentData: Record<string, unknown>
): QuickAction[] {
  const status = appointmentData.status as string | undefined;
  const canCheckIn = status === 'scheduled' || status === 'waiting';

  return [
    ...(canCheckIn
      ? [
          {
            id: 'check-in',
            label: 'Check In',
            icon: 'CheckCircle',
            variant: 'primary',
            action: () => {
              window.dispatchEvent(
                new CustomEvent('global-search-action', {
                  detail: { action: 'check-in', entityType: 'appointment', entityId: appointmentId },
                })
              );
            },
          } as QuickAction,
        ]
      : []),
    {
      id: 'edit',
      label: 'Edit',
      icon: 'Pencil',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('global-search-action', {
            detail: { action: 'edit', entityType: 'appointment', entityId: appointmentId },
          })
        );
      },
    },
    {
      id: 'cancel',
      label: 'Cancel',
      icon: 'X',
      variant: 'danger',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('global-search-action', {
            detail: { action: 'cancel', entityType: 'appointment', entityId: appointmentId },
          })
        );
      },
    },
    {
      id: 'ticket',
      label: 'Create Ticket',
      icon: 'Plus',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('global-search-action', {
            detail: { action: 'create-ticket', entityType: 'appointment', entityId: appointmentId },
          })
        );
      },
    },
  ];
}

/**
 * Create quick actions for ticket
 */
export function getTicketActions(
  ticketId: string,
  ticketData: Record<string, unknown>
): QuickAction[] {
  const status = ticketData.status as string | undefined;
  const canCheckout = status === 'pending' || status === 'in-service';

  return [
    {
      id: 'view',
      label: 'View',
      icon: 'Eye',
      variant: 'primary',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('global-search-action', {
            detail: { action: 'view', entityType: 'ticket', entityId: ticketId },
          })
        );
      },
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: 'Pencil',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('global-search-action', {
            detail: { action: 'edit', entityType: 'ticket', entityId: ticketId },
          })
        );
      },
    },
    ...(canCheckout
      ? [
          {
            id: 'checkout',
            label: 'Checkout',
            icon: 'CreditCard',
            action: () => {
              window.dispatchEvent(
                new CustomEvent('global-search-action', {
                  detail: { action: 'checkout', entityType: 'ticket', entityId: ticketId },
                })
              );
            },
          } as QuickAction,
        ]
      : []),
    {
      id: 'print',
      label: 'Print',
      icon: 'Printer',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('global-search-action', {
            detail: { action: 'print', entityType: 'ticket', entityId: ticketId },
          })
        );
      },
    },
  ];
}

/**
 * Create quick actions for transaction
 */
export function getTransactionActions(
  transactionId: string,
  transactionData: Record<string, unknown>
): QuickAction[] {
  const status = transactionData.status as string | undefined;
  const canRefund = status === 'completed';

  return [
    {
      id: 'view',
      label: 'Receipt',
      icon: 'Eye',
      variant: 'primary',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('global-search-action', {
            detail: { action: 'view-receipt', entityType: 'transaction', entityId: transactionId },
          })
        );
      },
    },
    {
      id: 'print',
      label: 'Print',
      icon: 'Printer',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('global-search-action', {
            detail: { action: 'print', entityType: 'transaction', entityId: transactionId },
          })
        );
      },
    },
    ...(canRefund
      ? [
          {
            id: 'refund',
            label: 'Refund',
            icon: 'RefreshCcw',
            variant: 'danger',
            action: () => {
              window.dispatchEvent(
                new CustomEvent('global-search-action', {
                  detail: { action: 'refund', entityType: 'transaction', entityId: transactionId },
                })
              );
            },
          } as QuickAction,
        ]
      : []),
  ];
}

/**
 * Create quick actions for settings
 */
export function getSettingActions(
  settingId: string,
  settingData: Record<string, unknown>
): QuickAction[] {
  const path = settingData.status as string | undefined; // path stored in status field

  return [
    {
      id: 'open',
      label: 'Open',
      icon: 'Settings',
      variant: 'primary',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('global-search-action', {
            detail: {
              action: 'navigate',
              entityType: 'setting',
              entityId: settingId,
              path: path || '/settings',
            },
          })
        );
      },
    },
  ];
}

/**
 * Create quick actions for pages (navigation)
 */
export function getPageActions(
  pageId: string,
  pageData: Record<string, unknown>
): QuickAction[] {
  const targetPage = pageData.status as string | undefined; // page id stored in status field

  return [
    {
      id: 'go',
      label: 'Go',
      icon: 'ArrowRight',
      variant: 'primary',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('global-search-action', {
            detail: {
              action: 'navigate-page',
              entityType: 'page',
              entityId: pageId,
              page: targetPage || pageId,
            },
          })
        );
      },
    },
  ];
}

// ============================================================================
// Entity Result Transformer
// ============================================================================

/**
 * Get quick actions for an entity type
 */
function getQuickActions(
  type: SearchEntityType,
  id: string,
  displayData: Record<string, unknown>
): QuickAction[] {
  switch (type) {
    case 'client':
      return getClientActions(id, displayData);
    case 'staff':
      return getStaffActions(id, displayData);
    case 'service':
      return getServiceActions(id, displayData);
    case 'appointment':
      return getAppointmentActions(id, displayData);
    case 'ticket':
      return getTicketActions(id, displayData);
    case 'transaction':
      return getTransactionActions(id, displayData);
    case 'setting':
      return getSettingActions(id, displayData);
    case 'page':
      return getPageActions(id, displayData);
    case 'giftcard':
      // Gift cards deferred - no data layer yet
      return [];
    default:
      return [];
  }
}

/**
 * Transform an IndexedEntity into a SearchResult
 *
 * @param indexed - Indexed entity from search index
 * @param score - Match score
 * @param matchedField - Which field matched the query
 * @returns Search result ready for display
 */
export function toSearchResult(
  indexed: IndexedEntity,
  score: number,
  matchedField: string
): SearchResult {
  return {
    id: indexed.id,
    type: indexed.type,
    title: indexed.displayData.title,
    subtitle: indexed.displayData.subtitle,
    avatar: indexed.displayData.avatar,
    badges: indexed.displayData.badges,
    score,
    matchedField,
    actions: getQuickActions(indexed.type, indexed.id, indexed.displayData as unknown as Record<string, unknown>),
    data: indexed.displayData as unknown as Record<string, unknown>,
  };
}

/**
 * Group search results by entity type
 */
export function groupResultsByType(
  results: SearchResult[]
): Map<SearchEntityType, SearchResult[]> {
  const grouped = new Map<SearchEntityType, SearchResult[]>();

  for (const result of results) {
    const existing = grouped.get(result.type) || [];
    existing.push(result);
    grouped.set(result.type, existing);
  }

  return grouped;
}

/**
 * Sort results within each group by score
 */
export function sortResultsWithinGroups(
  grouped: Map<SearchEntityType, SearchResult[]>
): Map<SearchEntityType, SearchResult[]> {
  for (const [, results] of grouped) {
    results.sort((a, b) => b.score - a.score);
  }
  return grouped;
}
