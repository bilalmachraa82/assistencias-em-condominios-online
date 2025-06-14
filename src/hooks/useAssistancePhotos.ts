
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type AssistancePhoto = Tables<'assistance_photos'>;

export function useAssistancePhotos(assistanceId: number | undefined) {
  return useQuery<AssistancePhoto[]>({
    queryKey: ['assistance-photos', assistanceId],
    enabled: !!assistanceId,
    queryFn: async () => {
      if (!assistanceId) return [];
      const { data, error } = await supabase
        .from('assistance_photos')
        .select('*')
        .eq('assistance_id', assistanceId)
        .order('uploaded_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useUploadAssistancePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photo: Omit<AssistancePhoto, 'id' | 'uploaded_at'>) => {
      const { data, error } = await supabase
        .from('assistance_photos')
        .insert([photo]);
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assistance-photos', variables.assistance_id] });
    }
  });
}
