
import { supabase } from "@/integrations/supabase/client";

// API Key for admin access (in a real app, this would be handled more securely)
// For now, we'll hard-code it for simplicity, but in production this would come from an environment variable
const ADMIN_API_KEY = "your-admin-api-key"; // Replace with your actual API key

// Helper function to call admin-handler edge function
export async function callAdminHandler(action: string, data?: any, filters?: any, id?: number) {
  try {
    const response = await fetch("https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/admin-handler", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ADMIN_API_KEY
      },
      body: JSON.stringify({
        action,
        data,
        filters,
        id
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API call failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling ${action}:`, error);
    throw error;
  }
}

// Buildings API
export const buildingsApi = {
  getAll: (filters?: any) => callAdminHandler("getBuildings", undefined, filters),
  create: (data: any) => callAdminHandler("createBuilding", data),
  update: (id: number, data: any) => callAdminHandler("updateBuilding", data, undefined, id),
  toggleActive: (id: number) => callAdminHandler("toggleBuildingActive", undefined, undefined, id)
};

// Suppliers API
export const suppliersApi = {
  getAll: (filters?: any) => callAdminHandler("getSuppliers", undefined, filters),
  create: (data: any) => callAdminHandler("createSupplier", data),
  update: (id: number, data: any) => callAdminHandler("updateSupplier", data, undefined, id),
  toggleActive: (id: number) => callAdminHandler("toggleSupplierActive", undefined, undefined, id)
};

// Intervention Types API
export const interventionTypesApi = {
  getAll: (filters?: any) => callAdminHandler("getInterventionTypes", undefined, filters),
  create: (data: any) => callAdminHandler("createInterventionType", data),
  update: (id: number, data: any) => callAdminHandler("updateInterventionType", data, undefined, id),
  delete: (id: number) => callAdminHandler("deleteInterventionType", undefined, undefined, id)
};

// Assistances API
export const assistancesApi = {
  getAll: (filters?: any) => callAdminHandler("getAssistances", undefined, filters),
  getDetails: (id: number) => callAdminHandler("getAssistanceDetails", undefined, undefined, id),
  create: (data: any) => callAdminHandler("createAssistance", data),
  reassign: (id: number, supplierId: number) => callAdminHandler("reassignAssistance", { supplier_id: supplierId }, undefined, id),
  cancel: (id: number) => callAdminHandler("cancelAssistance", undefined, undefined, id)
};

// Reports API
export const reportsApi = {
  getReports: (data?: any) => callAdminHandler("getReports", data)
};

// Activity Logs API
export const activityLogsApi = {
  getByAssistance: (assistanceId: number) => callAdminHandler("getActivityLogs", { assistance_id: assistanceId })
};
