
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type RealtimeNotificationPayload = {
  message: string;
  type: 'info' | 'success' | 'warning';
};

type UseRealtimeAssistancesProps = {
  onNotification?: (notification: RealtimeNotificationPayload) => void;
};

export function useRealtimeAssistances({ onNotification }: UseRealtimeAssistancesProps = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleChanges = (payload: any) => {
      console.log('Assistance change detected:', payload);
      queryClient.invalidateQueries({ queryKey: ['assistances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      if (payload.eventType === 'INSERT') {
        const notification = { message: 'Nova assistência criada!', type: 'success' as const };
        toast.success(notification.message);
        onNotification?.(notification);
      } else if (payload.eventType === 'UPDATE') {
        const newData = payload.new as any;
        const notification = { message: `Assistência #${newData.id} atualizada: ${newData.status}`, type: 'info' as const };
        toast.info(notification.message);
        onNotification?.(notification);
      }
    };
    
    const handleMessageChanges = (payload: any) => {
        console.log('Message change detected:', payload);
        queryClient.invalidateQueries({ queryKey: ['assistance-messages'] });
        if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as any;
            const notification = { message: `Nova mensagem de ${newMessage.sender_name}`, type: 'info' as const };
            toast.info(notification.message);
            onNotification?.(notification);
        }
    };
      
    const handlePhotoChanges = (payload: any) => {
        console.log('Photo change detected:', payload);
        queryClient.invalidateQueries({ queryKey: ['assistance-photos'] });
        if (payload.eventType === 'INSERT') {
            const notification = { message: 'Nova foto adicionada!', type: 'info' as const };
            toast.info(notification.message);
            onNotification?.(notification);
        }
    };

    const channel = supabase
      .channel('assistance-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assistances' }, handleChanges)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assistance_messages' }, handleMessageChanges)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assistance_photos' }, handlePhotoChanges)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, onNotification]);
}
