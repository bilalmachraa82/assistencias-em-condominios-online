
// All valid status values - these should match the database
export const VALID_STATUSES = [
  'Pendente Resposta Inicial',
  'Pendente Aceitação',
  'Pendente Agendamento',
  'Agendado',
  'Concluído',
  'Cancelado',
  'Rejeitado'
] as const;

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
    case 'Pendente Agendamento':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'Agendado':
      return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    case 'Concluído':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'Cancelado':
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    case 'Rejeitado':
      return 'bg-red-500/20 text-red-300 border-red-500/30';
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
      return ['Pendente Agendamento', 'Rejeitado', 'Cancelado'];
    case 'Pendente Agendamento':
      return ['Agendado', 'Cancelado'];
    case 'Agendado':
      return ['Concluído', 'Cancelado'];
    case 'Concluído':
      return [];
    case 'Rejeitado':
      return ['Pendente Aceitação'];
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
    { label: 'Em Progresso', value: ['Agendado'] },
    { label: 'Concluídos', value: ['Concluído'] },
    { label: 'Problemáticos', value: ['Rejeitado', 'Cancelado'] }
  ];
}
