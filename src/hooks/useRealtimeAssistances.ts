
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useRealtimeAssistances() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to real-time changes in assistances table
    const channel = supabase
      .channel('assistance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assistances'
        },
        (payload) => {
          console.log('Assistance change detected:', payload);
          
          // Invalidate and refetch assistances data
          queryClient.invalidateQueries({ queryKey: ['assistances'] });
          
          // Show notification based on event type
          if (payload.eventType === 'INSERT') {
            toast.success('Nova assistência criada!');
          } else if (payload.eventType === 'UPDATE') {
            const newData = payload.new as any;
            toast.info(`Assistência #${newData.id} atualizada: ${newData.status}`);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assistance_messages'
        },
        (payload) => {
          console.log('Message change detected:', payload);
          
          // Invalidate messages queries
          queryClient.invalidateQueries({ queryKey: ['assistance-messages'] });
          
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as any;
            toast.info(`Nova mensagem de ${newMessage.sender_name}`);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assistance_photos'
        },
        (payload) => {
          console.log('Photo change detected:', payload);
          
          // Invalidate photos queries
          queryClient.invalidateQueries({ queryKey: ['assistance-photos'] });
          
          if (payload.eventType === 'INSERT') {
            toast.info('Nova foto adicionada!');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
