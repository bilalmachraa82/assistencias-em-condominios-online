
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateToken } from '@/utils/TokenUtils';

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
    
    console.log("Creating assistance with data:", {
      ...formData,
      interaction_token,
      acceptance_token,
      scheduling_token,
      validation_token,
      building_id: selectedBuilding?.id,
      status: 'Pendente Resposta Inicial'
    });

    // Make sure tokens are properly generated
    if (!acceptance_token || !scheduling_token || !validation_token) {
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
          status: 'Pendente Resposta Inicial',
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

    // Log activity - fix the actor parameter to match the allowed values in the database
    try {
      await supabase
        .from('activity_log')
        .insert([{
          assistance_id: data[0].id,
          description: 'Assistência criada',
          actor: 'admin' // Changed from 'Admin' to 'admin' to match constraint
        }]);
    } catch (logError) {
      // Don't throw if activity log fails, just log it
      console.error('Error creating activity log:', logError);
    }

    toast.success('Assistência criada com sucesso!');
    toast.info('Agora você pode enviar um email para o fornecedor com o link de aceitação.');
    
    return data[0];
  } catch (error) {
    console.error('Erro ao criar assistência:', error);
    toast.error('Erro ao criar assistência. Tente novamente.');
    throw error;
  }
}
