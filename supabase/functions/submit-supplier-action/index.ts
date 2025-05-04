
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define the allowed statuses by querying from the database
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

    if (!token || !action) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros inválidos' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Validate token and get assistance
    let tokenField;
    let updateData: any = {};
    
    // Try to fetch valid statuses from database
    console.log('Fetching valid statuses from database');
    const { data: statusValues, error: statusError } = await supabase
      .from('valid_statuses')
      .select('status_value')
      .order('display_order');
      
    if (statusError) {
      console.error('Error fetching valid statuses:', statusError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar status válidos' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    const validStatuses = statusValues.map(item => item.status_value);
    console.log(`Found ${validStatuses.length} valid statuses in database`);

    let newStatus = '';

    switch(action) {
      case 'accept':
        tokenField = 'acceptance_token';
        // If scheduling data is provided in the same action
        if (data?.datetime) {
          updateData.scheduled_datetime = data.datetime;
          newStatus = 'Agendado';
        } else {
          newStatus = 'Pendente Agendamento';
        }
        break;
      case 'reject':
        tokenField = 'acceptance_token';
        newStatus = 'Recusada Fornecedor';
        updateData = { rejection_reason: data?.reason || '' };
        break;
      case 'schedule':
        tokenField = 'scheduling_token';
        newStatus = 'Agendado';
        updateData = { scheduled_datetime: data?.datetime || null };
        break;
      case 'reschedule':
        tokenField = 'scheduling_token';
        newStatus = 'Agendado';
        updateData = { 
          scheduled_datetime: data?.datetime || null,
          reschedule_reason: data?.reason || '' 
        };
        break;
      case 'complete':
        tokenField = 'validation_token';
        newStatus = 'Pendente Validação';
        // Photo URL will be handled separately
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Ação inválida' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
    }

    // Print out the current valid statuses array for debugging
    console.log('Valid statuses are:', validStatuses.join(', '));
    console.log('New status being applied:', newStatus);

    // Verify the new status is valid
    if (!validStatuses.includes(newStatus)) {
      console.error(`Invalid status: ${newStatus}. Valid statuses are: ${validStatuses.join(', ')}`);
      return new Response(
        JSON.stringify({ error: `Status inválido: ${newStatus}` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get assistance with the provided token
    const { data: assistance, error: assistanceError } = await supabase
      .from('assistances')
      .select('id, status, supplier_id')
      .eq(tokenField, token)
      .single();

    if (assistanceError) {
      console.error('Erro ao buscar assistência:', assistanceError);
      return new Response(
        JSON.stringify({ error: 'Token inválido ou assistência não encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('Found assistance:', assistance);

    // Handle file upload for completion action
    if (action === 'complete' && data?.photoBase64) {
      try {
        const { data: bucket, error: bucketError } = await supabase
          .storage.getBucket('completion-photos');
          
        if (bucketError) {
          // Bucket doesn't exist, create it
          await supabase.storage.createBucket('completion-photos', { 
            public: true 
          });
        }
      } catch (e) {
        console.error('Erro ao verificar/criar bucket:', e);
      }

      // Convert base64 to file
      const base64Data = data.photoBase64.split(',')[1];
      const photoBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      
      // Upload to storage
      const fileName = `assistance_${assistance.id}_completion_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('completion-photos')
        .upload(fileName, photoBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Erro ao fazer upload da foto:', uploadError);
        return new Response(
          JSON.stringify({ error: 'Erro ao fazer upload da foto' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Get public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('completion-photos')
        .getPublicUrl(fileName);

      updateData.completion_photo_url = publicUrlData.publicUrl;
      updateData.validation_reminder_count = 0;
    }

    // Update assistance status and data
    updateData.status = newStatus;
    updateData.updated_at = new Date().toISOString();

    console.log('Updating assistance with data:', updateData);

    // Update the assistance
    const { error: updateError } = await supabase
      .from('assistances')
      .update(updateData)
      .eq('id', assistance.id);

    if (updateError) {
      console.error('Erro ao atualizar assistência:', updateError);
      return new Response(
        JSON.stringify({ error: `Erro ao processar ação: ${updateError.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
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

    return new Response(
      JSON.stringify({ success: true, message: 'Ação processada com sucesso' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro:', error.message);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
