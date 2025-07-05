
/**
 * Generates a cryptographically secure random token for assistance interactions
 * @param prefix Optional prefix for the token
 * @returns A cryptographically secure randomly generated token string
 */
export function generateToken(prefix = ''): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const segments = [22, 6, 6, 8, 10]; // Format: xxxx-xx-xx-xxx-xxxx
  let token = prefix ? `${prefix}-` : '';
  
  // Use crypto.getRandomValues for cryptographically secure randomness
  const randomArray = new Uint8Array(segments.reduce((sum, len) => sum + len, 0));
  crypto.getRandomValues(randomArray);
  
  let arrayIndex = 0;
  segments.forEach((length, index) => {
    for (let i = 0; i < length; i++) {
      token += characters.charAt(randomArray[arrayIndex] % characters.length);
      arrayIndex++;
    }
    if (index < segments.length - 1) {
      token += '-';
    }
  });
  
  return token;
}

/**
 * Validates a token format and entropy
 * @param token The token to validate
 * @returns Boolean indicating if the token has a valid format and sufficient entropy
 */
export function isValidTokenFormat(token: string): boolean {
  // Check if token matches our expected pattern (now case-insensitive)
  const pattern = /^([a-zA-Z0-9]+-){0,1}[a-zA-Z0-9]{22}-[a-zA-Z0-9]{6}-[a-zA-Z0-9]{6}-[a-zA-Z0-9]{8}-[a-zA-Z0-9]{10}$/;
  if (!pattern.test(token)) {
    return false;
  }
  
  // Basic entropy check - ensure token isn't all the same character
  const uniqueChars = new Set(token.replace(/-/g, '').toLowerCase());
  return uniqueChars.size >= 4; // At least 4 different characters
}

/**
 * Validates token expiration (if tokens had expiration dates)
 * @param token The token to validate
 * @returns Boolean indicating if the token is still valid
 */
export function isTokenExpired(token: string): boolean {
  // For now, tokens don't expire, but this provides the interface for future implementation
  return false;
}

/**
 * Generates a secure token with entropy validation
 * @param prefix Optional prefix for the token
 * @param maxAttempts Maximum attempts to generate a valid token
 * @returns A cryptographically secure token with validated entropy
 */
export function generateSecureToken(prefix = '', maxAttempts = 5): string {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const token = generateToken(prefix);
    if (isValidTokenFormat(token)) {
      return token;
    }
  }
  throw new Error('Failed to generate secure token with sufficient entropy');
}
