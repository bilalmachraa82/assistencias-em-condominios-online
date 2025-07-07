
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
        supplierActionUrl = `${baseUrl}/supplier/portal?token=${assistance.acceptance_token}`;
        emailContent = generateAcceptanceEmail(assistance, supplierActionUrl);
        break;
        
      case 'scheduling':
        emailSubject = `Agende a Assistência - ${assistance.buildings.name}`;
        supplierActionUrl = `${baseUrl}/supplier/portal?token=${assistance.scheduling_token}`;
        emailContent = generateSchedulingEmail(assistance, supplierActionUrl);
        break;
        
      case 'validation':
        emailSubject = `Confirme a Conclusão da Assistência - ${assistance.buildings.name}`;
        supplierActionUrl = `${baseUrl}/supplier/portal?token=${assistance.validation_token}`;
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
          <img src="https://assistencias-em-condominios-online.lovable.app/lovable-uploads/42db5c3a-d970-4146-a940-7967cb8ae563.png" alt="Luv.img - Administração de Condomínios" class="logo">
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
          
          <p>Para gerir esta assistência, aceda ao seu portal personalizado:</p>
          <div style="text-align: center;">
            <a href="${actionUrl}" class="button">ACEDER AO PORTAL DO FORNECEDOR</a>
          </div>
          <div style="background-color: #f8fafc; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10B981;">
            <p style="margin: 0; font-size: 14px; color: #475569;">
              <strong>🚀 Portal completo com:</strong><br>
              • Comunicação em tempo real com o administrador<br>
              • Upload de fotos organizadas por categoria<br>
              • Timeline completa da assistência<br>
              • Todas as ações necessárias num só local
            </p>
          </div>
          
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
          <p>© ${new Date().getFullYear()} LuvImg - Administração de Condomínios | NIF 515920380</p>
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
          <img src="https://assistencias-em-condominios-online.lovable.app/lovable-uploads/42db5c3a-d970-4146-a940-7967cb8ae563.png" alt="Luv.img - Administração de Condomínios" class="logo">
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
          
          <p>Para gerir esta assistência, aceda ao seu portal personalizado:</p>
          <div style="text-align: center;">
            <a href="${actionUrl}" class="button">ACEDER AO PORTAL DO FORNECEDOR</a>
          </div>
          <div style="background-color: #f8fafc; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #3B82F6;">
            <p style="margin: 0; font-size: 14px; color: #475569;">
              <strong>📅 No portal pode:</strong><br>
              • Confirmar ou reagendar a assistência<br>
              • Comunicar em tempo real com notificações<br>
              • Enviar fotos do progresso do trabalho<br>
              • Ver timeline completa e histórico
            </p>
          </div>
          
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
          <p>© ${new Date().getFullYear()} LuvImg - Administração de Condomínios | NIF 515920380</p>
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
          <img src="https://assistencias-em-condominios-online.lovable.app/lovable-uploads/42db5c3a-d970-4146-a940-7967cb8ae563.png" alt="Luv.img - Administração de Condomínios" class="logo">
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
          
          <p>Para finalizar esta assistência, aceda ao seu portal personalizado:</p>
          <div style="text-align: center;">
            <a href="${actionUrl}" class="button">ACEDER AO PORTAL DO FORNECEDOR</a>
          </div>
          <div style="background-color: #f8fafc; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #059669;">
            <p style="margin: 0; font-size: 14px; color: #475569;">
              <strong>✅ Para finalizar:</strong><br>
              • Confirme a conclusão do trabalho<br>
              • Envie fotos do resultado final<br>
              • Adicione notas finais se necessário<br>
              • Mantenha comunicação ativa até ao fecho
            </p>
          </div>
          
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
          <p>© ${new Date().getFullYear()} LuvImg - Administração de Condomínios | NIF 515920380</p>
          <p>Rua António Luís Gomes 28A, 2750-335 Cascais</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
