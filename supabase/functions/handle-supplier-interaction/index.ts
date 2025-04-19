
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createServiceRoleClient, formatDateTime } from "../_shared/utils.ts";

const supabase = createServiceRoleClient();
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "http://localhost:3000";

interface SupplierInteractionRequest {
  action: string;
  token: string;
  data?: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, token, data } = await req.json() as SupplierInteractionRequest;
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing token" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Supplier interaction: ${action} with token ${token.substring(0, 8)}...`);

    // First validate the token and get assistance details
    const { data: assistance, error: tokenError } = await supabase
      .from("assistances")
      .select(`
        *,
        building:buildings(name, address),
        supplier:suppliers(name, email),
        intervention_type:intervention_types(name)
      `)
      .eq("interaction_token", token)
      .single();

    if (tokenError || !assistance) {
      console.error("Token validation error:", tokenError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let result;
    switch (action) {
      case "getAssistanceDetails":
        result = { assistance };
        break;
        
      case "scheduleAssistance":
        result = await scheduleAssistance(assistance, data.scheduledDateTime);
        break;
        
      case "rejectAssistance":
        result = await rejectAssistance(assistance, data.rejectionReason);
        break;
        
      case "completeAssistance":
        result = await completeAssistance(assistance, data.photoBase64);
        break;
        
      case "rescheduleAssistance":
        result = await rescheduleAssistance(assistance, data.scheduledDateTime);
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in handle-supplier-interaction:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

async function scheduleAssistance(assistance: any, scheduledDateTime: string) {
  // Validate status
  if (assistance.status !== "Pendente Resposta Inicial") {
    throw new Error(`Cannot schedule: Assistance is already ${assistance.status}`);
  }
  
  // Validate scheduled date is in the future
  const scheduledDate = new Date(scheduledDateTime);
  if (scheduledDate <= new Date()) {
    throw new Error("Scheduled date must be in the future");
  }
  
  // Update the assistance
  const { data, error } = await supabase
    .from("assistances")
    .update({
      status: "Agendada",
      scheduled_datetime: scheduledDateTime
    })
    .eq("id", assistance.id)
    .select()
    .single();
    
  if (error) throw error;
  
  // Log the activity
  await logSupplierActivity(
    assistance.id, 
    `Scheduled for ${formatDateTime(scheduledDateTime)}`
  );
  
  // Send email notification to admin
  await sendAdminNotificationEmail(
    "schedule_notification",
    assistance.id,
    `Supplier ${assistance.supplier.name} has scheduled assistance for ${formatDateTime(scheduledDateTime)}`
  );
  
  return { 
    success: true,
    message: "Assistance scheduled successfully",
    assistance: data
  };
}

async function rejectAssistance(assistance: any, rejectionReason: string) {
  // Validate status
  if (assistance.status !== "Pendente Resposta Inicial") {
    throw new Error(`Cannot reject: Assistance is already ${assistance.status}`);
  }
  
  // Update the assistance
  const { data, error } = await supabase
    .from("assistances")
    .update({
      status: "Rejeitada Pelo Fornecedor",
      rejection_reason: rejectionReason || "No reason provided"
    })
    .eq("id", assistance.id)
    .select()
    .single();
    
  if (error) throw error;
  
  // Log the activity
  await logSupplierActivity(
    assistance.id, 
    `Rejected with reason: ${rejectionReason || "No reason provided"}`
  );
  
  // Send email notification to admin
  await sendAdminNotificationEmail(
    "rejection_notification",
    assistance.id,
    `Supplier ${assistance.supplier.name} has rejected assistance. Reason: ${rejectionReason || "No reason provided"}`
  );
  
  return { 
    success: true,
    message: "Assistance rejected successfully",
    assistance: data
  };
}

async function completeAssistance(assistance: any, photoBase64: string) {
  // Validate status
  if (assistance.status !== "Agendada") {
    throw new Error(`Cannot complete: Assistance must be in "Agendada" status`);
  }
  
  // Validate photo was provided
  if (!photoBase64) {
    throw new Error("Photo evidence is required");
  }
  
  let photoPath = null;
  
  try {
    // Handle the photo upload (decode base64 and upload to storage)
    const buffer = Uint8Array.from(atob(photoBase64.split(',')[1]), c => c.charCodeAt(0));
    const fileName = `${assistance.id}_${Date.now()}.jpg`;
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('assistance-photos')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg'
      });
      
    if (uploadError) throw uploadError;
    
    photoPath = uploadData.path;
    
    // Update the assistance
    const { data, error } = await supabase
      .from("assistances")
      .update({
        status: "Concluída",
        photo_path: photoPath
      })
      .eq("id", assistance.id)
      .select()
      .single();
      
    if (error) throw error;
    
    // Log the activity
    await logSupplierActivity(
      assistance.id, 
      "Marked as completed with photo evidence"
    );
    
    // Send email notification to admin
    await sendAdminNotificationEmail(
      "completion_notification",
      assistance.id,
      `Supplier ${assistance.supplier.name} has completed the assistance with photo evidence`
    );
    
    return { 
      success: true,
      message: "Assistance completed successfully",
      assistance: data
    };
  } catch (error) {
    console.error("Error during photo upload:", error);
    throw new Error("Failed to upload photo: " + error.message);
  }
}

async function rescheduleAssistance(assistance: any, scheduledDateTime: string) {
  // Validate status
  if (assistance.status !== "Agendada") {
    throw new Error(`Cannot reschedule: Assistance must be in "Agendada" status`);
  }
  
  // Validate scheduled date is in the future
  const scheduledDate = new Date(scheduledDateTime);
  if (scheduledDate <= new Date()) {
    throw new Error("Scheduled date must be in the future");
  }
  
  // Get previous scheduled date for logging
  const previousDate = formatDateTime(assistance.scheduled_datetime);
  
  // Update the assistance
  const { data, error } = await supabase
    .from("assistances")
    .update({
      scheduled_datetime: scheduledDateTime
    })
    .eq("id", assistance.id)
    .select()
    .single();
    
  if (error) throw error;
  
  // Log the activity
  await logSupplierActivity(
    assistance.id, 
    `Rescheduled from ${previousDate} to ${formatDateTime(scheduledDateTime)}`
  );
  
  // Send email notification to admin
  await sendAdminNotificationEmail(
    "reschedule_notification",
    assistance.id,
    `Supplier ${assistance.supplier.name} has rescheduled assistance from ${previousDate} to ${formatDateTime(scheduledDateTime)}`
  );
  
  return { 
    success: true,
    message: "Assistance rescheduled successfully",
    assistance: data
  };
}

async function logSupplierActivity(assistanceId: number, description: string) {
  try {
    const { error } = await supabase
      .from("activity_log")
      .insert({
        assistance_id: assistanceId,
        actor: "supplier",
        description
      });
      
    if (error) {
      console.error("Error logging supplier activity:", error);
    }
  } catch (error) {
    console.error("Exception during activity logging:", error);
  }
}

async function sendAdminNotificationEmail(template: string, assistanceId: number, message: string) {
  try {
    // Call the send-email edge function
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://vedzsbeirirjiozqflgq.supabase.co";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        template,
        assistanceId,
        additionalData: {
          message
        }
      })
    });
    
    if (!response.ok) {
      console.error("Error calling send-email function:", await response.text());
    }
  } catch (error) {
    console.error("Exception during email sending:", error);
  }
}

serve(handler);
