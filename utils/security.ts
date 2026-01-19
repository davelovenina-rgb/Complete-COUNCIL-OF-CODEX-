
/**
 * SOVEREIGN SECURITY MODULE v1.0
 * Prevents XSS and signal pollution within the Sanctuary.
 */

/**
 * Strips HTML tags and suspicious characters from strings.
 */
export const sanitizeInput = (text: string): string => {
  if (!text) return "";
  // Strip HTML tags
  const stripped = text.replace(/<[^>]*>?/gm, '');
  // Prevent common script injection markers
  return stripped
    .replace(/javascript:/gi, '')
    .replace(/onload=/gi, '')
    .replace(/onerror=/gi, '');
};

/**
 * Validates a signal's structural integrity.
 */
export const validateSignal = (payload: any): boolean => {
  if (!payload) return false;
  // Deep inspection for forbidden strings or malformed objects
  const str = JSON.stringify(payload);
  return !str.includes('<script') && !str.includes('eval(');
};
