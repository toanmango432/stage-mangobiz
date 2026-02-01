// Event Schema for Announcements
import type { Announcement } from '@/types/promotion';

export interface EventSchemaOptions {
  announcement: Announcement;
  businessName: string;
  url: string;
}

/**
 * Generate Event JSON-LD schema for announcements
 */
export function generateEventSchema(options: EventSchemaOptions) {
  const { announcement, businessName, url } = options;
  
  // Only generate event schema for event-type announcements
  if (announcement.category !== 'events') {
    return null;
  }
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${url}/updates/${announcement.id}#event`,
    name: announcement.title,
    description: announcement.content,
    startDate: announcement.startsAt,
    endDate: announcement.endsAt,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: businessName,
      url
    },
    organizer: {
      '@type': 'Organization',
      name: businessName,
      url
    }
  };
}

/**
 * Generate collection of events
 */
export function generateEventListSchema(
  announcements: Announcement[],
  businessName: string,
  url: string
) {
  const events = announcements
    .filter(a => a.category === 'events')
    .map(announcement => generateEventSchema({ announcement, businessName, url }))
    .filter(Boolean);
  
  if (events.length === 0) return null;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${url}/updates#events`,
    name: `${businessName} Events`,
    numberOfItems: events.length,
    itemListElement: events.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: event
    }))
  };
}

