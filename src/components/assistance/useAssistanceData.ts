
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function useAssistanceData(sortOrder: 'desc' | 'asc') {
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // Fetch assistances
  const { data: assistances, isLoading: isAssistancesLoading, refetch: refetchAssistances } = useQuery({
    queryKey: ['assistances', sortOrder],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assistances')
        .select(`
          *,
          buildings(name),
          suppliers(name),
          intervention_types(name)
        `)
        .order('created_at', { ascending: sortOrder === 'asc' });
      
      if (error) {
        console.error('Error fetching assistances:', error);
        throw error;
      }
      return data;
    },
  });

  // Fetch buildings
  const { data: buildings, isLoading: isBuildingsLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching buildings:', error);
        throw error;
      }
      return data;
    },
  });

  // Apply filters to assistances
  const filteredAssistances = assistances?.filter((assistance) => {
    // Search query filter
    if (searchQuery && !assistance.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !assistance.buildings.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !assistance.suppliers.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Building filter
    if (buildingFilter && assistance.building_id.toString() !== buildingFilter) {
      return false;
    }

    // Status filter
    if (statusFilter && assistance.status !== statusFilter) {
      return false;
    }

    // Type filter
    if (typeFilter && assistance.type !== typeFilter) {
      return false;
    }

    return true;
  });

  return {
    assistances,
    buildings,
    filteredAssistances,
    isAssistancesLoading,
    isBuildingsLoading,
    refetchAssistances,
    filters: {
      searchQuery,
      setSearchQuery,
      buildingFilter,
      setBuildingFilter,
      statusFilter,
      setStatusFilter,
      typeFilter,
      setTypeFilter
    }
  };
}
