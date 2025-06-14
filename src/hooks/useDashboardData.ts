
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

export function useDashboardData() {
  // Fetch general statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [assistancesResult, buildingsResult, suppliersResult] = await Promise.all([
        supabase.from('assistances').select('id, status, created_at, urgency_level'),
        supabase.from('buildings').select('id'),
        supabase.from('suppliers').select('id')
      ]);

      if (assistancesResult.error) throw assistancesResult.error;
      if (buildingsResult.error) throw buildingsResult.error;
      if (suppliersResult.error) throw suppliersResult.error;

      const assistances = assistancesResult.data || [];
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));

      // Calculate active assistances (not completed)
      const activeAssistances = assistances.filter(a => 
        a.status !== 'completed' && a.status !== 'cancelled'
      ).length;

      // Calculate today's assistances
      const todayAssistances = assistances.filter(a => 
        new Date(a.created_at) >= startOfDay
      ).length;

      // Calculate urgency distribution
      const urgencyDistribution = assistances.reduce((acc, assistance) => {
        const level = assistance.urgency_level || 'normal';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalAssistances: assistances.length,
        activeAssistances,
        todayAssistances,
        totalBuildings: buildingsResult.data?.length || 0,
        totalSuppliers: suppliersResult.data?.length || 0,
        urgencyDistribution
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return {
    stats,
    isLoadingStats
  };
}
