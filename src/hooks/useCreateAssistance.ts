
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateToken } from '@/utils/TokenUtils';
import { fetchValidStatuses } from '@/utils/StatusUtils';
import { AssistanceStatusValue } from '@/types/assistance';

export default async function useCreateAssistance(
  formData: any, 
  selectedBuilding: { id: number; name: string } | null
) {
  try {
    // Generate tokens
    const interaction_token = generateToken();
    const acceptance_token = generateToken();
    const scheduling_token = generateToken();
    const validation_token = generateToken();
    
    // Get valid statuses from DB to ensure we use a valid initial status
    let initialStatus: AssistanceStatusValue = 'Pendente Resposta Inicial';
    try {
      const validStatuses = await fetchValidStatuses();
      // Verify the status exists in the database
      if (!validStatuses.some(s => s.status_value === initialStatus)) {
        // If not found, use the first status in the list
        if (validStatuses.length > 0) {
          initialStatus = validStatuses[0].status_value as AssistanceStatusValue;
        }
        console.warn(`Status warning: Defaulting to ${initialStatus}`);
      }
    } catch (e) {
      console.error('Error fetching valid statuses:', e);
      // Continue with default status
    }
    
    console.log("Creating assistance with data:", {
      ...formData,
      interaction_token,
      acceptance_token,
      scheduling_token,
      validation_token,
      building_id: selectedBuilding?.id,
      status: initialStatus
    });

    // Make sure tokens are properly generated
    if (!interaction_token || !acceptance_token || !scheduling_token || !validation_token) {
      throw new Error('Falha ao gerar tokens de assistência');
    }

    const { data, error } = await supabase
      .from('assistances')
      .insert([
        { 
          ...formData,
          interaction_token,
          acceptance_token,
          scheduling_token,
          validation_token,
          building_id: selectedBuilding?.id,
          status: initialStatus,
          alert_level: 1
        }
      ])
      .select();

    if (error) {
      console.error('Erro ao criar assistência:', error);
      toast.error(`Erro ao criar assistência: ${error.message}`);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Nenhum dado retornado após inserção');
    }

    // Log activity
    try {
      await supabase
        .from('activity_log')
        .insert([{
          assistance_id: data[0].id,
          description: 'Assistência criada',
          actor: 'admin' 
        }]);
    } catch (logError) {
      // Don't throw if activity log fails, just log it
      console.error('Error creating activity log:', logError);
    }

    toast.success('Assistência criada com sucesso!');
    toast.info('Agora você pode enviar um email para o fornecedor com o link de aceitação.');
    
    return data[0];
  } catch (error: any) {
    console.error('Erro ao criar assistência:', error);
    toast.error('Erro ao criar assistência. Tente novamente.');
    throw error;
  }
}
