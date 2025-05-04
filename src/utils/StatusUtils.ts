
// All valid status values - these should match the database
export const VALID_STATUSES = [
  'Pendente Resposta Inicial',
  'Pendente Aceitação',
  'Recusada Fornecedor',
  'Pendente Agendamento',
  'Agendado',
  'Em Progresso',
  'Pendente Validação',
  'Concluído',
  'Reagendamento Solicitado',
  'Validação Expirada',
  'Cancelado'
] as const;

// Create a mutable version that can be used where string[] is expected
export const VALID_STATUS_VALUES: string[] = [...VALID_STATUSES];

export type AssistanceStatus = typeof VALID_STATUSES[number];

// Check if a status is valid
export function isValidStatus(status: string): status is AssistanceStatus {
  return VALID_STATUSES.includes(status as AssistanceStatus);
}

// Get the CSS class for a status badge
export function getStatusBadgeClass(status: string): string {
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

// Get the next possible statuses based on current status
export function getNextPossibleStatuses(currentStatus: string): AssistanceStatus[] {
  switch(currentStatus) {
    case 'Pendente Resposta Inicial':
      return ['Pendente Aceitação', 'Cancelado'];
    case 'Pendente Aceitação':
      return ['Pendente Agendamento', 'Recusada Fornecedor', 'Cancelado'];
    case 'Pendente Agendamento':
      return ['Agendado', 'Cancelado'];
    case 'Agendado':
      return ['Em Progresso', 'Reagendamento Solicitado', 'Cancelado'];
    case 'Em Progresso':
      return ['Pendente Validação', 'Cancelado'];
    case 'Pendente Validação':
      return ['Concluído', 'Validação Expirada', 'Cancelado'];
    case 'Validação Expirada':
      return ['Concluído', 'Cancelado'];
    case 'Concluído':
      return [];
    case 'Recusada Fornecedor':
      return ['Pendente Aceitação', 'Cancelado'];
    case 'Reagendamento Solicitado':
      return ['Agendado', 'Cancelado'];
    case 'Cancelado':
      return ['Pendente Resposta Inicial'];
    default:
      return [];
  }
}

// Get visual status for filtering and display
export function getStatusDisplayGroups() {
  return [
    { label: 'Todos', value: null },
    { label: 'Pendentes', value: ['Pendente Resposta Inicial', 'Pendente Aceitação', 'Pendente Agendamento'] },
    { label: 'Em Progresso', value: ['Agendado', 'Em Progresso', 'Pendente Validação'] },
    { label: 'Concluídos', value: ['Concluído'] },
    { label: 'Problemáticos', value: ['Recusada Fornecedor', 'Validação Expirada', 'Reagendamento Solicitado', 'Cancelado'] }
  ];
}
