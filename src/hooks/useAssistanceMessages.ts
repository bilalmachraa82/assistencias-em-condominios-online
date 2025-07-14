
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { ServiceCommunication } from '@/types/database';

export function useServiceCommunications(serviceRequestId: string | undefined) {
  return useQuery<ServiceCommunication[]>({
    queryKey: ['service-communications', serviceRequestId],
    enabled: !!serviceRequestId,
    queryFn: async () => {
      if (!serviceRequestId) return [];
      const { data, error } = await supabase
        .from('service_communications')
        .select('*')
        .eq('service_request_id', serviceRequestId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useSendServiceCommunication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (communication: Omit<ServiceCommunication, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('service_communications')
        .insert([communication]);
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-communications', variables.service_request_id] });
    }
  });
}
