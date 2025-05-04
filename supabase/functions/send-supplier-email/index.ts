
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
    
    // Get request origin to use as base URL
    const origin = req.headers.get('origin') || Deno.env.get('APP_BASE_URL') || '';
    
    console.log('Request origin:', origin);
    
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
    
    // Use the origin from the request as the base URL
    const baseUrl = origin;
    console.log('Using base URL:', baseUrl);
    
    switch(emailType) {
      case 'acceptance':
        if (!assistance.acceptance_token) {
          return new Response(
            JSON.stringify({ error: 'Token de aceitação não encontrado' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        emailSubject = `Nova Solicitação de Assistência - ${assistance.buildings.name}`;
        supplierActionUrl = `${baseUrl}/supplier/accept?token=${assistance.acceptance_token}`;
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
        supplierActionUrl = `${baseUrl}/supplier/schedule?token=${assistance.scheduling_token}`;
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
        supplierActionUrl = `${baseUrl}/supplier/complete?token=${assistance.validation_token}`;
        emailContent = generateValidationEmail(assistance, supplierActionUrl);
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: 'Tipo de email inválido' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
    }

    console.log('Sending email with Resend...');
    console.log('From: onboarding@resend.dev');
    console.log('To:', assistance.suppliers.email);
    console.log('Subject:', emailSubject);
    console.log('Action URL:', supplierActionUrl);

    // Send email using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'LuvImg <onboarding@resend.dev>',
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
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background-color: #6347ED; color: white; padding: 25px; text-align: center; }
        .logo { display: block; margin: 0 auto 15px; max-height: 50px; }
        .content { padding: 30px; background-color: #ffffff; }
        .footer { padding: 20px; text-align: center; background-color: #f7f7f9; font-size: 12px; color: #6b7280; }
        .button { display: inline-block; background-color: #1EAEDB; color: white; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; margin: 25px 0; border: none; }
        .details { margin: 25px 0; padding: 20px; background-color: #f7f7f9; border-left: 4px solid #6347ED; border-radius: 4px; }
        h1 { margin: 0; font-size: 24px; }
        .contact-info { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        .social-links a { display: inline-block; margin: 0 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://luvimg.com/img/luvimg-brand.svg" alt="LuvImg Logo" class="logo">
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
          
          <div class="contact-info">
            <p><strong>Precisa de ajuda?</strong> Entre em contato:</p>
            <p>Email: info@luvimg.com</p>
            <p>Telefone: +351 964 233 777</p>
            <div class="social-links">
              <a href="https://www.facebook.com/LuvImg">Facebook</a>
              <a href="https://www.instagram.com/luv.img">Instagram</a>
              <a href="https://www.linkedin.com/company/luvimg">LinkedIn</a>
            </div>
          </div>
        </div>
        <div class="footer">
          <p>Esta é uma mensagem automática, por favor não responda diretamente a este email.</p>
          <p>© ${new Date().getFullYear()} LuvImg - Lda. | NIF 515920380</p>
          <p>Rua António Luís Gomes 28A, 2750-335 Cascais</p>
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
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background-color: #6347ED; color: white; padding: 25px; text-align: center; }
        .logo { display: block; margin: 0 auto 15px; max-height: 50px; }
        .content { padding: 30px; background-color: #ffffff; }
        .footer { padding: 20px; text-align: center; background-color: #f7f7f9; font-size: 12px; color: #6b7280; }
        .button { display: inline-block; background-color: #1EAEDB; color: white; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; margin: 25px 0; border: none; }
        .details { margin: 25px 0; padding: 20px; background-color: #f7f7f9; border-left: 4px solid #6347ED; border-radius: 4px; }
        h1 { margin: 0; font-size: 24px; }
        .contact-info { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        .social-links a { display: inline-block; margin: 0 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://luvimg.com/img/luvimg-brand.svg" alt="LuvImg Logo" class="logo">
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
          
          <div class="contact-info">
            <p><strong>Precisa de ajuda?</strong> Entre em contato:</p>
            <p>Email: info@luvimg.com</p>
            <p>Telefone: +351 964 233 777</p>
            <div class="social-links">
              <a href="https://www.facebook.com/LuvImg">Facebook</a>
              <a href="https://www.instagram.com/luv.img">Instagram</a>
              <a href="https://www.linkedin.com/company/luvimg">LinkedIn</a>
            </div>
          </div>
        </div>
        <div class="footer">
          <p>Esta é uma mensagem automática, por favor não responda diretamente a este email.</p>
          <p>© ${new Date().getFullYear()} LuvImg - Lda. | NIF 515920380</p>
          <p>Rua António Luís Gomes 28A, 2750-335 Cascais</p>
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
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background-color: #6347ED; color: white; padding: 25px; text-align: center; }
        .logo { display: block; margin: 0 auto 15px; max-height: 50px; }
        .content { padding: 30px; background-color: #ffffff; }
        .footer { padding: 20px; text-align: center; background-color: #f7f7f9; font-size: 12px; color: #6b7280; }
        .button { display: inline-block; background-color: #1EAEDB; color: white; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; margin: 25px 0; border: none; }
        .details { margin: 25px 0; padding: 20px; background-color: #f7f7f9; border-left: 4px solid #6347ED; border-radius: 4px; }
        h1 { margin: 0; font-size: 24px; }
        .contact-info { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        .social-links a { display: inline-block; margin: 0 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://luvimg.com/img/luvimg-brand.svg" alt="LuvImg Logo" class="logo">
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
          
          <div class="contact-info">
            <p><strong>Precisa de ajuda?</strong> Entre em contato:</p>
            <p>Email: info@luvimg.com</p>
            <p>Telefone: +351 964 233 777</p>
            <div class="social-links">
              <a href="https://www.facebook.com/LuvImg">Facebook</a>
              <a href="https://www.instagram.com/luv.img">Instagram</a>
              <a href="https://www.linkedin.com/company/luvimg">LinkedIn</a>
            </div>
          </div>
        </div>
        <div class="footer">
          <p>Esta é uma mensagem automática, por favor não responda diretamente a este email.</p>
          <p>© ${new Date().getFullYear()} LuvImg - Lda. | NIF 515920380</p>
          <p>Rua António Luís Gomes 28A, 2750-335 Cascais</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
