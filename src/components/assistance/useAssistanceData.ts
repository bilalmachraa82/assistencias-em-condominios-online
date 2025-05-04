
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
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add a refresh trigger

  // Fetch assistances
  const { 
    data: assistances, 
    isLoading: isAssistancesLoading, 
    refetch: refetchAssistances 
  } = useQuery({
    queryKey: ['assistances', sortOrder, refreshTrigger], // Add refreshTrigger to queryKey
    queryFn: async () => {
      console.log('Fetching assistances with sort order:', sortOrder);
      
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
      return data;
    },
    staleTime: 0, // Always consider data stale to ensure fresh data
    refetchOnWindowFocus: true, // Refresh when window regains focus
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
  const forceRefresh = () => {
    console.log('Force refreshing assistance data...');
    setRefreshTrigger(prev => prev + 1); // Increment to trigger refetch
    return refetchAssistances();
  };

  return {
    assistances,
    buildings,
    filteredAssistances,
    paginatedAssistances,
    isAssistancesLoading,
    isBuildingsLoading,
    refetchAssistances: forceRefresh, // Use the enhanced refresh function
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
