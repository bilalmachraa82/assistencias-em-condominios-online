
/**
 * Generates a secure random token for assistance interactions
 * @param prefix Optional prefix for the token
 * @returns A randomly generated token string
 */
export function generateToken(prefix = ''): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const segments = [22, 6, 6, 8, 10]; // Format: xxxx-xx-xx-xxx-xxxx
  let token = prefix ? `${prefix}-` : '';
  
  segments.forEach((length, index) => {
    for (let i = 0; i < length; i++) {
      token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    if (index < segments.length - 1) {
      token += '-';
    }
  });
  
  return token;
}

/**
 * Validates a token format
 * @param token The token to validate
 * @returns Boolean indicating if the token has a valid format
 */
export function isValidTokenFormat(token: string): boolean {
  // Check if token matches our expected pattern
  const pattern = /^([a-z0-9]+-){0,1}[a-z0-9]{22}-[a-z0-9]{6}-[a-z0-9]{6}-[a-z0-9]{8}-[a-z0-9]{10}$/;
  return pattern.test(token);
}
