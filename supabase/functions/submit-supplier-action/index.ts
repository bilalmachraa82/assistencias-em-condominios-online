
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    let newStatus = '';

    switch(action) {
      case 'accept':
        tokenField = 'acceptance_token';
        newStatus = 'Pendente Agendamento';
        break;
      case 'reject':
        tokenField = 'acceptance_token';
        newStatus = 'Recusada';
        updateData = { rejection_reason: data?.reason || '' };
        break;
      case 'schedule':
        tokenField = 'scheduling_token';
        newStatus = 'Agendado';
        updateData = { scheduled_datetime: data?.datetime || null };
        break;
      case 'reschedule':
        tokenField = 'scheduling_token';
        newStatus = 'Reagendamento';
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
      // Create storage bucket if it doesn't exist (this is normally done in SQL migration)
      try {
        const { data: bucket, error: bucketError } = await supabase
          .storage.getBucket('completion-photos');
          
        if (bucketError) {
          const { data: newBucket, error: createBucketError } = await supabase
            .storage.createBucket('completion-photos', { public: true });
            
          if (createBucketError) {
            console.error('Erro ao criar bucket:', createBucketError);
          }
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

    // First, check if the status value is allowed in the database
    const { data: allowedStatuses, error: statusCheckError } = await supabase
      .rpc('get_allowed_status_values');
    
    if (statusCheckError) {
      // If the function doesn't exist, continue with the update
      console.warn('Could not check allowed status values:', statusCheckError);
    } else {
      // If function exists and returns values, validate the status
      if (allowedStatuses && !allowedStatuses.includes(newStatus)) {
        console.error('Status inválido:', newStatus, 'Allowed values:', allowedStatuses);
        // Try to use a fallback status that is likely to work
        if (action === 'accept') {
          updateData.status = 'Em Andamento';
        } else if (action === 'reject') {
          updateData.status = 'Cancelada';
        } else if (action === 'complete') {
          updateData.status = 'Concluída';
        }
        console.log('Using fallback status:', updateData.status);
      }
    }

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
    await supabase
      .from('activity_log')
      .insert([{
        assistance_id: assistance.id,
        description: `Fornecedor: Ação ${action} realizada. Status atualizado para ${updateData.status}`,
        actor: 'Fornecedor'
      }]);

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
