
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";
import { createServiceRoleClient, formatDateTime } from "../_shared/utils.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_INTERNAL_EMAIL = Deno.env.get("ADMIN_INTERNAL_EMAIL");
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "http://localhost:3000";

if (!RESEND_API_KEY) {
  console.error("RESEND_API_KEY is not set");
}

if (!ADMIN_INTERNAL_EMAIL) {
  console.error("ADMIN_INTERNAL_EMAIL is not set");
}

const resend = new Resend(RESEND_API_KEY);
const supabase = createServiceRoleClient();

interface EmailRequest {
  template: string;
  assistanceId: number;
  additionalData?: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { template, assistanceId, additionalData } = await req.json() as EmailRequest;
    
    if (!template || !assistanceId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Sending email template: ${template} for assistance: ${assistanceId}`);

    // Get assistance details with related info
    const { data: assistance, error } = await supabase
      .from("assistances")
      .select(`
        *,
        building:buildings(name, address),
        supplier:suppliers(name, email),
        intervention_type:intervention_types(name)
      `)
      .eq("id", assistanceId)
      .single();
      
    if (error || !assistance) {
      console.error("Error fetching assistance:", error);
      return new Response(
        JSON.stringify({ error: "Assistance not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let emailResult;
    
    switch (template) {
      case "initial_request":
        emailResult = await sendInitialRequestEmail(assistance);
        break;
        
      case "follow_up_reminder":
        emailResult = await sendFollowUpReminderEmail(assistance);
        break;
        
      case "schedule_notification":
      case "rejection_notification":
      case "completion_notification":
      case "reschedule_notification":
        emailResult = await sendAdminNotificationEmail(template, assistance, additionalData);
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: `Unknown email template: ${template}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    // Log the email sending
    await logEmailSending(assistanceId, template, emailResult);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Email sent successfully",
        emailId: emailResult.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

async function sendInitialRequestEmail(assistance: any) {
  const supplierEmail = assistance.supplier.email;
  const supplierName = assistance.supplier.name;
  const buildingName = assistance.building.name;
  const buildingAddress = assistance.building.address || "Sem endereço cadastrado";
  const serviceType = assistance.intervention_type?.name || assistance.type;
  const description = assistance.description;
  
  const interactionLink = `${APP_BASE_URL}/supplier-interaction/${assistance.interaction_token}`;
  
  const emailContent = `
    <h1>Pedido de Assistência Técnica</h1>
    <p>Olá ${supplierName},</p>
    <p>Você recebeu um novo pedido de assistência técnica para o condomínio ${buildingName}.</p>
    
    <h2>Detalhes do Pedido:</h2>
    <ul>
      <li><strong>Condomínio:</strong> ${buildingName}</li>
      <li><strong>Endereço:</strong> ${buildingAddress}</li>
      <li><strong>Tipo de Serviço:</strong> ${serviceType}</li>
      <li><strong>Descrição:</strong> ${description}</li>
    </ul>
    
    <p>Por favor, acesse o link abaixo para agendar uma visita ou rejeitar o pedido:</p>
    <p><a href="${interactionLink}" style="display:inline-block; background-color:#4CAF50; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Responder ao Pedido</a></p>
    
    <p>Ou copie e cole este link no seu navegador:</p>
    <p>${interactionLink}</p>
    
    <p>Atenciosamente,<br>Sistema AssisTech</p>
  `;
  
  const emailResult = await resend.emails.send({
    from: "AssisTech <assistencias@resend.dev>",
    to: [supplierEmail],
    subject: `Novo Pedido de Assistência - ${buildingName}`,
    html: emailContent
  });
  
  return emailResult;
}

async function sendFollowUpReminderEmail(assistance: any) {
  const supplierEmail = assistance.supplier.email;
  const supplierName = assistance.supplier.name;
  const buildingName = assistance.building.name;
  const scheduledDate = formatDateTime(assistance.scheduled_datetime);
  
  const interactionLink = `${APP_BASE_URL}/supplier-interaction/${assistance.interaction_token}`;
  
  const emailContent = `
    <h1>Lembrete de Assistência Agendada</h1>
    <p>Olá ${supplierName},</p>
    <p>Estamos entrando em contato para lembrar sobre a assistência técnica que você agendou para o condomínio ${buildingName} em ${scheduledDate}.</p>
    <p>De acordo com nossos registros, esta data já passou e precisamos de uma atualização sobre o status deste serviço.</p>
    
    <p>Por favor, acesse o link abaixo para concluir o pedido com foto comprobatória ou reagendar:</p>
    <p><a href="${interactionLink}" style="display:inline-block; background-color:#4CAF50; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Atualizar Status</a></p>
    
    <p>Ou copie e cole este link no seu navegador:</p>
    <p>${interactionLink}</p>
    
    <p>Atenciosamente,<br>Sistema AssisTech</p>
  `;
  
  const emailResult = await resend.emails.send({
    from: "AssisTech <assistencias@resend.dev>",
    to: [supplierEmail],
    subject: `Lembrete: Assistência Agendada - ${buildingName}`,
    html: emailContent
  });
  
  // Also notify admin about the follow-up
  await sendAdminNotificationEmail(
    "follow_up_notification", 
    assistance, 
    { message: `A follow-up reminder has been sent to ${supplierName} about the overdue assistance for ${buildingName}` }
  );
  
  return emailResult;
}

async function sendAdminNotificationEmail(template: string, assistance: any, additionalData: any) {
  if (!ADMIN_INTERNAL_EMAIL) {
    console.error("ADMIN_INTERNAL_EMAIL environment variable not set");
    throw new Error("Admin email not configured");
  }
  
  const buildingName = assistance.building.name;
  const supplierName = assistance.supplier.name;
  const serviceType = assistance.intervention_type?.name || assistance.type;
  
  let subject = "";
  let content = "";
  
  switch (template) {
    case "rejection_notification":
      subject = `ALERTA: Pedido Rejeitado - ${buildingName}`;
      content = `
        <h1>Pedido de Assistência Rejeitado</h1>
        <p>Um pedido de assistência foi rejeitado pelo fornecedor:</p>
        
        <ul>
          <li><strong>Condomínio:</strong> ${buildingName}</li>
          <li><strong>Fornecedor:</strong> ${supplierName}</li>
          <li><strong>Tipo de Serviço:</strong> ${serviceType}</li>
          <li><strong>Motivo da Rejeição:</strong> ${assistance.rejection_reason || "Não especificado"}</li>
        </ul>
        
        <p>Por favor, acesse o sistema para reatribuir este pedido a outro fornecedor.</p>
        
        <p><a href="${APP_BASE_URL}/admin/assistances/${assistance.id}" style="display:inline-block; background-color:#F44336; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Ver Pedido</a></p>
      `;
      break;
      
    case "follow_up_notification":
      subject = `ALERTA: Assistência Pendente - ${buildingName}`;
      content = `
        <h1>Assistência Agendada Pendente</h1>
        <p>Uma assistência agendada está pendente de finalização:</p>
        
        <ul>
          <li><strong>Condomínio:</strong> ${buildingName}</li>
          <li><strong>Fornecedor:</strong> ${supplierName}</li>
          <li><strong>Tipo de Serviço:</strong> ${serviceType}</li>
          <li><strong>Data Agendada:</strong> ${formatDateTime(assistance.scheduled_datetime)}</li>
        </ul>
        
        <p>Um e-mail de lembrete foi enviado ao fornecedor. Talvez seja necessário um contato adicional por telefone.</p>
        
        <p><a href="${APP_BASE_URL}/admin/assistances/${assistance.id}" style="display:inline-block; background-color:#FF9800; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Ver Pedido</a></p>
      `;
      break;
      
    case "schedule_notification":
      subject = `Assistência Agendada - ${buildingName}`;
      content = `
        <h1>Assistência Agendada pelo Fornecedor</h1>
        <p>Uma assistência foi agendada:</p>
        
        <ul>
          <li><strong>Condomínio:</strong> ${buildingName}</li>
          <li><strong>Fornecedor:</strong> ${supplierName}</li>
          <li><strong>Tipo de Serviço:</strong> ${serviceType}</li>
          <li><strong>Data Agendada:</strong> ${formatDateTime(assistance.scheduled_datetime)}</li>
        </ul>
        
        <p><a href="${APP_BASE_URL}/admin/assistances/${assistance.id}" style="display:inline-block; background-color:#2196F3; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Ver Pedido</a></p>
      `;
      break;
      
    case "completion_notification":
      subject = `Assistência Concluída - ${buildingName}`;
      content = `
        <h1>Assistência Concluída pelo Fornecedor</h1>
        <p>Uma assistência foi marcada como concluída:</p>
        
        <ul>
          <li><strong>Condomínio:</strong> ${buildingName}</li>
          <li><strong>Fornecedor:</strong> ${supplierName}</li>
          <li><strong>Tipo de Serviço:</strong> ${serviceType}</li>
        </ul>
        
        <p>O fornecedor enviou uma foto como comprovante. Por favor, acesse o sistema para verificar.</p>
        
        <p><a href="${APP_BASE_URL}/admin/assistances/${assistance.id}" style="display:inline-block; background-color:#4CAF50; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Ver Pedido</a></p>
      `;
      break;
      
    case "reschedule_notification":
      subject = `Assistência Reagendada - ${buildingName}`;
      content = `
        <h1>Assistência Reagendada pelo Fornecedor</h1>
        <p>Uma assistência foi reagendada:</p>
        
        <ul>
          <li><strong>Condomínio:</strong> ${buildingName}</li>
          <li><strong>Fornecedor:</strong> ${supplierName}</li>
          <li><strong>Tipo de Serviço:</strong> ${serviceType}</li>
          <li><strong>Nova Data:</strong> ${formatDateTime(assistance.scheduled_datetime)}</li>
        </ul>
        
        <p><a href="${APP_BASE_URL}/admin/assistances/${assistance.id}" style="display:inline-block; background-color:#2196F3; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Ver Pedido</a></p>
      `;
      break;
      
    default:
      subject = `Notificação de Assistência - ${buildingName}`;
      content = `
        <h1>Notificação de Assistência</h1>
        <p>Atualização sobre um pedido de assistência:</p>
        
        <ul>
          <li><strong>Condomínio:</strong> ${buildingName}</li>
          <li><strong>Fornecedor:</strong> ${supplierName}</li>
          <li><strong>Tipo de Serviço:</strong> ${serviceType}</li>
          <li><strong>Mensagem:</strong> ${additionalData?.message || "Sem detalhes adicionais"}</li>
        </ul>
        
        <p><a href="${APP_BASE_URL}/admin/assistances/${assistance.id}" style="display:inline-block; background-color:#2196F3; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Ver Pedido</a></p>
      `;
  }
  
  const emailResult = await resend.emails.send({
    from: "AssisTech <assistencias@resend.dev>",
    to: [ADMIN_INTERNAL_EMAIL],
    subject,
    html: content
  });
  
  return emailResult;
}

async function logEmailSending(assistanceId: number, template: string, emailResult: any) {
  try {
    const { error } = await supabase
      .from("email_logs")
      .insert({
        assistance_id: assistanceId,
        template_name: template,
        recipients: emailResult.to?.join(", ") || "",
        success: !!emailResult.id
      });
      
    if (error) {
      console.error("Error logging email sending:", error);
    }
  } catch (error) {
    console.error("Exception during email logging:", error);
  }
}

serve(handler);
