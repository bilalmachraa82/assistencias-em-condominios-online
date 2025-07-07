
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { generateAcceptanceEmail } from "./_templates/acceptance-email.ts";
import { generateSchedulingEmail } from "./_templates/scheduling-email.ts";
import { generateValidationEmail } from "./_templates/validation-email.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Function "send-supplier-email" invoked.');
  console.log(`Request method: ${req.method}`);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request.');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting execution inside try block.');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
    
    // Use the correct application domain instead of request origin
    const baseUrl = 'https://assistencias-em-condominios-online.lovable.app';
    
    console.log('Using base URL:', baseUrl);
    
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Resend API Key não configurada' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { assistanceId, emailType } = await req.json();
    console.log(`Received data: assistanceId=${assistanceId}, emailType=${emailType}`);

    if (!assistanceId || !emailType) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros inválidos' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log(`Fetching assistance data for ID: ${assistanceId}`);
    const { data: assistance, error: assistanceError } = await supabase
      .from('assistances')
      .select(`
        id, 
        description, 
        status, 
        type,
        acceptance_token,
        scheduling_token,
        validation_token,
        buildings!inner(id, name, address), 
        suppliers!inner(id, name, email, phone), 
        intervention_types!inner(id, name)
      `)
      .eq('id', assistanceId)
      .single();

    if (assistanceError) {
      console.error('Erro ao buscar assistência:', assistanceError);
      return new Response(
        JSON.stringify({ error: 'Assistência não encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    console.log('Assistance data fetched successfully:', assistance);

    // Helper function to generate a cryptographically secure token
    const generateToken = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const length = 32;
      const randomArray = new Uint8Array(length);
      crypto.getRandomValues(randomArray);
      return Array.from(randomArray, byte => chars[byte % chars.length]).join('');
    };

    const tokenFields = {
      acceptance: 'acceptance_token',
      scheduling: 'scheduling_token',
      validation: 'validation_token'
    };
    
    const tokenField = tokenFields[emailType];
    let token = assistance[tokenField];

    if (!token) {
      console.log(`Token for ${emailType} not found for assistance ${assistanceId}. Generating a new one.`);
      token = generateToken();
      const { error: updateError } = await supabase
        .from('assistances')
        .update({ [tokenField]: token })
        .eq('id', assistanceId);
      
      if (updateError) {
        console.error(`Failed to save new ${emailType} token for assistance ${assistanceId}:`, updateError);
        return new Response(
          JSON.stringify({ error: `Falha ao gerar e salvar novo token de ${emailType}.` }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      console.log(`New ${emailType} token generated and saved successfully.`);
      // Update assistance object with new token
      assistance[tokenField] = token;
    }

    let emailSubject = '';
    let emailContent = '';
    let supplierActionUrl = '';
    
    console.log('Using base URL for links:', baseUrl);
    
    switch(emailType) {
      case 'acceptance':
        emailSubject = `Nova Solicitação de Assistência - ${assistance.buildings.name}`;
        supplierActionUrl = `${baseUrl}/supplier/portal/${encodeURIComponent(assistance.acceptance_token)}`;
        emailContent = generateAcceptanceEmail(assistance, supplierActionUrl);
        break;

      case 'scheduling':
        emailSubject = `Agende a Assistência - ${assistance.buildings.name}`;
        supplierActionUrl = `${baseUrl}/supplier/portal/${encodeURIComponent(assistance.scheduling_token)}`;
        emailContent = generateSchedulingEmail(assistance, supplierActionUrl);
        break;

      case 'validation':
        emailSubject = `Confirme a Conclusão da Assistência - ${assistance.buildings.name}`;
        supplierActionUrl = `${baseUrl}/supplier/portal/${encodeURIComponent(assistance.validation_token)}`;
        emailContent = generateValidationEmail(assistance, supplierActionUrl);
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: 'Tipo de email inválido' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
    }

    const payload = {
      from: 'LuvImg - Administração de Condomínios <noreply@luvimg.com>',
      to: [assistance.suppliers.email],
      bcc: ['arquivo@luvimg.com'], // Archive all communications
      subject: emailSubject,
      html: emailContent,
    };

    console.log('Sending email with Resend. Email subject:', emailSubject);
    console.log('Supplier action URL:', supplierActionUrl);

    // Send email using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const emailResult = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error('Erro ao enviar email:', emailResult);
      return new Response(
        JSON.stringify({ error: 'Erro ao enviar email', details: emailResult }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('Email sent successfully via Resend. Response ID:', emailResult.id);

    // Log the email in the database
    await supabase
      .from('email_logs')
      .insert([{
        assistance_id: assistanceId,
        template_name: emailType,
        recipients: assistance.suppliers.email,
        success: true
      }]);

    // Log activity
    await supabase
      .from('activity_log')
      .insert([{
        assistance_id: assistanceId,
        description: `Email de ${emailType} enviado para o fornecedor`,
        actor: 'sistema'
      }]);

    return new Response(
      JSON.stringify({ success: true, message: 'Email enviado com sucesso', data: emailResult }),
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

// Email template function imports are now handled by the separate files
