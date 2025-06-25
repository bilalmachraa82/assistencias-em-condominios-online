
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
    console.log(`Submitting ${action} action with data:`, data);
    
    const response = await fetch(
      'https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/submit-supplier-action',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, token, data })
      }
    );
    
    // Log full response for debugging
    const responseText = await response.text();
    console.log(`Raw response for ${action} action:`, responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      return { success: false, error: 'Resposta inválida do servidor' };
    }
    
    if (!response.ok) {
      console.error(`Error in ${action} action:`, result);
      toast.error(result.error || `Erro ao processar ${getActionName(action)}`);
      return { success: false, error: result.error, details: result.details };
    }
    
    return { success: true, ...result };
  } catch (err: any) {
    console.error(`Erro ao processar ${action}:`, err);
    toast.error(`Erro ao processar sua solicitação. Por favor, tente novamente.`);
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
    console.log(`Fetching assistance data for ${action} action with token: ${token}`);
    
    const response = await fetch(
      `https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/supplier-route?action=${action}&token=${token}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Log full response for debugging
    const responseText = await response.text();
    console.log(`Raw response for ${action} data fetch:`, responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      return { success: false, error: 'Resposta inválida do servidor' };
    }
    
    if (!response.ok) {
      console.error(`Error fetching data for ${action}:`, result);
      toast.error(result.error || 'Erro ao carregar os detalhes da assistência');
      return { success: false, error: result.error };
    }
    
    return { success: true, data: result.data };
  } catch (err: any) {
    console.error(`Erro ao buscar dados para ${action}:`, err);
    toast.error('Erro ao carregar os detalhes da assistência. Por favor, tente novamente mais tarde.');
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
