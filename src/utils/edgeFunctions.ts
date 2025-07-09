import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Centralized Edge Function caller with proper authentication
 * This ensures all Edge Function calls use proper Supabase authentication
 */
export async function invokeEdgeFunction(
  functionName: string, 
  payload?: any, 
  options?: { 
    showToastOnError?: boolean;
    method?: 'GET' | 'POST';
  }
) {
  const { showToastOnError = true, method = 'POST' } = options || {};
  
  console.log(`[EdgeFunction] Calling ${functionName}`, payload);
  
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });
    
    if (error) {
      console.error(`[EdgeFunction] ${functionName} error:`, error);
      if (showToastOnError) {
        toast.error(`Erro na função ${functionName}: ${error.message}`);
      }
      throw error;
    }
    
    console.log(`[EdgeFunction] ${functionName} success:`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`[EdgeFunction] ${functionName} exception:`, error);
    const errorMessage = error instanceof Error ? error.message : `Erro desconhecido em ${functionName}`;
    
    if (showToastOnError) {
      toast.error(errorMessage);
    }
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Helper for supplier route calls with token validation
 */
export async function callSupplierRoute(
  action: 'accept' | 'schedule' | 'validate' | 'view',
  token: string,
  options?: { showToastOnError?: boolean }
) {
  console.log(`[SupplierRoute] Calling ${action} with token: ${token?.substring(0, 10)}...`);
  
  // Use URL parameters for GET requests to supplier-route
  const url = `https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/supplier-route?action=${action}&token=${token}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log(`[SupplierRoute] Response status for ${action}:`, response.status);
    
    const responseText = await response.text();
    console.log(`[SupplierRoute] Raw response for ${action}:`, responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Error parsing JSON response:', e);
      if (options?.showToastOnError) {
        toast.error('Resposta inválida do servidor');
      }
      return { success: false, error: 'Resposta inválida do servidor' };
    }
    
    if (!response.ok) {
      console.error(`❌ Error in ${action} (${response.status}):`, result);
      const errorMessage = result.error || `Erro ao processar ${action}`;
      if (options?.showToastOnError) {
        toast.error(errorMessage);
      }
      return { success: false, error: result.error, details: result.details };
    }
    
    console.log(`✅ ${action} successful:`, result);
    return { success: true, data: result.data };
  } catch (err: any) {
    console.error(`❌ Network error for ${action}:`, err);
    const errorMessage = 'Erro de rede. Por favor, verifique a sua conexão e tente novamente.';
    if (options?.showToastOnError) {
      toast.error(errorMessage);
    }
    return { success: false, error: err.message };
  }
}

/**
 * Submit supplier action with proper error handling
 */
export async function submitSupplierAction(
  action: 'accept' | 'reject' | 'schedule' | 'reschedule' | 'complete',
  token: string,
  data?: any
) {
  console.log(`[SupplierAction] Submitting ${action} with token: ${token?.substring(0, 10)}... and data:`, data);
  
  return await invokeEdgeFunction('submit-supplier-action', {
    action,
    token,
    data
  });
}