
/**
 * Standardized error handler that provides user-friendly messages
 * @param error The error object
 * @param fallbackMessage A fallback message if the error doesn't have a clear message
 * @returns User-friendly error message
 */
export function getUserFriendlyError(error: any, fallbackMessage = 'Ocorreu um erro inesperado'): string {
  // Check if it's a Supabase error
  if (error?.code) {
    // Handle common Supabase errors
    switch (error.code) {
      case '23505': // Unique violation
        return 'Um registro com esses dados já existe';
      case '23503': // Foreign key violation
        return 'Esta operação não é possível porque o item está sendo referenciado em outro lugar';
      case '23514': // Check constraint violation
        return 'Os valores fornecidos não são válidos';
      case '42P01': // Table doesn't exist
        return 'Erro de configuração do sistema';
      case 'PGRST116': // RLS policy error
        return 'Você não tem permissão para realizar esta operação';
      case 'P0001': // Raised exception
        // Try to extract the message from the error, could be from a trigger
        const match = error.message?.match(/ERROR:\s+(.*)/i);
        if (match && match[1]) {
          return match[1];
        }
        return 'Validação de dados falhou';
    }
  }
  
  // Get any message from the error object
  const errorMessage = error?.message ||
                     error?.error ||
                     (typeof error === 'string' ? error : null);
  
  if (errorMessage) {
    // If it's a REST API error about status
    if (errorMessage.includes('assistances_status_check')) {
      return 'O status fornecido não é válido para assistências';
    }

    // If it's an authentication error
    if (errorMessage.toLowerCase().includes('authentication')) {
      return 'Erro de autenticação. Por favor, faça login novamente';
    }

    // If it's a validation error
    if (errorMessage.toLowerCase().includes('validation')) {
      return 'Os dados fornecidos não são válidos';
    }
    
    // For network errors
    if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('failed to fetch')) {
      return 'Erro de conexão com o servidor. Verifique sua conexão de internet';
    }
    
    // If it seems like a good user friendly message already, return as is
    if (errorMessage.length < 100 && !errorMessage.includes('Exception') && !errorMessage.includes('Error:')) {
      return errorMessage;
    }
  }
  
  return fallbackMessage;
}

/**
 * Log errors to console in a standardized way
 * @param context Where the error occurred
 * @param error The error object
 */
export function logError(context: string, error: any): void {
  console.error(`Error in ${context}:`, error);
  if (error?.stack) {
    console.error('Stack trace:', error.stack);
  }
}
