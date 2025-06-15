
import { HealthCheck, HealthCheckStatus } from '@/types/healthCheck';

export const getStatusColor = (status: HealthCheckStatus) => {
  switch (status) {
    case 'healthy':
      return 'bg-green-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
};

export const getStatusVariant = (status: HealthCheckStatus) => {
  switch (status) {
    case 'healthy':
      return 'default';
    case 'warning':
      return 'secondary';
    case 'error':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const calculateOverallHealth = (checks: HealthCheck[]): HealthCheckStatus => {
  return checks.every(check => check.status === 'healthy') ? 'healthy' :
         checks.some(check => check.status === 'error') ? 'error' : 'warning';
};

export const getOverallHealthLabel = (status: HealthCheckStatus): string => {
  switch (status) {
    case 'healthy':
      return 'Saudável';
    case 'warning':
      return 'Atenção';
    case 'error':
      return 'Erro';
    default:
      return 'A verificar';
  }
};

export const getStatusLabel = (status: HealthCheckStatus): string => {
  switch (status) {
    case 'checking':
      return 'A verificar';
    case 'healthy':
      return 'OK';
    case 'warning':
      return 'Atenção';
    case 'error':
      return 'Erro';
    default:
      return 'Desconhecido';
  }
};
