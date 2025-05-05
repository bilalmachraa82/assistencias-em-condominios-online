
import { useQuery } from '@tanstack/react-query';
import { fetchValidStatuses } from '@/utils/StatusUtils';
import { ValidStatus } from '@/types/assistance';

export default function useValidStatuses() {
  const { data = [], isLoading, error } = useQuery<ValidStatus[]>({
    queryKey: ['valid-statuses'],
    queryFn: fetchValidStatuses,
    staleTime: 60_000, // 1 minute
  });

  return { statuses: data, loading: isLoading, error };
}
