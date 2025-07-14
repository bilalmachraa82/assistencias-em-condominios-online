import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contractor, ContractorWithStats } from '@/types/database';

export const useContractors = () => {
  const [contractors, setContractors] = useState<ContractorWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContractors = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('contractors')
        .select(`
          *,
          active_requests:service_requests!contractor_id(count),
          completed_requests:service_requests!contractor_id(count)
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      // Processar estatísticas
      const contractorsWithStats = data?.map(contractor => ({
        ...contractor,
        active_requests_count: contractor.active_requests?.[0]?.count || 0,
        completed_requests_count: contractor.completed_requests?.[0]?.count || 0
      })) || [];

      setContractors(contractorsWithStats);
    } catch (err) {
      console.error('Error fetching contractors:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createContractor = async (contractorData: Omit<Contractor, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) => {
    try {
      // Obter organização padrão
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single();

      if (!orgData) throw new Error('Organization not found');

      const { data, error } = await supabase
        .from('contractors')
        .insert({
          ...contractorData,
          organization_id: orgData.id,
          insurance_info: contractorData.insurance_info || {},
          certifications: contractorData.certifications || [],
          specializations: contractorData.specializations || [],
          rating: 0,
          total_jobs_completed: 0,
          emergency_available: contractorData.emergency_available || false
        })
        .select()
        .single();

      if (error) throw error;
      
      setContractors(prev => [...prev, { ...data, active_requests_count: 0, completed_requests_count: 0 }]);
      return { success: true, data };
    } catch (err) {
      console.error('Error creating contractor:', err);
      return { success: false, error: err };
    }
  };

  const updateContractor = async (id: string, updateData: Partial<Contractor>) => {
    try {
      const { data, error } = await supabase
        .from('contractors')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setContractors(prev => 
        prev.map(contractor => 
          contractor.id === id 
            ? { ...contractor, ...data }
            : contractor
        )
      );
      
      return { success: true, data };
    } catch (err) {
      console.error('Error updating contractor:', err);
      return { success: false, error: err };
    }
  };

  const deleteContractor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contractors')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setContractors(prev => prev.filter(contractor => contractor.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error deleting contractor:', err);
      return { success: false, error: err };
    }
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  return {
    contractors,
    loading,
    error,
    createContractor,
    updateContractor,
    deleteContractor,
    refetch: fetchContractors
  };
};