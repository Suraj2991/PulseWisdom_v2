/**
 * Parses a date string into a Date object
 * @param dateString The date string to parse
 * @returns Date object
 * @throws Error if the date string is invalid
 */
export function parseDate(dateString: string): Date {
  if (!dateString || typeof dateString !== 'string') {
    throw new Error('Invalid date string');
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string');
  }

  // Validate date components
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) {
    throw new Error('Invalid date string');
  }

  return date;
}

/**
 * Formats a Date object into an ISO string
 * @param date The date to format
 * @returns Formatted date string
 * @throws Error if the date is invalid
 */
export function formatDate(date: unknown): string {
  if (!(date instanceof Date)) {
    throw new Error('Invalid date');
  }
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }
  return date.toISOString();
} 