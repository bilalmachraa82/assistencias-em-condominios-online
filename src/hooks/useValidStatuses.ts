
import { useQuery } from '@tanstack/react-query';
import { fetchValidStatuses } from '@/utils/StatusUtils';
import { ValidStatus } from '@/types/assistance';

export default function useValidStatuses() {
  // versão única e tipada ✔️
  const { data, isLoading, error } = useQuery<ValidStatus[]>({
    queryKey: ['valid-statuses'],
    queryFn: fetchValidStatuses,
    staleTime: 300_000, // 5 min
  });

  // devolve SEMPRE um array do tipo correcto; nunca never[]
  return {
    statuses: (data ?? []) as ValidStatus[],
    loading: isLoading,
    error,
  };
}
