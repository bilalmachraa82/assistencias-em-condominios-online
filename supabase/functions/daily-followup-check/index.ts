
import { corsHeaders } from "../_shared/cors.ts";
import { createServiceRoleClient, formatDateTime } from "../_shared/utils.ts";

const supabase = createServiceRoleClient();
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://vedzsbeirirjiozqflgq.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// This function runs automatically on a schedule
export const handler = async () => {
  try {
    console.log("Starting daily followup check...");
    
    // Get all assistances that are scheduled but the date has passed
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: overdueAssistances, error } = await supabase
      .from("assistances")
      .select(`
        id,
        building:buildings(name),
        supplier:suppliers(name, email),
        scheduled_datetime
      `)
      .eq("status", "Agendada")
      .lt("scheduled_datetime", yesterday.toISOString());
      
    if (error) {
      console.error("Error fetching overdue assistances:", error);
      return { error: "Failed to fetch overdue assistances" };
    }
    
    console.log(`Found ${overdueAssistances?.length || 0} overdue assistances`);
    
    // For each overdue assistance, send follow-up emails
    if (overdueAssistances && overdueAssistances.length > 0) {
      for (const assistance of overdueAssistances) {
        console.log(`Processing assistance ID: ${assistance.id} for ${assistance.building.name}`);
        
        try {
          // Call the send-email edge function for this assistance
          const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              template: "follow_up_reminder",
              assistanceId: assistance.id
            })
          });
          
          if (!response.ok) {
            console.error(`Error sending follow-up email for assistance ${assistance.id}:`, 
              await response.text());
            continue;
          }
          
          // Log this follow-up in the activity log
          await supabase
            .from("activity_log")
            .insert({
              assistance_id: assistance.id,
              actor: "system",
              description: `Automatic follow-up sent for overdue assistance scheduled for ${formatDateTime(assistance.scheduled_datetime)}`
            });
            
          console.log(`Successfully processed follow-up for assistance ${assistance.id}`);
        } catch (assistanceError) {
          console.error(`Error processing assistance ${assistance.id}:`, assistanceError);
        }
      }
    }
    
    return { 
      success: true, 
      processed: overdueAssistances?.length || 0 
    };
  } catch (error) {
    console.error("Error in daily-followup-check:", error);
    return { error: error.message || "Failed to process follow-ups" };
  }
};
