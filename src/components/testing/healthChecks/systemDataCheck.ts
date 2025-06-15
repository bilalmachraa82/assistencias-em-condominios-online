
import { supabase } from "@/integrations/supabase/client";
import { HealthCheck } from '@/types/healthCheck';

export const runSystemDataCheck = async (setChecks: React.Dispatch<React.SetStateAction<HealthCheck[]>>) => {
  try {
    const [buildings, suppliers, interventionTypes, validStatuses] = await Promise.all([
      supabase.from('buildings').select('*', { count: 'exact', head: true }),
      supabase.from('suppliers').select('*', { count: 'exact', head: true }),
      supabase.from('intervention_types').select('*', { count: 'exact', head: true }),
      supabase.from('valid_statuses').select('*', { count: 'exact', head: true })
    ]);

    const buildingCount = buildings.count || 0;
    const supplierCount = suppliers.count || 0;
    const interventionCount = interventionTypes.count || 0;
    const statusCount = validStatuses.count || 0;

    const hasMinimumData = buildingCount > 0 && supplierCount > 0 && interventionCount > 0 && statusCount > 0;

    setChecks(prev => prev.map(check => 
      check.name === 'Dados do Sistema' 
        ? { 
            ...check, 
            status: hasMinimumData ? 'healthy' as const : 'warning' as const, 
            message: hasMinimumData 
              ? `${buildingCount} edifícios, ${supplierCount} fornecedores, ${interventionCount} tipos, ${statusCount} estados`
              : 'Dados insuficientes para funcionamento completo'
          }
        : check
    ));
  } catch (error) {
    setChecks(prev => prev.map(check => 
      check.name === 'Dados do Sistema' 
        ? { ...check, status: 'error' as const, message: 'Erro ao verificar dados' }
        : check
    ));
  }
};
