
/**
 * Generates a random token string with increased entropy
 * @returns {string} A random token string
 */
export const generateToken = (): string => {
  // Generate a more reliable token using random values and timestamp
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const length = 22; // Keep token length reasonable but long enough for security
  let token = '';
  
  // Use crypto API if available for better randomness
  if (window.crypto && window.crypto.getRandomValues) {
    const values = new Uint32Array(length);
    window.crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      token += characters.charAt(values[i] % characters.length);
    }
  } else {
    // Fallback to Math.random if crypto API is not available
    for (let i = 0; i < length; i++) {
      token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
  }
  
  return token;
};
