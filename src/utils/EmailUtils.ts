
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export async function sendAssistanceEmail(assistanceId: number, emailType: 'acceptance' | 'scheduling' | 'validation'): Promise<{ success: boolean; error?: string }> {
  console.log(`Requesting to send ${emailType} email for assistance ID: ${assistanceId}`);
  
  try {
    const { data, error } = await supabase.functions.invoke('send-supplier-email', {
      body: {
        assistanceId,
        emailType
      }
    });

    if (error) {
      throw new Error(error.message || `Erro ao enviar email de ${emailType}`);
    }

    console.log(`Email de ${emailType} enviado com sucesso!`, data);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : `Erro ao enviar email de ${emailType}`;
    console.error(`Erro ao enviar email de ${emailType}:`, error);
    return { success: false, error: errorMsg };
  }
}
