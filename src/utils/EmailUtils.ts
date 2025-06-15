
import { toast } from 'sonner';

export async function sendAssistanceEmail(assistanceId: number, emailType: 'acceptance' | 'scheduling' | 'validation'): Promise<{ success: boolean; error?: string }> {
  console.log(`Requesting to send ${emailType} email for assistance ID: ${assistanceId}`);
  
  try {
    // Note: The function URL should be in an environment variable in a real-world app
    const response = await fetch('https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/send-supplier-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistanceId,
        emailType
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `Erro ao enviar email de ${emailType}`);
    }

    console.log(`Email de ${emailType} enviado com sucesso!`);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : `Erro ao enviar email de ${emailType}`;
    console.error(`Erro ao enviar email de ${emailType}:`, error);
    return { success: false, error: errorMsg };
  }
}
