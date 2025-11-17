/**
 * Validate email format
 * @param email - Email string to validate
 * @returns True if valid email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param password - Password string to validate
 * @returns Object with valid flag and message
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (!password || password.length < 6) {
    return {
      valid: false,
      message: 'Password must be at least 6 characters',
    };
  }
  return {
    valid: true,
    message: '',
  };
}

/**
 * Validate name (first name or last name)
 * @param name - Name string to validate
 * @returns True if valid name
 */
export function validateName(name: string): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 100;
}

/**
 * Validate group name
 * @param name - Group name to validate
 * @returns True if valid group name
 */
export function validateGroupName(name: string): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 100;
}
