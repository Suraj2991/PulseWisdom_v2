// core/ai/utils/aiUtils.ts

/**
 * Sanitizes text input by removing or escaping potentially harmful characters.
 */
export const sanitizeText = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\x20-\x7E]/g, ''); // Remove non-printable characters
};

/**
 * Sanitizes user content or prompt fields.
 */
export const sanitizePromptInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

/**
 * Trims text to max token-equivalent length.
 * Placeholder until token counting logic is added.
 */
export const truncateForModel = (text: string, maxLength = 1000): string => {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};

/**
 * Formats a prompt with header and content, optionally using markdown.
 */
export const formatPrompt = (header: string, content: unknown, useMarkdown: boolean): string => {
  const sanitizedContent = typeof content === 'string' 
    ? sanitizeText(content)
    : JSON.stringify(content, (key, value) => 
        typeof value === 'string' ? sanitizeText(value) : value
      );

  return useMarkdown
    ? `${header}\n\n\`\`\`json\n${sanitizedContent}\n\`\`\``
    : `${header}\n\n${sanitizedContent}`;
};
  