
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
    
    console.log('Starting scheduled reminders function');
    console.log('Using base URL:', origin);
    
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Resend API Key não configurada' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format dates for PostgreSQL (YYYY-MM-DD)
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    console.log('Checking for assistances scheduled for today:', todayStr);
    console.log('Checking for assistances scheduled for yesterday (to follow up):', tomorrowStr);

    // 1. Find assistências agendadas para hoje - enviar lembrete para validar
    const { data: todayAssistances, error: todayError } = await supabase
      .from('assistances')
      .select(`
        id,
        status,
        scheduled_datetime,
        validation_token,
        buildings!inner(id, name, address),
        suppliers!inner(id, name, email),
        intervention_types!inner(id, name)
      `)
      .eq('status', 'Agendado')
      .gte('scheduled_datetime', `${todayStr}T00:00:00`)
      .lte('scheduled_datetime', `${todayStr}T23:59:59`);

    if (todayError) {
      console.error('Erro ao buscar assistências de hoje:', todayError);
    } else {
      console.log(`Encontradas ${todayAssistances?.length || 0} assistências agendadas para hoje`);
      
      // Processar cada assistência agendada para hoje
      for (const assistance of todayAssistances || []) {
        if (assistance.validation_token) {
          // Enviar email de lembrete para o fornecedor
          await sendReminderEmail(
            assistance, 
            origin, 
            resendApiKey, 
            'Lembrete: Assistência Agendada para Hoje', 
            `Nossa assistência técnica está agendada para hoje no edifício ${assistance.buildings.name}. Por favor, após concluir o serviço, utilize o link abaixo para enviar a confirmação com foto.`,
            'today',
            supabase
          );
        } else {
          console.log(`Assistência ${assistance.id} sem token de validação. Gerando novo token.`);
          await updateAssistanceWithValidationToken(assistance.id, supabase);
        }
      }
    }

    // 2. Find assistências agendadas para ontem - enviar follow up
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const { data: yesterdayAssistances, error: yesterdayError } = await supabase
      .from('assistances')
      .select(`
        id,
        status,
        scheduled_datetime,
        validation_token,
        validation_reminder_count,
        buildings!inner(id, name, address),
        suppliers!inner(id, name, email),
        intervention_types!inner(id, name)
      `)
      .eq('status', 'Agendado')
      .gte('scheduled_datetime', `${yesterdayStr}T00:00:00`)
      .lte('scheduled_datetime', `${yesterdayStr}T23:59:59`);

    if (yesterdayError) {
      console.error('Erro ao buscar assistências de ontem:', yesterdayError);
    } else {
      console.log(`Encontradas ${yesterdayAssistances?.length || 0} assistências agendadas para ontem`);
      
      // Processar cada assistência agendada para ontem
      for (const assistance of yesterdayAssistances || []) {
        if (assistance.validation_token) {
          // Incrementar contador de lembretes de validação
          await supabase
            .from('assistances')
            .update({ 
              validation_reminder_count: (assistance.validation_reminder_count || 0) + 1,
              validation_email_sent_at: new Date().toISOString()
            })
            .eq('id', assistance.id);
          
          // Enviar email de follow-up para o fornecedor
          await sendReminderEmail(
            assistance, 
            origin, 
            resendApiKey, 
            'Confirmação de Conclusão ou Reagendamento', 
            `A sua assistência técnica estava agendada para ontem no edifício ${assistance.buildings.name}. Por favor, confirme se o serviço foi concluído enviando uma foto ou, se necessário, agende uma nova data.`,
            'followup',
            supabase
          );
        } else {
          console.log(`Assistência ${assistance.id} sem token de validação. Gerando novo token.`);
          await updateAssistanceWithValidationToken(assistance.id, supabase);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processados ${todayAssistances?.length || 0} lembretes para hoje e ${yesterdayAssistances?.length || 0} follow-ups de ontem.` 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro:', error.message);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

// Gerar token de validação e atualizar assistência
async function updateAssistanceWithValidationToken(assistanceId: number, supabase: any) {
  const validationToken = generateRandomToken(20);
  
  const { error } = await supabase
    .from('assistances')
    .update({
      validation_token: validationToken
    })
    .eq('id', assistanceId);
  
  if (error) {
    console.error('Erro ao atualizar token de validação:', error);
  }
  
  return validationToken;
}

// Enviar email de lembrete
async function sendReminderEmail(
  assistance: any, 
  baseUrl: string,
  resendApiKey: string,
  subject: string,
  messageIntro: string,
  type: 'today' | 'followup',
  supabase: any
) {
  // Garantir que temos um token de validação
  let validationToken = assistance.validation_token;
  if (!validationToken) {
    validationToken = await updateAssistanceWithValidationToken(assistance.id, supabase);
  }
  
  const completeUrl = `${baseUrl}/supplier/complete?token=${validationToken}`;
  const scheduleUrl = `${baseUrl}/supplier/schedule?token=${assistance.scheduling_token}`;
  
  // HTML do email
  const emailContent = `
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
        .button-secondary { background-color: #6b7280; }
        .details { margin: 20px 0; padding: 15px; background-color: white; border-left: 4px solid #10b981; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${subject}</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${assistance.suppliers.name}</strong>,</p>
          <p>${messageIntro}</p>
          
          <div class="details">
            <p><strong>Edifício:</strong> ${assistance.buildings.name}</p>
            <p><strong>Endereço:</strong> ${assistance.buildings.address}</p>
            <p><strong>Tipo:</strong> ${assistance.intervention_types.name}</p>
            <p><strong>Data Agendada:</strong> ${new Date(assistance.scheduled_datetime).toLocaleString('pt-BR')}</p>
          </div>
          
          <p>Por favor, use um dos botões abaixo para confirmar a conclusão ou reagendar:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${completeUrl}" class="button">Confirmar Conclusão com Foto</a>
            ${type === 'followup' ? `<br/><br/><a href="${scheduleUrl}" class="button button-secondary">Reagendar Assistência</a>` : ''}
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

  try {
    console.log(`Enviando email de ${type} para ${assistance.suppliers.email}`);
    
    // Enviar email usando Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'AssisTech <onboarding@resend.dev>',
        to: [assistance.suppliers.email],
        subject: subject,
        html: emailContent,
      })
    });

    const emailResult = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error('Erro ao enviar email:', emailResult);
      return false;
    }

    // Log do email enviado
    await supabase
      .from('email_logs')
      .insert([{
        assistance_id: assistance.id,
        template_name: type === 'today' ? 'reminder_today' : 'reminder_followup',
        recipients: assistance.suppliers.email,
        success: true
      }]);

    // Log de atividade
    await supabase
      .from('activity_log')
      .insert([{
        assistance_id: assistance.id,
        description: `Email de lembrete ${type === 'today' ? 'do dia' : 'de follow-up'} enviado para o fornecedor`,
        actor: 'sistema'
      }]);
    
    console.log('Email enviado com sucesso:', emailResult);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
}

// Função para gerar um token aleatório
function generateRandomToken(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
