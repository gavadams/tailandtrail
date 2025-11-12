/**
 * Input validation and sanitization utilities
 * Prevents XSS attacks and ensures data integrity
 */

/**
 * Sanitize HTML content by encoding special characters
 * Prevents XSS attacks when displaying user-generated content
 */
export const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return input.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * Sanitize text input by removing potentially dangerous characters
 * Use for form inputs that will be stored in database
 */
export const sanitizeText = (input: string, maxLength: number = 1000): string => {
  if (!input) return '';
  
  // Remove null bytes and control characters (except newlines and tabs)
  let sanitized = input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

/**
 * Validate and sanitize email address
 */
export const validateEmail = (email: string): { isValid: boolean; sanitized: string } => {
  if (!email) {
    return { isValid: false, sanitized: '' };
  }
  
  // Basic email validation regex
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  const trimmed = email.trim().toLowerCase();
  
  // Additional length check
  if (trimmed.length > 254) {
    return { isValid: false, sanitized: trimmed.substring(0, 254) };
  }
  
  return {
    isValid: emailRegex.test(trimmed),
    sanitized: trimmed
  };
};

/**
 * Validate name input (alphanumeric, spaces, hyphens, apostrophes)
 */
export const validateName = (name: string, maxLength: number = 100): { isValid: boolean; sanitized: string } => {
  if (!name) {
    return { isValid: false, sanitized: '' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length === 0 || trimmed.length > maxLength) {
    return { isValid: false, sanitized: trimmed.substring(0, maxLength) };
  }
  
  // Allow letters, numbers, spaces, hyphens, apostrophes, and common name characters
  const nameRegex = /^[a-zA-Z0-9\s\-'\.]+$/;
  
  return {
    isValid: nameRegex.test(trimmed),
    sanitized: sanitizeText(trimmed, maxLength)
  };
};

/**
 * Validate and sanitize message/content input
 */
export const validateMessage = (message: string, maxLength: number = 5000): { isValid: boolean; sanitized: string } => {
  if (!message) {
    return { isValid: false, sanitized: '' };
  }
  
  const trimmed = message.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, sanitized: '' };
  }
  
  if (trimmed.length > maxLength) {
    return { isValid: false, sanitized: trimmed.substring(0, maxLength) };
  }
  
  return {
    isValid: true,
    sanitized: sanitizeText(trimmed, maxLength)
  };
};

/**
 * Validate game/city ID format (UUID)
 */
export const validateUUID = (id: string): boolean => {
  if (!id) return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Escape special characters for use in SQL queries (defense in depth)
 * Note: This should not be needed if using parameterized queries, but included for safety
 */
export const escapeSql = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/"/g, '\\"')
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
};

