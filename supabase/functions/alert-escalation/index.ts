
import { corsHeaders } from "../_shared/cors.ts";
import { createServiceRoleClient } from "../_shared/utils.ts";

const supabase = createServiceRoleClient();
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://vedzsbeirirjiozqflgq.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// This function runs automatically on a schedule
export const handler = async () => {
  try {
    console.log("Starting alert escalation check...");
    
    // Define the alert level thresholds in days
    const alertLevelThresholds = [
      { level: 1, days: 3 },  // Level 1 after 3 days
      { level: 2, days: 7 },  // Level 2 after 7 days
      { level: 3, days: 14 }  // Level 3 after 14 days
    ];
    
    // Process each alert level (from lowest to highest)
    for (const threshold of alertLevelThresholds) {
      await processAlertLevel(threshold.level, threshold.days);
    }
    
    return { 
      success: true, 
      message: "Alert escalation completed successfully" 
    };
  } catch (error) {
    console.error("Error in alert-escalation:", error);
    return { error: error.message || "Failed to process alert escalation" };
  }
};

async function processAlertLevel(targetLevel: number, dayThreshold: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - dayThreshold);
  
  console.log(`Processing alert level ${targetLevel} for assistances older than ${dayThreshold} days (${cutoffDate.toISOString()})`);
  
  // Find open assistances that are older than the threshold and at the previous alert level
  const prevLevel = targetLevel - 1;
  
  const { data: assistances, error } = await supabase
    .from("assistances")
    .select(`
      id,
      building:buildings(name),
      supplier:suppliers(name),
      opened_at,
      status,
      alert_level
    `)
    .in("status", ["Pendente Resposta Inicial", "Agendada"])  // Only process open statuses
    .eq("alert_level", prevLevel)  // Only escalate from previous level
    .lt("opened_at", cutoffDate.toISOString());
    
  if (error) {
    console.error(`Error fetching assistances for alert level ${targetLevel}:`, error);
    return;
  }
  
  console.log(`Found ${assistances?.length || 0} assistances to escalate to level ${targetLevel}`);
  
  // Escalate each qualifying assistance
  if (assistances && assistances.length > 0) {
    for (const assistance of assistances) {
      try {
        console.log(`Escalating assistance ${assistance.id} from level ${prevLevel} to ${targetLevel}`);
        
        // Update the alert level
        const { error: updateError } = await supabase
          .from("assistances")
          .update({ alert_level: targetLevel })
          .eq("id", assistance.id);
          
        if (updateError) {
          console.error(`Error updating alert level for assistance ${assistance.id}:`, updateError);
          continue;
        }
        
        // Log this escalation in the activity log
        await supabase
          .from("activity_log")
          .insert({
            assistance_id: assistance.id,
            actor: "system",
            description: `Alert level escalated from ${prevLevel} to ${targetLevel}`
          });
        
        // For critical escalation (level 3), send admin notification
        if (targetLevel === 3) {
          await sendCriticalAlertNotification(assistance);
        }
        
        console.log(`Successfully escalated assistance ${assistance.id} to level ${targetLevel}`);
      } catch (assistanceError) {
        console.error(`Error processing assistance ${assistance.id}:`, assistanceError);
      }
    }
  }
}

async function sendCriticalAlertNotification(assistance: any) {
  try {
    console.log(`Sending critical alert notification for assistance ${assistance.id}`);
    
    // Call the send-email edge function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        template: "critical_alert",
        assistanceId: assistance.id,
        additionalData: {
          message: `ALERTA CRÍTICO: A assistência para ${assistance.building.name} atingiu o nível máximo de alerta (${assistance.status}) e requer atenção urgente!`
        }
      })
    });
    
    if (!response.ok) {
      console.error(`Error sending critical alert email for assistance ${assistance.id}:`, 
        await response.text());
    }
  } catch (error) {
    console.error(`Error sending critical alert for assistance ${assistance.id}:`, error);
  }
}
