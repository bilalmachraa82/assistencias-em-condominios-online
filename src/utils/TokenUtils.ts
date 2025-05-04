
/**
 * Generates a random token string 
 * @returns {string} A random token string
 */
export const generateToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};
