export function validateAction(action: string): boolean {
  const validActions = ['accept', 'schedule', 'validate', 'view', 'portal'];
  return validActions.includes(action);
}

export function validateToken(token: string): boolean {
  if (typeof token !== 'string') return false;
  
  // More flexible token validation - check basic format and security requirements
  // Tokens should be at least 40 characters, contain only alphanumeric and hyphens
  if (token.length < 40) {
    console.log(`Token too short: ${token.length} characters`);
    return false;
  }
  
  // Allow alphanumeric characters and hyphens only (security check)
  const safePattern = /^[a-zA-Z0-9\-]+$/;
  const isValid = safePattern.test(token);
  
  if (!isValid) {
    console.log(`Token contains invalid characters: ${token.substring(0, 10)}...`);
  } else {
    console.log(`Token validation passed: ${token.substring(0, 10)}... (${token.length} chars)`);
  }
  
  return isValid;
}