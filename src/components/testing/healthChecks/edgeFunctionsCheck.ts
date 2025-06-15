
import { HealthCheck } from '@/types/healthCheck';

export const runEdgeFunctionsCheck = async (setChecks: React.Dispatch<React.SetStateAction<HealthCheck[]>>) => {
  try {
    const response = await fetch('https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/supplier-route?action=accept&token=test-token');
    // Even if it returns 404 or error, if the request goes through, the function is deployed
    
    setChecks(prev => prev.map(check => 
      check.name === 'Edge Functions' 
        ? { 
            ...check, 
            status: response ? 'healthy' as const : 'error' as const, 
            message: response ? 'Functions acessíveis' : 'Functions inacessíveis'
          }
        : check
    ));
  } catch (error) {
    setChecks(prev => prev.map(check => 
      check.name === 'Edge Functions' 
        ? { ...check, status: 'error' as const, message: 'Erro ao verificar functions' }
        : check
    ));
  }
};
