import { createCorsResponse } from './cors.ts';

export function handleError(message: string, error: any = null, status = 500) {
  console.error(`Error: ${message}`, error);
  return createCorsResponse({ 
    error: message,
    details: error ? (error.message || JSON.stringify(error)) : undefined 
  }, status);
}