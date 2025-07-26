// TEMPORARY: Simple stub for useDashboardData to fix build errors
import { useState, useEffect } from 'react';

export interface DashboardStats {
  totalAssistances: number;
  pendingAssistances: number;
  urgentAssistances: number;
  recentAssistances: any[];
  assistancesByType: any[];
  assistancesByStatus: any[];
  monthlyData: any[];
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardStats>({
    totalAssistances: 0,
    pendingAssistances: 0,
    urgentAssistances: 0,
    recentAssistances: [],
    assistancesByType: [],
    assistancesByStatus: [],
    monthlyData: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Stub implementation - will be restored after schema migration is complete
    setLoading(false);
  }, []);

  return { data, loading, error };
}