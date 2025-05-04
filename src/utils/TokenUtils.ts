
/**
 * Generates a random token string with increased entropy
 * @returns {string} A random token string
 */
export const generateToken = (): string => {
  // Generate a larger, more secure random string
  const randomPart1 = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  const randomPart3 = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  
  return `${randomPart1}-${timestamp}-${randomPart2}-${randomPart3}`;
};
