
// Centralized status management for the application
// This ensures we have a single source of truth for status values

export type AssistanceStatus = 
  | 'Pendente Resposta Inicial'
  | 'Pendente Aceitação'
  | 'Recusada'
  | 'Pendente Agendamento'
  | 'Agendado'
  | 'Em Andamento'
  | 'Pendente Validação'
  | 'Concluído'
  | 'Reagendamento Solicitado'
  | 'Cancelado';

export const VALID_STATUSES: AssistanceStatus[] = [
  'Pendente Resposta Inicial',
  'Pendente Aceitação',
  'Recusada',
  'Pendente Agendamento',
  'Agendado',
  'Em Andamento',
  'Pendente Validação',
  'Concluído',
  'Reagendamento Solicitado',
  'Cancelado'
];

export const STATUS_DISPLAY_ORDER = {
  'Pendente Resposta Inicial': 10,
  'Pendente Aceitação': 20,
  'Recusada': 30,
  'Pendente Agendamento': 40,
  'Agendado': 50,
  'Em Andamento': 60,
  'Pendente Validação': 70,
  'Concluído': 80,
  'Reagendamento Solicitado': 90,
  'Cancelado': 100
};

// Get next logical status based on current status and action
export function getNextStatus(currentStatus: AssistanceStatus, action: string): AssistanceStatus {
  switch(action) {
    case 'accept':
      return 'Pendente Agendamento';
    case 'accept_with_schedule':
      return 'Agendado';
    case 'reject':
      return 'Recusada';
    case 'schedule':
      return 'Agendado';
    case 'reschedule':
      return 'Agendado';
    case 'complete':
      return 'Pendente Validação';
    case 'validate':
      return 'Concluído';
    case 'request_reschedule':
      return 'Reagendamento Solicitado';
    case 'cancel':
      return 'Cancelado';
    default:
      return currentStatus;
  }
}

// Get status badge styling based on status
export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Pendente Resposta Inicial':
    case 'Pendente Aceitação':
      return 'bg-yellow-500/20 text-yellow-300';
    case 'Recusada':
      return 'bg-red-500/20 text-red-300';
    case 'Pendente Agendamento':
    case 'Agendado':
      return 'bg-blue-500/20 text-blue-300';
    case 'Em Andamento':
    case 'Pendente Validação':
      return 'bg-purple-500/20 text-purple-300';
    case 'Concluído':
      return 'bg-green-500/20 text-green-300';
    case 'Reagendamento Solicitado':
      return 'bg-orange-500/20 text-orange-300';
    case 'Validação Expirada':
      return 'bg-gray-500/20 text-gray-300';
    case 'Cancelado':
      return 'bg-red-500/20 text-red-300';
    default:
      return 'bg-gray-500/20 text-gray-300';
  }
}

// Map statuses to workflow stages for UI visualization
export const STATUS_WORKFLOW_STAGE = {
  'Pendente Resposta Inicial': 1,
  'Pendente Aceitação': 1,
  'Recusada': -1, // Failed path
  'Pendente Agendamento': 2,
  'Agendado': 3,
  'Em Andamento': 4,
  'Pendente Validação': 5,
  'Concluído': 6,
  'Reagendamento Solicitado': 2.5, // Between stages
  'Cancelado': -1 // Failed path
};
