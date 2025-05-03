
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
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
    const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'http://localhost:5173';
    
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Resend API Key não configurada' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { assistanceId, emailType } = await req.json();

    if (!assistanceId || !emailType) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros inválidos' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get assistance data with related tables
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

    // Determine which email to send based on emailType
    let emailSubject = '';
    let emailContent = '';
    let supplierActionUrl = '';
    
    switch(emailType) {
      case 'acceptance':
        if (!assistance.acceptance_token) {
          return new Response(
            JSON.stringify({ error: 'Token de aceitação não encontrado' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        emailSubject = `Nova Solicitação de Assistência - ${assistance.buildings.name}`;
        supplierActionUrl = `${appBaseUrl}/supplier/accept?token=${assistance.acceptance_token}`;
        emailContent = generateAcceptanceEmail(assistance, supplierActionUrl);
        break;
        
      case 'scheduling':
        if (!assistance.scheduling_token) {
          return new Response(
            JSON.stringify({ error: 'Token de agendamento não encontrado' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        emailSubject = `Agende a Assistência - ${assistance.buildings.name}`;
        supplierActionUrl = `${appBaseUrl}/supplier/schedule?token=${assistance.scheduling_token}`;
        emailContent = generateSchedulingEmail(assistance, supplierActionUrl);
        break;
        
      case 'validation':
        if (!assistance.validation_token) {
          return new Response(
            JSON.stringify({ error: 'Token de validação não encontrado' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        emailSubject = `Confirme a Conclusão da Assistência - ${assistance.buildings.name}`;
        supplierActionUrl = `${appBaseUrl}/supplier/complete?token=${assistance.validation_token}`;
        emailContent = generateValidationEmail(assistance, supplierActionUrl);
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: 'Tipo de email inválido' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
    }

    // Send email using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'AssisTech <noreply@assistech.app>',
        to: [assistance.suppliers.email],
        subject: emailSubject,
        html: emailContent,
      })
    });

    const emailResult = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error('Erro ao enviar email:', emailResult);
      return new Response(
        JSON.stringify({ error: 'Erro ao enviar email', details: emailResult }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

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

// Email template functions
function generateAcceptanceEmail(assistance: any, actionUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .footer { text-align: center; font-size: 12px; color: #6b7280; margin-top: 20px; }
        .button { display: inline-block; background-color: #4f46e5; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; margin: 20px 0; }
        .details { margin: 20px 0; padding: 15px; background-color: white; border-left: 4px solid #4f46e5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nova Solicitação de Assistência</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${assistance.suppliers.name}</strong>,</p>
          <p>Você recebeu uma nova solicitação de assistência técnica para o edifício <strong>${assistance.buildings.name}</strong>.</p>
          
          <div class="details">
            <p><strong>Tipo:</strong> ${assistance.type}</p>
            <p><strong>Categoria:</strong> ${assistance.intervention_types.name}</p>
            <p><strong>Localização:</strong> ${assistance.buildings.address}</p>
            <p><strong>Descrição:</strong> ${assistance.description}</p>
          </div>
          
          <p>Por favor, clique no botão abaixo para aceitar ou recusar esta solicitação:</p>
          <div style="text-align: center;">
            <a href="${actionUrl}" class="button">Responder à Solicitação</a>
          </div>
          <p>Este link é válido apenas para esta solicitação específica.</p>
        </div>
        <div class="footer">
          <p>Esta é uma mensagem automática, por favor não responda diretamente a este email.</p>
          <p>© ${new Date().getFullYear()} AssisTech - Sistema de Assistências Técnicas</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateSchedulingEmail(assistance: any, actionUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .footer { text-align: center; font-size: 12px; color: #6b7280; margin-top: 20px; }
        .button { display: inline-block; background-color: #0ea5e9; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; margin: 20px 0; }
        .details { margin: 20px 0; padding: 15px; background-color: white; border-left: 4px solid #0ea5e9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Agende a Assistência</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${assistance.suppliers.name}</strong>,</p>
          <p>Obrigado por aceitar a solicitação de assistência para o edifício <strong>${assistance.buildings.name}</strong>.</p>
          <p>O próximo passo é agendar uma data e hora para a realização do serviço.</p>
          
          <div class="details">
            <p><strong>Tipo:</strong> ${assistance.type}</p>
            <p><strong>Categoria:</strong> ${assistance.intervention_types.name}</p>
            <p><strong>Localização:</strong> ${assistance.buildings.address}</p>
            <p><strong>Descrição:</strong> ${assistance.description}</p>
          </div>
          
          <p>Por favor, clique no botão abaixo para agendar a sua visita:</p>
          <div style="text-align: center;">
            <a href="${actionUrl}" class="button">Agendar Assistência</a>
          </div>
          <p>Este link é válido apenas para esta solicitação específica.</p>
        </div>
        <div class="footer">
          <p>Esta é uma mensagem automática, por favor não responda diretamente a este email.</p>
          <p>© ${new Date().getFullYear()} AssisTech - Sistema de Assistências Técnicas</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateValidationEmail(assistance: any, actionUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .footer { text-align: center; font-size: 12px; color: #6b7280; margin-top: 20px; }
        .button { display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; margin: 20px 0; }
        .details { margin: 20px 0; padding: 15px; background-color: white; border-left: 4px solid #10b981; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Confirme a Conclusão do Serviço</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${assistance.suppliers.name}</strong>,</p>
          <p>Após realizar o serviço agendado para o edifício <strong>${assistance.buildings.name}</strong>, precisamos que confirme a sua conclusão.</p>
          
          <div class="details">
            <p><strong>Tipo:</strong> ${assistance.type}</p>
            <p><strong>Categoria:</strong> ${assistance.intervention_types.name}</p>
            <p><strong>Localização:</strong> ${assistance.buildings.address}</p>
            <p><strong>Descrição:</strong> ${assistance.description}</p>
          </div>
          
          <p>Por favor, clique no botão abaixo para confirmar a conclusão e enviar uma foto do serviço realizado:</p>
          <div style="text-align: center;">
            <a href="${actionUrl}" class="button">Confirmar Conclusão</a>
          </div>
          <p>Este link é válido apenas para esta solicitação específica.</p>
        </div>
        <div class="footer">
          <p>Esta é uma mensagem automática, por favor não responda diretamente a este email.</p>
          <p>© ${new Date().getFullYear()} AssisTech - Sistema de Assistências Técnicas</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
