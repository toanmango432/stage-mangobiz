/**
 * Converts 12-hour time format to 24-hour ISO time
 * @param time12h - Time in format "10:00 AM" or "3:30 PM"
 * @returns Time in format "10:00:00" or "15:30:00"
 */
export function convertTo24Hour(time12h: string): string {
  const [time, period] = time12h.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}
