/**
 * Service Name Abbreviation Utility
 * Intelligently abbreviates long service names for compact display
 */

const abbrevMap: Record<string, string> = {
  'Haircut': 'Cut',
  'Hair Cut': 'Cut',
  'Hair Color': 'Color',
  'Hair Coloring': 'Color',
  'Manicure': 'Mani',
  'Pedicure': 'Pedi',
  'Mani/Pedi': 'M/P',
  'Manicure & Pedicure': 'M&P',
  'Massage': 'Mass.',
  'Facial': 'Facial',
  'Hair Styling': 'Style',
  'Highlights': 'Hilite',
  'Balayage': 'Bal.',
  'Blowout': 'Blow',
  'Hair Wash': 'Wash',
  'Deep Conditioning': 'Cond.',
  'Eyebrow Wax': 'Brow',
  'Eyebrow Waxing': 'Brow',
  'Full Body Massage': 'Body Mass.',
  'Gel Manicure': 'Gel Mani',
  'Acrylic Nails': 'Acrylic',
  'Nail Extension': 'Ext.',
  'Hair Treatment': 'Treat.'
};

/**
 * Abbreviates a service name intelligently
 * @param service - The full service name
 * @param maxLength - Maximum length before truncation (default: 14)
 * @returns Abbreviated service name
 */
export const abbreviateService = (service: string, maxLength: number = 14): string => {
  if (!service) return '';
  if (service.length <= maxLength) return service;

  // Check if we have a predefined abbreviation
  if (abbrevMap[service]) {
    return abbrevMap[service];
  }

  // If still too long, truncate with ellipsis
  return service.substring(0, maxLength - 1) + '…';
};
