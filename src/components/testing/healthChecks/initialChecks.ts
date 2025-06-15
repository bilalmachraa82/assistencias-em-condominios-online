
import { Database, Cloud, Mail, Users } from 'lucide-react';
import { HealthCheck } from '@/types/healthCheck';

export const getInitialChecks = (): HealthCheck[] => [
  {
    name: 'Base de Dados',
    icon: <Database className="h-4 w-4" />,
    status: 'checking',
    message: 'A verificar conexão...'
  },
  {
    name: 'Storage',
    icon: <Cloud className="h-4 w-4" />,
    status: 'checking',
    message: 'A verificar buckets...'
  },
  {
    name: 'Edge Functions',
    icon: <Mail className="h-4 w-4" />,
    status: 'checking',
    message: 'A verificar functions...'
  },
  {
    name: 'Dados do Sistema',
    icon: <Users className="h-4 w-4" />,
    status: 'checking',
    message: 'A verificar integridade...'
  }
];
