
import { supabase } from '@/integrations/supabase/client';
import { ValidStatus } from '@/types/assistance';

// Cache valid statuses to avoid too many DB requests
let cachedStatuses: ValidStatus[] | null = null;
let lastFetch: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch valid statuses from the database
 */
export async function fetchValidStatuses(): Promise<ValidStatus[]> {
  const now = Date.now();
  
  // Use cache if available and not expired
  if (cachedStatuses && lastFetch + CACHE_TTL > now) {
    return cachedStatuses;
  }
  
  try {
    const { data, error } = await supabase
      .from('valid_statuses')
      .select('*')
      .order('display_order');
    
    if (error) {
      console.error('Error fetching valid statuses:', error);
      throw error;
    }
    
    // Ensure we have valid data before caching
    if (data && Array.isArray(data)) {
      cachedStatuses = data as ValidStatus[];
      lastFetch = now;
      return data as ValidStatus[];
    }
    
    return [];
  } catch (err) {
    console.error('Failed to fetch valid statuses:', err);
    return [];
  }
}

/**
 * Get all valid status values (just the strings)
 */
export async function getValidStatusValues(): Promise<string[]> {
  const statuses = await fetchValidStatuses();
  return statuses.filter(s => s && s.status_value).map(s => s.status_value);
}

/**
 * Check if a status is valid by comparing with values from the database
 */
export async function isValidStatus(status: string): Promise<boolean> {
  const validValues = await getValidStatusValues();
  return validValues.includes(status);
}

/**
 * Get the next possible statuses for a given current status
 * This is used in the UI to show valid status transitions
 */
export function getNextPossibleStatuses(currentStatus: string): string[] {
  // Define the status flow
  const statusFlow: Record<string, string[]> = {
    'Pendente Resposta Inicial': ['Pendente Aceitação', 'Cancelado'],
    'Pendente Aceitação': ['Pendente Agendamento', 'Recusada Fornecedor', 'Cancelado'],
    'Pendente Agendamento': ['Agendado', 'Cancelado', 'Recusada Fornecedor'],
    'Agendado': ['Em Progresso', 'Reagendamento Solicitado', 'Cancelado'],
    'Em Progresso': ['Pendente Validação', 'Cancelado'],
    'Pendente Validação': ['Concluído', 'Validação Expirada', 'Cancelado'],
    'Validação Expirada': ['Pendente Validação', 'Concluído', 'Cancelado'],
    'Reagendamento Solicitado': ['Agendado', 'Cancelado'],
    'Recusada Fornecedor': ['Pendente Aceitação', 'Cancelado'],
    'Concluído': ['Cancelado'],
    'Cancelado': ['Pendente Resposta Inicial', 'Pendente Aceitação']
  };
  
  // Return the next possible statuses or all statuses if the current status is not in the flow
  return statusFlow[currentStatus] || Object.keys(statusFlow);
}

/**
 * Get the UI class for a status badge based on hex_color from the database
 */
export function getStatusBadgeClass(status: string, hexColor?: string): string {
  // If we have the hex color directly, use it to generate a compatible class
  if (hexColor) {
    return generateBadgeClass(hexColor);
  }

  // Fallback to hardcoded classes for backwards compatibility
  // These will be replaced when the component gets the actual data from the database
  switch(status) {
    case 'Pendente Resposta Inicial':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'Pendente Aceitação':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'Recusada Fornecedor':
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'Pendente Agendamento':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'Agendado':
      return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    case 'Em Progresso':
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    case 'Pendente Validação':
      return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
    case 'Concluído':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'Reagendamento Solicitado':
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    case 'Validação Expirada':
      return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'Cancelado':
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    default:
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
}

/**
 * Convert hex color to Tailwind-like utility classes
 */
function generateBadgeClass(hexColor: string): string {
  // Create rgba for transparent background
  return `bg-[${hexColor}]/20 text-[${hexColor}] border-[${hexColor}]/30`;
}

/**
 * Get visual status groupings for filtering
 */
export function getStatusDisplayGroups() {
  return [
    { label: 'Todos', value: null },
    { label: 'Pendentes', value: ['Pendente Resposta Inicial', 'Pendente Aceitação', 'Pendente Agendamento'] },
    { label: 'Em Progresso', value: ['Agendado', 'Em Progresso', 'Pendente Validação'] },
    { label: 'Concluídos', value: ['Concluído'] },
    { label: 'Problemáticos', value: ['Recusada Fornecedor', 'Validação Expirada', 'Reagendamento Solicitado', 'Cancelado'] }
  ];
}
