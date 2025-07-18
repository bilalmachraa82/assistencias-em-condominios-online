
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

export function useDashboardData() {
  // Fetch general statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [assistancesResult, buildingsResult, suppliersResult] = await Promise.all([
        supabase.from('assistances').select('id, status, created_at, type'),
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
        a.status !== 'Concluído' && a.status !== 'Cancelado'
      ).length;

      // Calculate today's assistances
      const todayAssistances = assistances.filter(a => 
        new Date(a.created_at) >= startOfDay
      ).length;

      // Calculate type distribution (using existing 'type' field)
      const typeDistribution = assistances.reduce((acc, assistance) => {
        const type = assistance.type || 'normal';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Map to urgency-like categories for display
      const urgencyDistribution = {
        normal: typeDistribution['Manutenção'] || 0,
        urgent: typeDistribution['Reparação'] || 0,
        emergency: typeDistribution['Emergência'] || 0
      };

      // Calculate weekly trend (last 7 days)
      const weeklyTrendData = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return {
          date: d.toISOString().split('T')[0],
          assist: 0,
        };
      }).reverse();

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      assistances.forEach(a => {
        const assistanceDate = new Date(a.created_at);
        if (assistanceDate >= sevenDaysAgo) {
          const dateString = assistanceDate.toISOString().split('T')[0];
          const dayData = weeklyTrendData.find(d => d.date === dateString);
          if (dayData) {
            dayData.assist += 1;
          }
        }
      });
      
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const weeklyTrend = weeklyTrendData.map(d => ({
        name: dayNames[new Date(d.date).getUTCDay()],
        assist: d.assist,
      }));

      return {
        totalAssistances: assistances.length,
        activeAssistances,
        todayAssistances,
        totalBuildings: buildingsResult.data?.length || 0,
        totalSuppliers: suppliersResult.data?.length || 0,
        urgencyDistribution,
        weeklyTrend,
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return {
    stats,
    isLoadingStats
  };
}
