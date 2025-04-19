
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "../_shared/cors.ts";
import { generateUniqueToken } from "../_shared/utils.ts";

const ADMIN_API_KEY = Deno.env.get("ADMIN_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://vedzsbeirirjiozqflgq.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Important types for request handling
interface AdminRequest {
  action: string;
  data?: any;
  filters?: any;
  id?: number;
}

// Create a Supabase client with the service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate Admin API Key
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== ADMIN_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Unauthorized. Invalid API key." }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const { action, data, filters, id } = await req.json() as AdminRequest;
    let result;

    console.log(`Admin handler processing action: ${action}`);

    switch (action) {
      // Building CRUD operations
      case "getBuildings":
        result = await getBuildings(filters);
        break;
      case "createBuilding":
        result = await createBuilding(data);
        break;
      case "updateBuilding":
        result = await updateBuilding(id!, data);
        break;
      case "toggleBuildingActive":
        result = await toggleBuildingActive(id!);
        break;

      // Supplier CRUD operations
      case "getSuppliers":
        result = await getSuppliers(filters);
        break;
      case "createSupplier":
        result = await createSupplier(data);
        break;
      case "updateSupplier":
        result = await updateSupplier(id!, data);
        break;
      case "toggleSupplierActive":
        result = await toggleSupplierActive(id!);
        break;

      // Intervention type CRUD operations
      case "getInterventionTypes":
        result = await getInterventionTypes(filters);
        break;
      case "createInterventionType":
        result = await createInterventionType(data);
        break;
      case "updateInterventionType":
        result = await updateInterventionType(id!, data);
        break;
      case "deleteInterventionType":
        result = await deleteInterventionType(id!);
        break;

      // Assistance CRUD operations
      case "getAssistances":
        result = await getAssistances(filters);
        break;
      case "getAssistanceDetails":
        result = await getAssistanceDetails(id!);
        break;
      case "createAssistance":
        result = await createAssistance(data);
        break;
      case "reassignAssistance":
        result = await reassignAssistance(id!, data.supplier_id);
        break;
      case "cancelAssistance":
        result = await cancelAssistance(id!);
        break;

      // Activity logs
      case "getActivityLogs":
        result = await getActivityLogs(data.assistance_id);
        break;

      // Reports
      case "getReports":
        result = await getReports(data);
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
    console.error("Error in admin-handler:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

// Building functions
async function getBuildings(filters: any = {}) {
  const query = supabase.from("buildings").select("*");
  
  if (filters.active !== undefined) {
    query.eq("is_active", filters.active);
  }
  
  if (filters.search) {
    query.ilike("name", `%${filters.search}%`);
  }
  
  const { data, error } = await query.order("name");
  
  if (error) throw error;
  return { buildings: data };
}

async function createBuilding(buildingData: any) {
  const { data, error } = await supabase
    .from("buildings")
    .insert(buildingData)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log activity
  await logActivity("admin", null, `Building "${buildingData.name}" created`);
  
  return { building: data };
}

async function updateBuilding(id: number, buildingData: any) {
  const { data, error } = await supabase
    .from("buildings")
    .update(buildingData)
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log activity
  await logActivity("admin", null, `Building "${buildingData.name}" updated`);
  
  return { building: data };
}

async function toggleBuildingActive(id: number) {
  // First get current status
  const { data: building, error: fetchError } = await supabase
    .from("buildings")
    .select("name, is_active")
    .eq("id", id)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Toggle status
  const { data, error } = await supabase
    .from("buildings")
    .update({ is_active: !building.is_active })
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log activity
  await logActivity(
    "admin", 
    null, 
    `Building "${building.name}" ${data.is_active ? 'activated' : 'deactivated'}`
  );
  
  return { building: data };
}

// Supplier functions
async function getSuppliers(filters: any = {}) {
  const query = supabase.from("suppliers").select("*");
  
  if (filters.active !== undefined) {
    query.eq("is_active", filters.active);
  }
  
  if (filters.search) {
    query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }
  
  const { data, error } = await query.order("name");
  
  if (error) throw error;
  return { suppliers: data };
}

async function createSupplier(supplierData: any) {
  const { data, error } = await supabase
    .from("suppliers")
    .insert(supplierData)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log activity
  await logActivity("admin", null, `Supplier "${supplierData.name}" created`);
  
  return { supplier: data };
}

async function updateSupplier(id: number, supplierData: any) {
  const { data, error } = await supabase
    .from("suppliers")
    .update(supplierData)
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log activity
  await logActivity("admin", null, `Supplier "${supplierData.name}" updated`);
  
  return { supplier: data };
}

async function toggleSupplierActive(id: number) {
  // First get current status
  const { data: supplier, error: fetchError } = await supabase
    .from("suppliers")
    .select("name, is_active")
    .eq("id", id)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Toggle status
  const { data, error } = await supabase
    .from("suppliers")
    .update({ is_active: !supplier.is_active })
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log activity
  await logActivity(
    "admin", 
    null, 
    `Supplier "${supplier.name}" ${data.is_active ? 'activated' : 'deactivated'}`
  );
  
  return { supplier: data };
}

// Intervention type functions
async function getInterventionTypes(filters: any = {}) {
  const query = supabase.from("intervention_types").select("*");
  
  if (filters.search) {
    query.ilike("name", `%${filters.search}%`);
  }
  
  const { data, error } = await query.order("name");
  
  if (error) throw error;
  return { interventionTypes: data };
}

async function createInterventionType(typeData: any) {
  const { data, error } = await supabase
    .from("intervention_types")
    .insert(typeData)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log activity
  await logActivity("admin", null, `Intervention type "${typeData.name}" created`);
  
  return { interventionType: data };
}

async function updateInterventionType(id: number, typeData: any) {
  const { data, error } = await supabase
    .from("intervention_types")
    .update(typeData)
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log activity
  await logActivity("admin", null, `Intervention type "${typeData.name}" updated`);
  
  return { interventionType: data };
}

async function deleteInterventionType(id: number) {
  // Check if it's being used in any assistance
  const { count, error: countError } = await supabase
    .from("assistances")
    .select("id", { count: "exact", head: true })
    .eq("intervention_type_id", id);
  
  if (countError) throw countError;
  
  if (count && count > 0) {
    throw new Error(`Cannot delete: This intervention type is being used in ${count} assistance requests`);
  }
  
  // Get name before deletion for logging
  const { data: typeData, error: fetchError } = await supabase
    .from("intervention_types")
    .select("name")
    .eq("id", id)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Delete if not in use
  const { error } = await supabase
    .from("intervention_types")
    .delete()
    .eq("id", id);
  
  if (error) throw error;
  
  // Log activity
  await logActivity("admin", null, `Intervention type "${typeData.name}" deleted`);
  
  return { success: true, message: "Intervention type deleted successfully" };
}

// Assistance functions
async function getAssistances(filters: any = {}) {
  // Create a base query with joins to get related data
  let query = supabase
    .from("assistances")
    .select(`
      *,
      building:buildings(id, name),
      supplier:suppliers(id, name, email),
      intervention_type:intervention_types(id, name)
    `);
  
  // Apply filters
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  
  if (filters.building_id) {
    query = query.eq("building_id", filters.building_id);
  }
  
  if (filters.supplier_id) {
    query = query.eq("supplier_id", filters.supplier_id);
  }
  
  if (filters.type) {
    query = query.eq("type", filters.type);
  }
  
  if (filters.from_date) {
    query = query.gte("opened_at", filters.from_date);
  }
  
  if (filters.to_date) {
    query = query.lte("opened_at", filters.to_date);
  }
  
  if (filters.search) {
    // We need to use more complex logic for searching across related tables
    // This is a simplified approach - for production, consider using Postgres functions
    query = query.or(`description.ilike.%${filters.search}%`);
  }
  
  // Apply pagination
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const start = (page - 1) * pageSize;
  
  // Apply sorting
  const orderColumn = filters.orderBy || "opened_at";
  const orderDirection = filters.orderDirection || "desc";
  query = query.order(orderColumn, { ascending: orderDirection === "asc" });
  
  // Execute query with pagination
  const { data, error, count } = await query
    .range(start, start + pageSize - 1)
    .count("exact");
  
  if (error) throw error;
  
  return { 
    assistances: data,
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: count ? Math.ceil(count / pageSize) : 0
    }
  };
}

async function getAssistanceDetails(id: number) {
  // Get the assistance with related data
  const { data, error } = await supabase
    .from("assistances")
    .select(`
      *,
      building:buildings(id, name, address),
      supplier:suppliers(id, name, email, phone),
      intervention_type:intervention_types(id, name, description)
    `)
    .eq("id", id)
    .single();
  
  if (error) throw error;
  
  // Get activity logs
  const { data: activityLogs, error: logsError } = await supabase
    .from("activity_log")
    .select("*")
    .eq("assistance_id", id)
    .order("timestamp", { ascending: false });
  
  if (logsError) throw logsError;
  
  // Get email logs
  const { data: emailLogs, error: emailLogsError } = await supabase
    .from("email_logs")
    .select("*")
    .eq("assistance_id", id)
    .order("sent_at", { ascending: false });
  
  if (emailLogsError) throw emailLogsError;
  
  return { 
    assistance: data,
    activityLogs,
    emailLogs
  };
}

async function createAssistance(assistanceData: any) {
  // Generate a unique token for supplier interaction
  const interaction_token = generateUniqueToken();
  
  // Determine type from intervention_type if not specified
  if (!assistanceData.type && assistanceData.intervention_type_id) {
    const { data: interventionType, error } = await supabase
      .from("intervention_types")
      .select("maps_to_urgency")
      .eq("id", assistanceData.intervention_type_id)
      .single();
    
    if (!error && interventionType && interventionType.maps_to_urgency) {
      assistanceData.type = interventionType.maps_to_urgency;
    } else {
      assistanceData.type = "Normal"; // Default if not found or no mapping
    }
  }
  
  // Create the assistance record
  const { data, error } = await supabase
    .from("assistances")
    .insert({
      ...assistanceData,
      interaction_token,
      status: "Pendente Resposta Inicial"
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Log activity
  await logActivity("admin", data.id, "Assistance request created");
  
  // Trigger email sending by calling the send-email function
  const emailResult = await sendInitialRequestEmail(data.id);
  
  return { 
    assistance: data,
    emailSent: emailResult.success
  };
}

async function reassignAssistance(id: number, newSupplierId: number) {
  // Get current assistance data
  const { data: assistance, error: fetchError } = await supabase
    .from("assistances")
    .select(`
      *,
      supplier:suppliers(name)
    `)
    .eq("id", id)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Verify status - only rejected assistances can be reassigned
  if (assistance.status !== "Rejeitada Pelo Fornecedor") {
    throw new Error("Only rejected assistances can be reassigned");
  }
  
  // Get new supplier info
  const { data: newSupplier, error: supplierError } = await supabase
    .from("suppliers")
    .select("name")
    .eq("id", newSupplierId)
    .single();
  
  if (supplierError) throw supplierError;
  
  // Generate a new unique token
  const interaction_token = generateUniqueToken();
  
  // Update the assistance with new supplier and reset status
  const { data, error } = await supabase
    .from("assistances")
    .update({
      supplier_id: newSupplierId,
      status: "Pendente Resposta Inicial",
      interaction_token,
      rejection_reason: null // Clear previous rejection reason
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log activity
  await logActivity(
    "admin", 
    id, 
    `Reassigned from ${assistance.supplier.name} to ${newSupplier.name}`
  );
  
  // Trigger email sending to new supplier
  const emailResult = await sendInitialRequestEmail(id);
  
  return { 
    assistance: data,
    emailSent: emailResult.success
  };
}

async function cancelAssistance(id: number) {
  // Get assistance data for logging
  const { data: assistance, error: fetchError } = await supabase
    .from("assistances")
    .select(`
      id,
      building:buildings(name),
      supplier:suppliers(name),
      status
    `)
    .eq("id", id)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Verify the assistance isn't already completed or cancelled
  if (["Concluída", "Cancelada Pelo Admin"].includes(assistance.status)) {
    throw new Error(`Cannot cancel: Assistance is already ${assistance.status}`);
  }
  
  // Update the status
  const { data, error } = await supabase
    .from("assistances")
    .update({
      status: "Cancelada Pelo Admin"
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log activity
  await logActivity("admin", id, "Assistance cancelled by admin");
  
  return { 
    assistance: data,
    message: "Assistance cancelled successfully"
  };
}

// Activity log functions
async function getActivityLogs(assistanceId: number) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("assistance_id", assistanceId)
    .order("timestamp", { ascending: false });
  
  if (error) throw error;
  
  return { activityLogs: data };
}

async function logActivity(actor: string, assistanceId: number | null, description: string) {
  const { error } = await supabase
    .from("activity_log")
    .insert({
      actor,
      assistance_id: assistanceId,
      description
    });
  
  if (error) {
    console.error("Error logging activity:", error);
  }
}

// Reports function (placeholder for now)
async function getReports(filters: any = {}) {
  // For now, this is a simplified implementation returning basic stats
  // In the future, this can be expanded to generate more complex reports
  
  // Count assistances by status
  const { data: statusCounts, error: statusError } = await supabase
    .from("assistances")
    .select("status, count(*)")
    .group("status");
  
  if (statusError) throw statusError;
  
  // Count assistances by type
  const { data: typeCounts, error: typeError } = await supabase
    .from("assistances")
    .select("type, count(*)")
    .group("type");
  
  if (typeError) throw typeError;
  
  // Get counts by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const { data: monthlyData, error: monthlyError } = await supabase
    .from("assistances")
    .select("date_trunc('month', opened_at) as month, count(*)")
    .gte("opened_at", sixMonthsAgo.toISOString())
    .group("month")
    .order("month");
  
  if (monthlyError) throw monthlyError;
  
  return {
    statusCounts,
    typeCounts,
    monthlyData,
    totalAssistances: statusCounts.reduce((sum, item) => sum + parseInt(item.count), 0)
  };
}

// Helper function to send initial request email
async function sendInitialRequestEmail(assistanceId: number) {
  // Call the send-email edge function to send the email
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      template: "initial_request",
      assistanceId
    })
  });
  
  if (!response.ok) {
    console.error("Error calling send-email function:", await response.text());
    return { success: false };
  }
  
  return { success: true };
}

serve(handler);
