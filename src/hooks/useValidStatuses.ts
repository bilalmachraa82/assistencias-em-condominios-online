
import { useQuery } from '@tanstack/react-query';
import { fetchValidStatuses } from '@/utils/StatusUtils';
import { ValidStatus } from '@/types/assistance';

export default function useValidStatuses() {
  const { data, isLoading, error } = useQuery<ValidStatus[]>({
    queryKey: ['valid-statuses'],
    queryFn: fetchValidStatuses,
    staleTime: 300_000, // 5 min
  });

  return {
    statuses: data ?? [],
    loading: isLoading,
    error,
  };
}
