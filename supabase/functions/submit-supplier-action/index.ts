import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function for CORS responses
function createCorsResponse(body: any, status = 200) {
  return new Response(
    JSON.stringify(body),
    { 
      status, 
      headers: { 
        'Content-Type': 'application/json', 
        ...corsHeaders 
      } 
    }
  );
}

// Helper function to handle errors consistently
function handleError(message: string, details: any = null, status = 500) {
  console.error(`Error: ${message}`, details);
  return createCorsResponse({ 
    error: message,
    details: details || undefined 
  }, status);
}

// Mapping of action to required token field names
const tokenFieldMap = {
  'accept': 'acceptance_token',
  'reject': 'acceptance_token',
  'schedule': 'scheduling_token',
  'reschedule': 'scheduling_token',
  'complete': 'validation_token'
};

// Status transitions based on actions
const statusTransitions = {
  'accept': (data?: any) => data?.datetime ? 'Agendado' : 'Pendente Agendamento',
  'reject': () => 'Recusada Fornecedor',
  'schedule': () => 'Agendado',
  'reschedule': () => 'Agendado',
  'complete': () => 'Pendente Validação'
};

// Extra data to include with updates based on action
function getExtraUpdateData(action: string, data?: any): Record<string, any> {
  switch(action) {
    case 'reject':
      return { rejection_reason: data?.reason || '' };
    case 'schedule':
      return { scheduled_datetime: data?.datetime || null };
    case 'reschedule':
      return { 
        scheduled_datetime: data?.datetime || null,
        reschedule_reason: data?.reason || '' 
      };
    case 'complete':
      return { validation_reminder_count: 0 };
    case 'accept':
      if (data?.datetime) {
        return { scheduled_datetime: data.datetime };
      }
      return {};
    default:
      return {};
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Error parsing JSON body:", e);
      return handleError('Invalid JSON in request body', null, 400);
    }
    
    const { action, token, data } = body;

    console.log('Processing action:', action, 'with token:', token);
    console.log('Data received:', JSON.stringify(data));

    if (!token || !action) {
      return handleError('Parâmetros inválidos', null, 400);
    }
    
    // Validate action type
    if (!tokenFieldMap[action]) {
      return handleError('Ação inválida', null, 400);
    }

    // Get token field for this action
    const tokenField = tokenFieldMap[action];

    // First, get the assistance to verify it exists and check current status
    const { data: assistance, error: assistanceError } = await supabase
      .from('assistances')
      .select('id, status, supplier_id')
      .eq(tokenField, token)
      .single();

    if (assistanceError) {
      console.error('Erro ao buscar assistência:', assistanceError);
      return createCorsResponse(
        { error: 'Token inválido ou assistência não encontrada' },
        404
      );
    }

    console.log('Found assistance:', assistance);

    // Determine the new status based on the action
    const determineStatus = statusTransitions[action] || (() => '');
    const newStatus = determineStatus(data);
    
    if (!newStatus) {
      return handleError('Status não pôde ser determinado para esta ação', null, 400);
    }
    
    console.log(`Setting status from "${assistance.status}" to "${newStatus}"`);
    
    // Update the assistance using RPC function
    try {
      const extraData = getExtraUpdateData(action, data);
      console.log('Extra update data:', extraData);
      
      // First, update the status using the RPC function
      const { data: rpcResult, error: rpcError } = await supabase.rpc('update_assistance_status', {
        p_assistance_id: assistance.id,
        p_new_status: newStatus,
        p_scheduled_datetime: extraData.scheduled_datetime || null
      });
      
      if (rpcError) {
        console.error('Erro ao atualizar status via RPC:', rpcError);
        return handleError(`Erro ao atualizar status: ${rpcError.message}`, rpcError, 500);
      }
      
      console.log('Status updated successfully via RPC');
      
      // If we have any other fields to update beyond what the RPC function covers
      const otherFields = Object.keys(extraData).filter(k => k !== 'scheduled_datetime');
      
      if (otherFields.length > 0) {
        const updateData = {};
        otherFields.forEach(field => {
          updateData[field] = extraData[field];
        });
        
        console.log('Updating additional fields:', updateData);
        
        const { error: updateError } = await supabase
          .from('assistances')
          .update(updateData)
          .eq('id', assistance.id);
          
        if (updateError) {
          console.error('Erro ao atualizar campos adicionais:', updateError);
          // Continue despite error, as the status was already updated
        }
      }
    } catch (updateError) {
      console.error('Exception updating assistance:', updateError);
      return handleError('Erro ao processar ação', updateError, 500);
    }

    // Log the activity
    try {
      await supabase
        .from('activity_log')
        .insert([{
          description: `Fornecedor: Ação ${action} realizada. Status atualizado para ${newStatus}`,
          actor: 'supplier',
          assistance_id: assistance.id
        }]);
    } catch (logError) {
      console.error('Erro ao registrar log de atividade:', logError);
      // Continue without failing if logging fails
    }

    return createCorsResponse({ 
      success: true, 
      message: 'Ação processada com sucesso' 
    });
  } catch (error) {
    console.error('Erro no processamento:', error.message);
    return handleError('Erro ao processar assistência', error.message);
  }
});

// Helper function to upload completion photos is kept but moved to the end
async function uploadCompletionPhoto(supabase, assistanceId, photoBase64) {
  try {
    // Check if bucket exists
    const { data: bucketData, error: bucketError } = await supabase
      .storage.getBucket('completion-photos');
      
    if (bucketError) {
      console.log('Bucket does not exist, creating it...');
      // Bucket doesn't exist, create it
      await supabase.storage.createBucket('completion-photos', { 
        public: true 
      });
    } else {
      console.log('Bucket already exists:', bucketData);
    }
  } catch (e) {
    console.error('Erro ao verificar/criar bucket:', e);
    return null;
  }

  // Convert base64 to file
  const base64Data = photoBase64.split(',')[1];
  const photoBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
  
  // Upload to storage
  const fileName = `assistance_${assistanceId}_completion_${Date.now()}.jpg`;
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('completion-photos')
    .upload(fileName, photoBuffer, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (uploadError) {
    console.error('Erro ao fazer upload da foto:', uploadError);
    return null;
  }

  // Get public URL
  const { data: publicUrlData } = supabase
    .storage
    .from('completion-photos')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}
