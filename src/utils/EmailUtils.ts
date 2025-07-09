
import { toast } from 'sonner';
import { invokeEdgeFunction } from './edgeFunctions';

export async function sendAssistanceEmail(assistanceId: number, emailType: 'acceptance' | 'scheduling' | 'validation'): Promise<{ success: boolean; error?: string }> {
  console.log(`Requesting to send ${emailType} email for assistance ID: ${assistanceId}`);
  
  const result = await invokeEdgeFunction('send-supplier-email', {
    assistanceId,
    emailType
  }, { 
    showToastOnError: false  // Handle toast manually
  });

  if (result.success) {
    console.log(`Email de ${emailType} enviado com sucesso!`, result.data);
    return { success: true };
  } else {
    const errorMsg = result.error || `Erro ao enviar email de ${emailType}`;
    console.error(`Erro ao enviar email de ${emailType}:`, result.error);
    return { success: false, error: errorMsg };
  }
}
