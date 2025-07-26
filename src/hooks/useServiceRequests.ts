import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  ServiceRequest, 
  ServiceRequestWithRelations, 
  ServiceRequestFilters,
  CreateServiceRequestData,
  UpdateServiceRequestData,
  ServiceStatus 
} from '@/types/database';

export const useServiceRequests = (filters?: ServiceRequestFilters) => {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('service_requests')
        .select(`
          *,
          building:buildings(*),
          contractor:contractors(*),
          category:service_categories(*)
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters?.priority?.length) {
        query = query.in('priority', filters.priority);
      }
      if (filters?.building_ids?.length) {
        query = query.in('building_id', filters.building_ids);
      }
      if (filters?.contractor_ids?.length) {
        query = query.in('contractor_id', filters.contractor_ids);
      }
      if (filters?.category_ids?.length) {
        query = query.in('category_id', filters.category_ids);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,request_number.ilike.%${filters.search}%`);
      }
      if (filters?.urgency_min) {
        query = query.gte('urgency_score', filters.urgency_min);
      }
      if (filters?.urgency_max) {
        query = query.lte('urgency_score', filters.urgency_max);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform data to match expected types
      const transformedData = (data || []).map(item => ({
        ...item,
        building: {
          ...item.building,
          coordinates: typeof item.building?.coordinates === 'string' ? item.building.coordinates : ''
        }
      }));
      
      setServiceRequests(transformedData as ServiceRequestWithRelations[]);
    } catch (err) {
      console.error('Error fetching service requests:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createServiceRequest = async (requestData: CreateServiceRequestData) => {
    try {
      // Gerar número da solicitação e token de acesso
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single();

      if (!orgData) throw new Error('Organization not found');

      const { data: requestNumber } = await supabase
        .rpc('generate_request_number', { org_id: orgData.id });

      const { data: accessToken } = await supabase
        .rpc('generate_access_token');

      const { data, error } = await supabase
        .from('service_requests')
        .insert({
          ...requestData,
          organization_id: orgData.id,
          request_number: requestNumber,
          access_token: accessToken,
          metadata: requestData.metadata || {}
        })
        .select(`
          *,
          building:buildings(*),
          contractor:contractors(*),
          category:service_categories(*)
        `)
        .single();

      if (error) throw error;
      
      const transformedData = {
        ...data,
        building: {
          ...data.building,
          coordinates: typeof data.building?.coordinates === 'string' ? data.building.coordinates : ''
        }
      };
      
      setServiceRequests(prev => [transformedData as ServiceRequestWithRelations, ...prev]);
      return { success: true, data };
    } catch (err) {
      console.error('Error creating service request:', err);
      return { success: false, error: err };
    }
  };

  const updateServiceRequest = async (id: string, updateData: UpdateServiceRequestData) => {
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          building:buildings(*),
          contractor:contractors(*),
          category:service_categories(*)
        `)
        .single();

      if (error) throw error;

      const transformedData = {
        ...data,
        building: {
          ...data.building,
          coordinates: typeof data.building?.coordinates === 'string' ? data.building.coordinates : ''
        }
      };

      setServiceRequests(prev => 
        prev.map(req => req.id === id ? transformedData as ServiceRequestWithRelations : req)
      );
      
      return { success: true, data };
    } catch (err) {
      console.error('Error updating service request:', err);
      return { success: false, error: err };
    }
  };

  const updateStatus = async (id: string, status: ServiceStatus) => {
    const updateData: Partial<UpdateServiceRequestData> = { status };
    
    // Definir timestamps automáticos baseados no status
    if (status === 'assigned' && !serviceRequests.find(r => r.id === id)?.assigned_at) {
      updateData.metadata = { assigned_at: new Date().toISOString() };
    } else if (status === 'in_progress') {
      updateData.metadata = { started_at: new Date().toISOString() };
    } else if (status === 'completed') {
      updateData.metadata = { completed_at: new Date().toISOString() };
    }

    return updateServiceRequest(id, updateData);
  };

  const deleteServiceRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setServiceRequests(prev => prev.filter(req => req.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error deleting service request:', err);
      return { success: false, error: err };
    }
  };

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  return {
    serviceRequests,
    loading,
    error,
    createServiceRequest,
    updateServiceRequest,
    updateStatus,
    deleteServiceRequest,
    refetch: fetchServiceRequests
  };
};