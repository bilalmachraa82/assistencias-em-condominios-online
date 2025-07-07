
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

// Email template functions
function generateAcceptanceEmail(assistance: any, actionUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nova Solicitação de Assistência - Luv.img</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5;">
        
        <!-- Container Principal -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    
                    <!-- Email Container -->
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #4a9b9e 0%, #3a7b7e 100%); padding: 30px 40px; border-radius: 8px 8px 0 0;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center">
                                            <!-- Logo -->
                                            <img src="https://assistencias-em-condominios-online.lovable.app/lovable-uploads/42db5c3a-d970-4146-a940-7967cb8ae563.png" alt="Luv.img" style="height: 50px; margin-bottom: 10px;">
                                            <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 300;">Nova Solicitação de Assistência</h1>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Conteúdo Principal -->
                        <tr>
                            <td style="padding: 40px;">
                                
                                <!-- Saudação -->
                                <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                                    Olá <strong>${assistance.suppliers.name}</strong>,
                                </p>
                                
                                <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                                    Recebeu uma nova solicitação de assistência técnica para o edifício <strong>${assistance.buildings.name}</strong>.
                                </p>
                                
                                <!-- Detalhes da Solicitação -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafb; border-radius: 6px; padding: 25px; margin-bottom: 30px;">
                                    <tr>
                                        <td>
                                            <h2 style="color: #3a7b7e; font-size: 18px; margin: 0 0 20px 0; font-weight: 500;">Detalhes da Solicitação</h2>
                                            
                                            <table width="100%" border="0" cellspacing="0" cellpadding="8">
                                                <tr>
                                                    <td width="35%" style="color: #666666; font-size: 14px; vertical-align: top;"><strong>Tipo:</strong></td>
                                                    <td style="color: #333333; font-size: 14px;">${assistance.type}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #666666; font-size: 14px; vertical-align: top;"><strong>Categoria:</strong></td>
                                                    <td style="color: #333333; font-size: 14px;">${assistance.intervention_types.name}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #666666; font-size: 14px; vertical-align: top;"><strong>Localização:</strong></td>
                                                    <td style="color: #333333; font-size: 14px;">${assistance.buildings.address}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #666666; font-size: 14px; vertical-align: top;"><strong>Descrição:</strong></td>
                                                    <td style="color: #333333; font-size: 14px; line-height: 1.5;">${assistance.description}</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                                    Para gerir esta assistência, aceda ao seu portal personalizado:
                                </p>
                                
                                <!-- Botão CTA -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center" style="padding: 0 0 30px 0;">
                                            <a href="${actionUrl}" style="display: inline-block; padding: 14px 40px; background-color: #4a9b9e; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
                                                ACEDER AO PORTAL DO FORNECEDOR
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Funcionalidades do Portal -->
                                <div style="background-color: #f8fafb; border-left: 4px solid #4a9b9e; padding: 20px; margin-bottom: 30px; border-radius: 0 6px 6px 0;">
                                    <p style="color: #333333; font-size: 14px; margin: 0 0 10px 0; font-weight: 500;">
                                        <strong>Portal completo com:</strong>
                                    </p>
                                    <ul style="color: #666666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                        <li>Comunicação em tempo real com o administrador</li>
                                        <li>Upload de fotos organizadas por categoria</li>
                                        <li>Timeline completa da assistência</li>
                                        <li>Todas as ações necessárias num só local</li>
                                    </ul>
                                </div>
                                
                                <!-- Informação de Contacto -->
                                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 5px 0;">
                                    <strong>Precisa de ajuda?</strong> Entre em contacto:
                                </p>
                                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
                                    Email: <a href="mailto:info@luvimg.com" style="color: #4a9b9e; text-decoration: none;">info@luvimg.com</a><br>
                                    Telefone: <a href="tel:+351964233777" style="color: #4a9b9e; text-decoration: none;">+351 964 233 777</a>
                                </p>
                                
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8fafb; padding: 30px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e5e5;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center">
                                            <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0 0 10px 0;">
                                                Esta é uma mensagem automática, por favor não responda diretamente a este email.
                                            </p>
                                            <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0 0 15px 0;">
                                                © ${new Date().getFullYear()} Luv.img - Administração de Condomínios | NIF: 516800960
                                            </p>
                                            <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0;">
                                                Rua António Luís Gomes 25A, 2790-356 Cascais
                                            </p>
                                            
                                            <!-- Links Sociais -->
                                            <table border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
                                                <tr>
                                                    <td style="padding: 0 10px;">
                                                        <a href="https://www.facebook.com/LuvImg" style="color: #4a9b9e; text-decoration: none; font-size: 12px;">Facebook</a>
                                                    </td>
                                                    <td style="padding: 0 10px; border-left: 1px solid #cccccc;">
                                                        <a href="https://www.instagram.com/luv.img" style="color: #4a9b9e; text-decoration: none; font-size: 12px;">Instagram</a>
                                                    </td>
                                                    <td style="padding: 0 10px; border-left: 1px solid #cccccc;">
                                                        <a href="https://www.linkedin.com/company/luvimg" style="color: #4a9b9e; text-decoration: none; font-size: 12px;">LinkedIn</a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                    </table>
                    <!-- Fim Email Container -->
                    
                </td>
            </tr>
        </table>
        
    </body>
    </html>
  `;
}

function generateSchedulingEmail(assistance: any, actionUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Agende a Assistência - Luv.img</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5;">
        
        <!-- Container Principal -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    
                    <!-- Email Container -->
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #4a9b9e 0%, #3a7b7e 100%); padding: 30px 40px; border-radius: 8px 8px 0 0;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center">
                                            <!-- Logo -->
                                            <img src="https://assistencias-em-condominios-online.lovable.app/lovable-uploads/42db5c3a-d970-4146-a940-7967cb8ae563.png" alt="Luv.img" style="height: 50px; margin-bottom: 10px;">
                                            <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 300;">Agende a Assistência</h1>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Conteúdo Principal -->
                        <tr>
                            <td style="padding: 40px;">
                                
                                <!-- Saudação -->
                                <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                                    Olá <strong>${assistance.suppliers.name}</strong>,
                                </p>
                                
                                <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                                    Obrigado por aceitar a solicitação de assistência para o edifício <strong>${assistance.buildings.name}</strong>. O próximo passo é agendar uma data e hora para a realização do serviço.
                                </p>
                                
                                <!-- Detalhes da Solicitação -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafb; border-radius: 6px; padding: 25px; margin-bottom: 30px;">
                                    <tr>
                                        <td>
                                            <h2 style="color: #3a7b7e; font-size: 18px; margin: 0 0 20px 0; font-weight: 500;">Detalhes da Assistência</h2>
                                            
                                            <table width="100%" border="0" cellspacing="0" cellpadding="8">
                                                <tr>
                                                    <td width="35%" style="color: #666666; font-size: 14px; vertical-align: top;"><strong>Tipo:</strong></td>
                                                    <td style="color: #333333; font-size: 14px;">${assistance.type}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #666666; font-size: 14px; vertical-align: top;"><strong>Categoria:</strong></td>
                                                    <td style="color: #333333; font-size: 14px;">${assistance.intervention_types.name}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #666666; font-size: 14px; vertical-align: top;"><strong>Localização:</strong></td>
                                                    <td style="color: #333333; font-size: 14px;">${assistance.buildings.address}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #666666; font-size: 14px; vertical-align: top;"><strong>Descrição:</strong></td>
                                                    <td style="color: #333333; font-size: 14px; line-height: 1.5;">${assistance.description}</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                                    Para gerir esta assistência, aceda ao seu portal personalizado:
                                </p>
                                
                                <!-- Botão CTA -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center" style="padding: 0 0 30px 0;">
                                            <a href="${actionUrl}" style="display: inline-block; padding: 14px 40px; background-color: #4a9b9e; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
                                                ACEDER AO PORTAL DO FORNECEDOR
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Funcionalidades do Portal -->
                                <div style="background-color: #f8fafb; border-left: 4px solid #3B82F6; padding: 20px; margin-bottom: 30px; border-radius: 0 6px 6px 0;">
                                    <p style="color: #333333; font-size: 14px; margin: 0 0 10px 0; font-weight: 500;">
                                        <strong>📅 No portal pode:</strong>
                                    </p>
                                    <ul style="color: #666666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                        <li>Confirmar ou reagendar a assistência</li>
                                        <li>Comunicar em tempo real com notificações</li>
                                        <li>Enviar fotos do progresso do trabalho</li>
                                        <li>Ver timeline completa e histórico</li>
                                    </ul>
                                </div>
                                
                                <!-- Informação de Contacto -->
                                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 5px 0;">
                                    <strong>Precisa de ajuda?</strong> Entre em contacto:
                                </p>
                                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
                                    Email: <a href="mailto:info@luvimg.com" style="color: #4a9b9e; text-decoration: none;">info@luvimg.com</a><br>
                                    Telefone: <a href="tel:+351964233777" style="color: #4a9b9e; text-decoration: none;">+351 964 233 777</a>
                                </p>
                                
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8fafb; padding: 30px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e5e5;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center">
                                            <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0 0 10px 0;">
                                                Esta é uma mensagem automática, por favor não responda diretamente a este email.
                                            </p>
                                            <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0 0 15px 0;">
                                                © ${new Date().getFullYear()} Luv.img - Administração de Condomínios | NIF: 516800960
                                            </p>
                                            <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0;">
                                                Rua António Luís Gomes 25A, 2790-356 Cascais
                                            </p>
                                            
                                            <!-- Links Sociais -->
                                            <table border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
                                                <tr>
                                                    <td style="padding: 0 10px;">
                                                        <a href="https://www.facebook.com/LuvImg" style="color: #4a9b9e; text-decoration: none; font-size: 12px;">Facebook</a>
                                                    </td>
                                                    <td style="padding: 0 10px; border-left: 1px solid #cccccc;">
                                                        <a href="https://www.instagram.com/luv.img" style="color: #4a9b9e; text-decoration: none; font-size: 12px;">Instagram</a>
                                                    </td>
                                                    <td style="padding: 0 10px; border-left: 1px solid #cccccc;">
                                                        <a href="https://www.linkedin.com/company/luvimg" style="color: #4a9b9e; text-decoration: none; font-size: 12px;">LinkedIn</a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                    </table>
                    <!-- Fim Email Container -->
                    
                </td>
            </tr>
        </table>
        
    </body>
    </html>
  `;
}

function generateValidationEmail(assistance: any, actionUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirme a Conclusão do Serviço - Luv.img</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5;">
        
        <!-- Container Principal -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    
                    <!-- Email Container -->
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #4a9b9e 0%, #3a7b7e 100%); padding: 30px 40px; border-radius: 8px 8px 0 0;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center">
                                            <!-- Logo -->
                                            <img src="https://assistencias-em-condominios-online.lovable.app/lovable-uploads/42db5c3a-d970-4146-a940-7967cb8ae563.png" alt="Luv.img" style="height: 50px; margin-bottom: 10px;">
                                            <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 300;">Confirme a Conclusão do Serviço</h1>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Conteúdo Principal -->
                        <tr>
                            <td style="padding: 40px;">
                                
                                <!-- Saudação -->
                                <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                                    Olá <strong>${assistance.suppliers.name}</strong>,
                                </p>
                                
                                <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                                    Após realizar o serviço agendado para o edifício <strong>${assistance.buildings.name}</strong>, precisamos que confirme a sua conclusão.
                                </p>
                                
                                <!-- Detalhes da Solicitação -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafb; border-radius: 6px; padding: 25px; margin-bottom: 30px;">
                                    <tr>
                                        <td>
                                            <h2 style="color: #3a7b7e; font-size: 18px; margin: 0 0 20px 0; font-weight: 500;">Detalhes da Assistência</h2>
                                            
                                            <table width="100%" border="0" cellspacing="0" cellpadding="8">
                                                <tr>
                                                    <td width="35%" style="color: #666666; font-size: 14px; vertical-align: top;"><strong>Tipo:</strong></td>
                                                    <td style="color: #333333; font-size: 14px;">${assistance.type}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #666666; font-size: 14px; vertical-align: top;"><strong>Categoria:</strong></td>
                                                    <td style="color: #333333; font-size: 14px;">${assistance.intervention_types.name}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #666666; font-size: 14px; vertical-align: top;"><strong>Localização:</strong></td>
                                                    <td style="color: #333333; font-size: 14px;">${assistance.buildings.address}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #666666; font-size: 14px; vertical-align: top;"><strong>Descrição:</strong></td>
                                                    <td style="color: #333333; font-size: 14px; line-height: 1.5;">${assistance.description}</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                                    Para finalizar esta assistência, aceda ao seu portal personalizado:
                                </p>
                                
                                <!-- Botão CTA -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center" style="padding: 0 0 30px 0;">
                                            <a href="${actionUrl}" style="display: inline-block; padding: 14px 40px; background-color: #4a9b9e; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
                                                ACEDER AO PORTAL DO FORNECEDOR
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Funcionalidades do Portal -->
                                <div style="background-color: #f8fafb; border-left: 4px solid #059669; padding: 20px; margin-bottom: 30px; border-radius: 0 6px 6px 0;">
                                    <p style="color: #333333; font-size: 14px; margin: 0 0 10px 0; font-weight: 500;">
                                        <strong>✅ Para finalizar:</strong>
                                    </p>
                                    <ul style="color: #666666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                        <li>Confirme a conclusão do trabalho</li>
                                        <li>Envie fotos do resultado final</li>
                                        <li>Adicione notas finais se necessário</li>
                                        <li>Mantenha comunicação ativa até ao fecho</li>
                                    </ul>
                                </div>
                                
                                <!-- Informação de Contacto -->
                                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 5px 0;">
                                    <strong>Precisa de ajuda?</strong> Entre em contacto:
                                </p>
                                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
                                    Email: <a href="mailto:info@luvimg.com" style="color: #4a9b9e; text-decoration: none;">info@luvimg.com</a><br>
                                    Telefone: <a href="tel:+351964233777" style="color: #4a9b9e; text-decoration: none;">+351 964 233 777</a>
                                </p>
                                
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8fafb; padding: 30px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e5e5;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center">
                                            <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0 0 10px 0;">
                                                Esta é uma mensagem automática, por favor não responda diretamente a este email.
                                            </p>
                                            <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0 0 15px 0;">
                                                © ${new Date().getFullYear()} Luv.img - Administração de Condomínios | NIF: 516800960
                                            </p>
                                            <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0;">
                                                Rua António Luís Gomes 25A, 2790-356 Cascais
                                            </p>
                                            
                                            <!-- Links Sociais -->
                                            <table border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
                                                <tr>
                                                    <td style="padding: 0 10px;">
                                                        <a href="https://www.facebook.com/LuvImg" style="color: #4a9b9e; text-decoration: none; font-size: 12px;">Facebook</a>
                                                    </td>
                                                    <td style="padding: 0 10px; border-left: 1px solid #cccccc;">
                                                        <a href="https://www.instagram.com/luv.img" style="color: #4a9b9e; text-decoration: none; font-size: 12px;">Instagram</a>
                                                    </td>
                                                    <td style="padding: 0 10px; border-left: 1px solid #cccccc;">
                                                        <a href="https://www.linkedin.com/company/luvimg" style="color: #4a9b9e; text-decoration: none; font-size: 12px;">LinkedIn</a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                    </table>
                    <!-- Fim Email Container -->
                    
                </td>
            </tr>
        </table>
        
    </body>
    </html>
  `;
}
