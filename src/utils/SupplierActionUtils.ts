
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
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Error in supplier action:', result);
      toast.error(result.error || `Erro ao processar ${getActionName(action)}`);
      return { success: false, error: result.error, details: result.details };
    }
    
    return { success: true, ...result };
  } catch (err) {
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
    const response = await fetch(
      `https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/supplier-route?action=${action}&token=${token}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Error fetching assistance:', result);
      toast.error(result.error || 'Erro ao carregar os detalhes da assistência');
      return { success: false, error: result.error };
    }
    
    return { success: true, data: result.data };
  } catch (err) {
    console.error('Erro ao buscar assistência:', err);
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
      return 'bg-green-500/20 text-green-300';
    case 'Urgente':
      return 'bg-orange-500/20 text-orange-300';
    case 'Emergência':
      return 'bg-red-500/20 text-red-300';
    default:
      return 'bg-gray-500/20 text-gray-300';
  }
}
