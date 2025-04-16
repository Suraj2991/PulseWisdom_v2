/**
 * Sanitizes input text by removing HTML tags and trimming whitespace
 * @param input - The text to sanitize
 * @returns Sanitized text string
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, '') // Remove HTML entities
    .trim(); // Remove leading/trailing whitespace
} 