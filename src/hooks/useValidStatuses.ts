
import { useQuery } from '@tanstack/react-query';
import { fetchValidStatuses } from '@/utils/StatusUtils';
import { ValidStatus } from '@/types/assistance';

export default function useValidStatuses() {
  // **ÚNICA** chamada ao React-Query, sem fallback que gere never[]
  const { data, isLoading, error } = useQuery<ValidStatus[]>({
    queryKey: ['valid-statuses'],
    queryFn: fetchValidStatuses,
    staleTime: 300_000, // 5 min
  });

  return {
    statuses: (data ?? []) as ValidStatus[], // devolve sempre ValidStatus[]
    loading: isLoading,
    error,
  };
}
