
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { ServiceAttachment } from '@/types/database';
import { Tables } from '@/integrations/supabase/types';

export function useServiceAttachments(serviceRequestId: string | undefined) {
  return useQuery<ServiceAttachment[]>({
    queryKey: ['service-attachments', serviceRequestId],
    enabled: !!serviceRequestId,
    queryFn: async () => {
      if (!serviceRequestId) return [];
      const { data, error } = await supabase
        .from('service_attachments')
        .select('*')
        .eq('service_request_id', serviceRequestId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        metadata: item.metadata as Record<string, any> || {}
      }));
    },
    staleTime: 30_000,
  });
}

export function useUploadServiceAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachment: Omit<ServiceAttachment, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('service_attachments')
        .insert([attachment]);
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-attachments', variables.service_request_id] });
    }
  });
}

// Backward compatibility alias
export const useAssistancePhotos = useServiceAttachments;
