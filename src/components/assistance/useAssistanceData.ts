
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function useAssistanceData(sortOrder: 'desc' | 'asc') {
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch assistances
  const { 
    data: assistances, 
    isLoading: isAssistancesLoading, 
    refetch: refetchAssistances,
    error: assistancesError
  } = useQuery({
    queryKey: ['assistances', sortOrder, refreshTrigger],
    queryFn: async () => {
      console.log('Fetching assistances with sort order:', sortOrder);
      
      try {
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
        
        console.log(`Fetched ${data?.length || 0} assistances`);
        return data || [];
      } catch (err) {
        console.error('Exception in assistance fetch:', err);
        throw err;
      }
    },
    staleTime: 0,
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false
  });

  // Fetch buildings
  const { 
    data: buildings, 
    isLoading: isBuildingsLoading,
    error: buildingsError
  } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('buildings')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Error fetching buildings:', error);
          throw error;
        }
        return data || [];
      } catch (err) {
        console.error('Exception in buildings fetch:', err);
        throw err;
      }
    },
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false
  });

  // Apply filters to assistances
  const filteredAssistances = assistances?.filter((assistance) => {
    // Search query filter
    if (searchQuery && !assistance.description?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !assistance.buildings?.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !assistance.suppliers?.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Building filter
    if (buildingFilter && assistance.building_id?.toString() !== buildingFilter) {
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

  // Calculate total items and pages
  const totalItems = filteredAssistances?.length || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Get paginated items
  const paginatedAssistances = filteredAssistances?.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Handle page navigation
  const goToPage = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages || 1)));
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  // Force a refresh of the data
  const forceRefresh = async () => {
    console.log('Force refreshing assistance data...');
    setRefreshTrigger(prev => prev + 1); // Increment to trigger refetch
    try {
      const result = await refetchAssistances();
      console.log('Data refresh complete', result.data?.length || 0, 'records');
      return result;
    } catch (err) {
      console.error('Error during forced refresh:', err);
      throw err;
    }
  };

  return {
    assistances,
    buildings,
    filteredAssistances,
    paginatedAssistances,
    isAssistancesLoading,
    isBuildingsLoading,
    assistancesError,
    buildingsError,
    refetchAssistances: forceRefresh,
    pagination: {
      currentPage: page,
      pageSize,
      totalPages,
      totalItems,
      goToPage,
      setPageSize: handlePageSizeChange
    },
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
