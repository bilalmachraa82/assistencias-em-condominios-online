
import { supabase } from "@/integrations/supabase/client";
import { HealthCheck } from '@/types/healthCheck';

export const runDatabaseCheck = async (setChecks: React.Dispatch<React.SetStateAction<HealthCheck[]>>) => {
  try {
    const { count, error } = await supabase.from('assistances').select('*', { count: 'exact', head: true });
    if (error) throw error;
    
    setChecks(prev => prev.map(check => 
      check.name === 'Base de Dados' 
        ? { ...check, status: 'healthy' as const, message: `Conexão OK - ${count || 0} assistências`, count: count || 0 }
        : check
    ));
  } catch (error) {
    setChecks(prev => prev.map(check => 
      check.name === 'Base de Dados' 
        ? { ...check, status: 'error' as const, message: 'Erro de conexão' }
        : check
    ));
  }
};
