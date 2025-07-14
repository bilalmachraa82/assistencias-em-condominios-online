import { ServiceStatus } from '@/types/database';
import { AssistanceStatusValue } from '@/types/assistance';

// Map old status values to new ones
export const mapOldStatusToNew = (oldStatus: AssistanceStatusValue): ServiceStatus => {
  const statusMap: Record<AssistanceStatusValue, ServiceStatus> = {
    'Pendente Resposta Inicial': 'submitted',
    'Pendente Agendamento': 'assigned',
    'Agendado': 'scheduled',
    'Em Curso': 'in_progress',
    'Concluído': 'completed',
    'Cancelado': 'cancelled',
    'Rejeitado': 'cancelled'
  };
  
  return statusMap[oldStatus] || 'submitted';
};

// Map new status values to old ones for display
export const mapNewStatusToOld = (newStatus: ServiceStatus): AssistanceStatusValue => {
  const statusMap: Record<ServiceStatus, AssistanceStatusValue> = {
    'submitted': 'Pendente Resposta Inicial',
    'assigned': 'Pendente Agendamento', 
    'scheduled': 'Agendado',
    'in_progress': 'Em Curso',
    'completed': 'Concluído',
    'cancelled': 'Cancelado'
  };
  
  return statusMap[newStatus] || 'Pendente Resposta Inicial';
};