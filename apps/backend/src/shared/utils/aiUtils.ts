/**
 * Sanitizes text by removing extra whitespace and potentially harmful characters
 * @param text The text to sanitize
 * @returns The sanitized text
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s.,!?-]/g, ''); // Remove potentially harmful characters
} 