
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

  // Fetch assistances with enhanced error handling
  const { 
    data: assistances, 
    isLoading: isAssistancesLoading, 
    refetch: refetchAssistances,
    error: assistancesError 
  } = useQuery({
    queryKey: ['assistances', sortOrder, refreshTrigger],
    queryFn: async () => {
      console.log('📋 Fetching assistances with sort order:', sortOrder);
      
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
          console.error('❌ Error fetching assistances:', error);
          throw error;
        }
        
        console.log(`✅ Fetched ${data?.length || 0} assistances successfully`);
        if (data?.length > 0) {
          console.log('📊 Sample assistance data:', data[0]);
        }
        return data;
      } catch (error) {
        console.error('💥 Critical error in assistances query:', error);
        throw error;
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      console.log(`🔄 Retry attempt ${failureCount} for assistances query`);
      return failureCount < 3;
    },
    onError: (error) => {
      console.error('📋 Assistances query failed:', error);
    }
  });

  // Fetch buildings with enhanced error handling
  const { 
    data: buildings, 
    isLoading: isBuildingsLoading,
    error: buildingsError 
  } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      console.log('🏗️ Fetching buildings...');
      
      try {
        const { data, error } = await supabase
          .from('buildings')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('❌ Error fetching buildings:', error);
          throw error;
        }
        
        console.log(`✅ Fetched ${data?.length || 0} buildings successfully`);
        return data;
      } catch (error) {
        console.error('💥 Critical error in buildings query:', error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      console.log(`🔄 Retry attempt ${failureCount} for buildings query`);
      return failureCount < 3;
    },
    onError: (error) => {
      console.error('🏗️ Buildings query failed:', error);
    }
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
    console.log('🔄 Force refreshing assistance data...');
    setRefreshTrigger(prev => prev + 1);
    const result = await refetchAssistances();
    console.log('✅ Force refresh completed');
    return result;
  };

  // Log any errors
  if (assistancesError) {
    console.error('📋 Assistances error state:', assistancesError);
  }
  if (buildingsError) {
    console.error('🏗️ Buildings error state:', buildingsError);
  }

  return {
    assistances,
    buildings,
    filteredAssistances,
    paginatedAssistances,
    isAssistancesLoading,
    isBuildingsLoading,
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
