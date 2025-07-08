/**
 * Simple hash-based verification utilities for supplier access
 */

/**
 * Generate a simple verification hash for an assistance ID
 * @param assistanceId The assistance ID
 * @param salt Optional salt (uses default if not provided)
 * @returns A simple hash string
 */
export function generateVerificationHash(assistanceId: number, salt: string = 'secure-salt-2024'): string {
  const data = `${assistanceId}-${salt}`;
  
  // Simple hash implementation (for production, consider using crypto-js)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive hex string
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Verify a hash against an assistance ID
 * @param assistanceId The assistance ID
 * @param providedHash The hash to verify
 * @param salt Optional salt (uses default if not provided)
 * @returns True if hash is valid
 */
export function verifyHash(assistanceId: number, providedHash: string, salt: string = 'secure-salt-2024'): boolean {
  const expectedHash = generateVerificationHash(assistanceId, salt);
  return expectedHash === providedHash;
}

/**
 * Generate a new-style supplier URL
 * @param assistanceId The assistance ID
 * @param action The action (accept, schedule, validate, portal)
 * @returns The new URL format
 */
export function generateSupplierUrl(assistanceId: number, action: string = 'portal'): string {
  const hash = generateVerificationHash(assistanceId);
  const baseUrl = window.location.origin;
  
  if (action === 'portal') {
    return `${baseUrl}/supplier/portal/${assistanceId}?verify=${hash}`;
  }
  
  return `${baseUrl}/supplier/${action}/${assistanceId}?verify=${hash}`;
}