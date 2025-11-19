/**
 * Natural Language Booking Parser
 * Parses booking requests like "Emily tomorrow at 2pm for haircut"
 */

export interface ParsedBooking {
  clientName?: string;
  date?: Date;
  time?: string; // "14:00" format
  service?: string;
  confidence: number; // 0-100
  matched: {
    clientName: boolean;
    date: boolean;
    time: boolean;
    service: boolean;
  };
}

/**
 * Parse natural language booking input
 */
export function parseBookingRequest(input: string): ParsedBooking {
  const normalized = input.toLowerCase().trim();
  const result: ParsedBooking = {
    confidence: 0,
    matched: {
      clientName: false,
      date: false,
      time: false,
      service: false,
    },
  };

  // Extract client name (usually first word or first two words)
  const clientNameMatch = extractClientName(normalized);
  if (clientNameMatch) {
    result.clientName = clientNameMatch;
    result.matched.clientName = true;
  }

  // Extract date
  const dateMatch = extractDate(normalized);
  if (dateMatch) {
    result.date = dateMatch;
    result.matched.date = true;
  }

  // Extract time
  const timeMatch = extractTime(normalized);
  if (timeMatch) {
    result.time = timeMatch;
    result.matched.time = true;
  }

  // Extract service
  const serviceMatch = extractService(normalized);
  if (serviceMatch) {
    result.service = serviceMatch;
    result.matched.service = true;
  }

  // Calculate confidence
  const matches = Object.values(result.matched).filter(Boolean).length;
  result.confidence = (matches / 4) * 100;

  return result;
}

/**
 * Extract client name from input
 * Handles: "Emily", "Emily Chen", "John"
 */
function extractClientName(input: string): string | undefined {
  // Remove common words first
  const cleaned = input
    .replace(/\b(tomorrow|today|next|at|for|in|the|a|an)\b/g, '')
    .trim();

  // Try to extract first 1-2 capitalized words (before time/date indicators)
  const words = cleaned.split(/\s+/);

  // Look for patterns like "book emily" or "schedule john"
  const actionWords = ['book', 'schedule', 'create', 'add', 'set', 'new'];
  let nameStart = 0;

  for (let i = 0; i < words.length; i++) {
    if (actionWords.includes(words[i])) {
      nameStart = i + 1;
      break;
    }
  }

  // Extract 1-2 words as name
  if (words.length > nameStart) {
    const potentialName = words.slice(nameStart, nameStart + 2).join(' ');
    // Capitalize first letter of each word
    return potentialName
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return undefined;
}

/**
 * Extract date from input
 * Handles: "today", "tomorrow", "next Monday", "friday", "12/25", "dec 25"
 */
function extractDate(input: string): Date | undefined {
  const now = new Date();

  // Today
  if (input.includes('today')) {
    return new Date(now.setHours(0, 0, 0, 0));
  }

  // Tomorrow
  if (input.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  // Day after tomorrow
  if (input.includes('day after tomorrow')) {
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(0, 0, 0, 0);
    return dayAfter;
  }

  // Next week
  if (input.includes('next week')) {
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(0, 0, 0, 0);
    return nextWeek;
  }

  // Specific day of week (e.g., "Monday", "next Friday")
  const dayOfWeekMatch = input.match(/\b(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
  if (dayOfWeekMatch) {
    const dayName = dayOfWeekMatch[2].toLowerCase();
    const isNext = !!dayOfWeekMatch[1];
    return getNextDayOfWeek(dayName, isNext);
  }

  // Relative days (e.g., "in 3 days", "in 2 weeks")
  const relativeDaysMatch = input.match(/in\s+(\d+)\s+(day|week)s?/i);
  if (relativeDaysMatch) {
    const count = parseInt(relativeDaysMatch[1], 10);
    const unit = relativeDaysMatch[2].toLowerCase();
    const result = new Date(now);
    if (unit === 'day') {
      result.setDate(result.getDate() + count);
    } else if (unit === 'week') {
      result.setDate(result.getDate() + count * 7);
    }
    result.setHours(0, 0, 0, 0);
    return result;
  }

  return undefined;
}

/**
 * Get next occurrence of a day of week
 */
function getNextDayOfWeek(dayName: string, skipToNext: boolean = false): Date {
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = daysOfWeek.indexOf(dayName.toLowerCase());

  if (targetDay === -1) return new Date();

  const now = new Date();
  const currentDay = now.getDay();

  let daysUntil = targetDay - currentDay;

  // If the day is today or already passed, go to next week
  if (daysUntil <= 0 || skipToNext) {
    daysUntil += 7;
  }

  const result = new Date(now);
  result.setDate(result.getDate() + daysUntil);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Extract time from input
 * Handles: "2pm", "14:00", "2:30pm", "at 2", "2 pm", "14:30"
 */
function extractTime(input: string): string | undefined {
  // 12-hour format with PM/AM (e.g., "2pm", "2:30pm", "2 pm")
  const time12Match = input.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (time12Match) {
    let hours = parseInt(time12Match[1], 10);
    const minutes = time12Match[2] ? parseInt(time12Match[2], 10) : 0;
    const period = time12Match[3].toLowerCase();

    // Convert to 24-hour format
    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // 24-hour format (e.g., "14:00", "14:30")
  const time24Match = input.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (time24Match) {
    const hours = parseInt(time24Match[1], 10);
    const minutes = parseInt(time24Match[2], 10);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // Just hour number (e.g., "at 2", "at 14")
  const hourMatch = input.match(/\bat\s+(\d{1,2})\b/);
  if (hourMatch) {
    let hours = parseInt(hourMatch[1], 10);

    // Assume PM if hour is 1-7 and no AM/PM specified
    if (hours >= 1 && hours <= 7) {
      hours += 12;
    }

    return `${hours.toString().padStart(2, '0')}:00`;
  }

  return undefined;
}

/**
 * Extract service from input
 * Handles common service names
 */
function extractService(input: string): string | undefined {
  const services = [
    { keywords: ['haircut', 'cut', 'trim'], name: 'Hair Cut' },
    { keywords: ['color', 'dye', 'highlight'], name: 'Hair Color' },
    { keywords: ['blowout', 'blow dry', 'style'], name: 'Blowout' },
    { keywords: ['manicure', 'mani'], name: 'Manicure' },
    { keywords: ['pedicure', 'pedi'], name: 'Pedicure' },
    { keywords: ['facial'], name: 'Facial' },
    { keywords: ['massage'], name: 'Massage' },
    { keywords: ['wax', 'waxing'], name: 'Waxing' },
    { keywords: ['makeup'], name: 'Makeup' },
    { keywords: ['nails'], name: 'Nails' },
    { keywords: ['eyebrow', 'brow'], name: 'Eyebrow' },
    { keywords: ['eyelash', 'lash'], name: 'Eyelash' },
  ];

  for (const service of services) {
    for (const keyword of service.keywords) {
      if (input.includes(keyword)) {
        return service.name;
      }
    }
  }

  return undefined;
}

/**
 * Format parsed booking into a human-readable summary
 */
export function formatBookingSummary(parsed: ParsedBooking): string {
  const parts: string[] = [];

  if (parsed.clientName) {
    parts.push(`Client: ${parsed.clientName}`);
  }

  if (parsed.date) {
    const dateStr = formatDateFriendly(parsed.date);
    parts.push(`Date: ${dateStr}`);
  }

  if (parsed.time) {
    const timeStr = formatTimeFriendly(parsed.time);
    parts.push(`Time: ${timeStr}`);
  }

  if (parsed.service) {
    parts.push(`Service: ${parsed.service}`);
  }

  return parts.join(' • ');
}

/**
 * Format date in friendly format
 */
function formatDateFriendly(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) {
    return 'Today';
  } else if (dateOnly.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }
}

/**
 * Format time in friendly 12-hour format
 */
function formatTimeFriendly(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  const displayMinutes = minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : '';
  return `${displayHour}${displayMinutes} ${period}`;
}

/**
 * Example usage:
 *
 * const result = parseBookingRequest("Book Emily tomorrow at 2pm for haircut");
 * console.log(result);
 * // {
 * //   clientName: "Emily",
 * //   date: Date (tomorrow),
 * //   time: "14:00",
 * //   service: "Hair Cut",
 * //   confidence: 100,
 * //   matched: { clientName: true, date: true, time: true, service: true }
 * // }
 */
