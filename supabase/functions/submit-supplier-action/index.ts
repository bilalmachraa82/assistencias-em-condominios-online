
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
    
    const body = await req.json();
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

    // Get valid status values from the database
    console.log('Fetching valid statuses from database');
    const { data: statusValues, error: statusError } = await supabase
      .from('valid_statuses')
      .select('status_value')
      .order('display_order');
      
    // Hard-coded valid statuses as fallback
    const validStatusArray = [
      'Pendente Resposta Inicial',
      'Pendente Aceitação',
      'Recusada Fornecedor',
      'Pendente Agendamento',
      'Agendado',
      'Em Progresso',
      'Pendente Validação',
      'Concluído',
      'Reagendamento Solicitado',
      'Validação Expirada',
      'Cancelado'
    ];
    
    // Use database values if available, fallback to hard-coded values
    const validStatuses = statusError || !statusValues?.length 
      ? validStatusArray 
      : statusValues.map(item => item.status_value);
    
    console.log(`Using ${validStatuses.length} valid statuses:`, validStatuses);
    
    // Determine the new status based on the action
    const determineStatus = statusTransitions[action] || (() => '');
    const newStatus = determineStatus(data);
    
    if (!newStatus) {
      return handleError('Status não pôde ser determinado para esta ação', null, 400);
    }
    
    // Validate the new status against the list of valid statuses (case-insensitive)
    let validStatus = false;
    let matchedStatus = '';
    
    for (const status of validStatuses) {
      if (status.toLowerCase() === newStatus.toLowerCase()) {
        validStatus = true;
        matchedStatus = status; // Use the exact case from the valid statuses
        break;
      }
    }
    
    if (!validStatus) {
      console.error(`Invalid status: ${newStatus}. Not found in valid statuses list.`);
      return handleError(
        `Status inválido: ${newStatus}. Não encontrado na lista de status válidos.`,
        { validStatuses },
        400
      );
    }
    
    // Use the matched status with exact casing from validStatuses
    const validatedStatus = matchedStatus;
    console.log(`Using validated status: ${validatedStatus}`);
    
    try {
      const result = await processAssistance(
        supabase, 
        token, 
        tokenField, 
        getExtraUpdateData(action, data), 
        validatedStatus, 
        action, 
        data
      );
      return result;
    } catch (error) {
      return handleError('Erro ao processar assistência', error.message);
    }
    
  } catch (error) {
    return handleError('Erro interno do servidor', error.message);
  }
});

async function processAssistance(
  supabase, 
  token, 
  tokenField, 
  updateData, 
  newStatus, 
  action, 
  data
) {
  try {
    // Get assistance with the provided token
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

    // Handle file upload for completion action
    if (action === 'complete' && data?.photoBase64) {
      const photoUrl = await uploadCompletionPhoto(
        supabase, 
        assistance.id, 
        data.photoBase64
      );
      if (photoUrl) {
        updateData.completion_photo_url = photoUrl;
      }
    }

    // Update assistance status and data
    updateData.status = newStatus;
    updateData.updated_at = new Date().toISOString();

    console.log('Updating assistance with data:', updateData);
    
    // Get current status to debug any issues
    const { data: currentStatus, error: currentStatusError } = await supabase
      .from('assistances')
      .select('status')
      .eq('id', assistance.id)
      .single();
      
    if (currentStatusError) {
      console.error('Error getting current status:', currentStatusError);
    } else {
      console.log('Current status:', currentStatus.status);
    }

    // Verify status existence in valid_statuses table
    const { data: validCheck, error: validCheckError } = await supabase
      .from('valid_statuses')
      .select('status_value')
      .eq('status_value', newStatus)
      .single();
      
    if (validCheckError) {
      console.error('Status validation check failed:', validCheckError);
      console.log('Attempted status was:', newStatus);
      
      return createCorsResponse({ 
        error: 'O status especificado não existe na lista de status válidos.',
        details: `Tentativa de status: ${newStatus}`
      }, 400);
    }
    
    console.log('Status validated successfully, proceeding with update');
    
    // Update the assistance
    const { error: updateError } = await supabase
      .from('assistances')
      .update(updateData)
      .eq('id', assistance.id);

    if (updateError) {
      console.error('Erro ao atualizar assistência:', updateError);
      
      return createCorsResponse({ 
        error: `Erro ao processar ação: ${updateError.message}`,
        details: `Status: ${updateData.status}`
      }, 500);
    }

    // Log the activity
    try {
      await supabase
        .from('activity_log')
        .insert([{
          description: `Fornecedor: Ação ${action} realizada. Status atualizado para ${updateData.status}`,
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
    return createCorsResponse({ 
      error: 'Erro ao processar assistência', 
      details: error.message 
    }, 500);
  }
}

// Helper function to upload completion photos
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
