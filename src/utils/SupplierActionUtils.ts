
import { toast } from 'sonner';

export interface ActionData {
  datetime?: string;
  reason?: string;
  photoBase64?: string;
}

/**
 * Submit a supplier action to the edge function
 */
export async function submitSupplierAction(
  action: 'accept' | 'reject' | 'schedule' | 'reschedule' | 'complete',
  token: string,
  data?: ActionData
) {
  try {
    console.log(`📤 Submitting ${action} action with token: ${token?.substring(0, 10)}... and data:`, data);
    
    const response = await fetch(
      'https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/submit-supplier-action',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ action, token, data })
      }
    );
    
    console.log(`📨 Response status for ${action}:`, response.status);
    
    // Log full response for debugging
    const responseText = await response.text();
    console.log(`📝 Raw response for ${action} action:`, responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Error parsing JSON response:', e);
      toast.error('Resposta inválida do servidor');
      return { success: false, error: 'Resposta inválida do servidor' };
    }
    
    if (!response.ok) {
      console.error(`❌ Error in ${action} action (${response.status}):`, result);
      const errorMessage = result.error || `Erro ao processar ${getActionName(action)}`;
      toast.error(errorMessage);
      return { success: false, error: result.error, details: result.details };
    }
    
    console.log(`✅ ${action} action successful:`, result);
    return { success: true, ...result };
  } catch (err: any) {
    console.error(`❌ Network error for ${action}:`, err);
    toast.error(`Erro de rede. Por favor, verifique a sua conexão e tente novamente.`);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch assistance data for a given action and token
 */
export async function fetchAssistanceData(
  action: 'accept' | 'schedule' | 'validate',
  token: string
) {
  try {
    console.log(`📥 Fetching assistance data for ${action} action with token: ${token?.substring(0, 10)}...`);
    
    const response = await fetch(
      `https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/supplier-route?action=${action}&token=${token}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log(`📨 Response status for ${action} data fetch:`, response.status);
    
    // Log full response for debugging
    const responseText = await response.text();
    console.log(`📝 Raw response for ${action} data fetch:`, responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Error parsing JSON response:', e);
      toast.error('Resposta inválida do servidor');
      return { success: false, error: 'Resposta inválida do servidor' };
    }
    
    if (!response.ok) {
      console.error(`❌ Error fetching data for ${action} (${response.status}):`, result);
      const errorMessage = result.error || 'Erro ao carregar os detalhes da assistência';
      toast.error(errorMessage);
      return { success: false, error: result.error };
    }
    
    console.log(`✅ ${action} data fetch successful:`, result);
    return { success: true, data: result.data };
  } catch (err: any) {
    console.error(`❌ Network error fetching data for ${action}:`, err);
    toast.error('Erro de rede. Por favor, verifique a sua conexão e tente novamente.');
    return { success: false, error: err.message };
  }
}

/**
 * Get a user-friendly name for an action
 */
function getActionName(action: string): string {
  switch (action) {
    case 'accept':
      return 'aceitação';
    case 'reject':
      return 'recusa';
    case 'schedule':
      return 'agendamento';
    case 'reschedule':
      return 'reagendamento';
    case 'complete':
      return 'conclusão';
    default:
      return action;
  }
}

/**
 * Get CSS class for a request type badge
 */
export function getTypeBadgeClass(type: string): string {
  switch (type) {
    case 'Normal':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'Urgente':
      return 'bg-orange-100 text-orange-800 border border-orange-200';
    case 'Emergência':
      return 'bg-red-100 text-red-800 border border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
}
