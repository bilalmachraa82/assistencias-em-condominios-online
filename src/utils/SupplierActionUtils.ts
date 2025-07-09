
import { toast } from 'sonner';
import { submitSupplierAction as centralizedSubmitAction, callSupplierRoute } from './edgeFunctions';

export interface ActionData {
  datetime?: string;
  reason?: string;
  photoBase64?: string;
}

/**
 * Submit a supplier action to the edge function
 * @deprecated Use submitSupplierAction from edgeFunctions.ts directly
 */
export async function submitSupplierAction(
  action: 'accept' | 'reject' | 'schedule' | 'reschedule' | 'complete',
  token: string,
  data?: ActionData
) {
  return await centralizedSubmitAction(action, token, data);
}

/**
 * Fetch assistance data for a given action and token
 */
export async function fetchAssistanceData(
  action: 'accept' | 'schedule' | 'validate' | 'view',
  token: string
) {
  return await callSupplierRoute(action, token, { showToastOnError: true });
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
