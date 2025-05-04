
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function useAssistanceData(sortOrder: 'desc' | 'asc') {
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [fetchError, setFetchError] = useState<Error | null>(null);

  // Fetch assistances with improved error handling and retry logic
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
          setFetchError(new Error(error.message));
          throw error;
        }
        
        // Log the data for debugging
        console.log(`Fetched ${data?.length || 0} assistances:`, data);
        return data || [];
      } catch (err) {
        console.error('Exception in assistance fetch:', err);
        setFetchError(err instanceof Error ? err : new Error('Unknown error'));
        return []; // Return empty array to prevent error state
      }
    },
    staleTime: 0,
    retry: 3, // Increase retry attempts
    retryDelay: 1000,
    refetchOnWindowFocus: true // Enable refetch on window focus
  });

  // Fetch buildings with improved error handling
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
        
        console.log(`Fetched ${data?.length || 0} buildings`);
        return data || [];
      } catch (err) {
        console.error('Exception in buildings fetch:', err);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: true
  });

  // Show toast once when there's an error
  useEffect(() => {
    if (assistancesError || buildingsError) {
      const errorMessage = (assistancesError || buildingsError)?.message || 'Error fetching data';
      toast.error(`Failed to load data: ${errorMessage}`);
      console.error('Data loading error:', assistancesError || buildingsError);
    }
  }, [assistancesError, buildingsError]);

  // Apply filters to assistances with null checks
  const filteredAssistances = assistances?.filter((assistance) => {
    if (!assistance) return false;
    
    // Search query filter
    if (searchQuery && !((assistance.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (assistance.buildings?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (assistance.suppliers?.name || '').toLowerCase().includes(searchQuery.toLowerCase()))) {
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
  }) || [];

  // Calculate total items and pages
  const totalItems = filteredAssistances.length || 0;
  const totalPages = Math.ceil(totalItems / pageSize) || 1; // Ensure at least 1 page

  // Get paginated items with bounds checking
  const paginatedAssistances = filteredAssistances.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Handle page navigation with bounds checking
  const goToPage = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages || 1)));
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  // Force a refresh of the data with better error handling
  const forceRefresh = async () => {
    console.log('Force refreshing assistance data...');
    setRefreshTrigger(prev => prev + 1); // Increment to trigger refetch
    try {
      const result = await refetchAssistances();
      console.log('Data refresh complete', result.data?.length || 0, 'records');
      
      if (result.isError) {
        toast.error(`Failed to refresh: ${result.error.message}`);
        return { success: false, error: result.error };
      }
      
      return { success: true, data: result.data };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error during refresh');
      console.error('Error during forced refresh:', error);
      toast.error(`Failed to refresh: ${error.message}`);
      return { success: false, error };
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
    fetchError,
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
