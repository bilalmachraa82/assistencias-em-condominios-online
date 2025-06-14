
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type AssistanceMessage = Tables<'assistance_messages'>;

export function useAssistanceMessages(assistanceId: number | undefined) {
  return useQuery<AssistanceMessage[]>({
    queryKey: ['assistance-messages', assistanceId],
    enabled: !!assistanceId,
    queryFn: async () => {
      if (!assistanceId) return [];
      const { data, error } = await supabase
        .from('assistance_messages')
        .select('*')
        .eq('assistance_id', assistanceId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useSendAssistanceMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (msg: Omit<AssistanceMessage, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('assistance_messages')
        .insert([msg]);
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assistance-messages', variables.assistance_id] });
    }
  });
}
