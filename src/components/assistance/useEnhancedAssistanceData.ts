
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function useEnhancedAssistanceData(sortOrder: 'desc' | 'asc') {
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState<string | null>(null);
  const [supplierFilter, setSupplierFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null
  });
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
      console.log('📋 Fetching assistances with enhanced filters');
      
      try {
        const { data, error } = await supabase
          .from('assistances')
          .select(`
            *,
            buildings(id, name, address),
            suppliers(id, name, email),
            intervention_types(id, name)
          `)
          .order('created_at', { ascending: sortOrder === 'asc' });
        
        if (error) {
          console.error('❌ Error fetching assistances:', error);
          throw error;
        }
        
        console.log(`✅ Fetched ${data?.length || 0} assistances successfully`);
        return data || [];
      } catch (error) {
        console.error('💥 Critical error in assistances query:', error);
        throw error;
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: 3
  });

  // Fetch buildings
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
          .select('id, name, address')
          .eq('is_active', true)
          .order('name');
        
        if (error) {
          console.error('❌ Error fetching buildings:', error);
          throw error;
        }
        
        console.log(`✅ Fetched ${data?.length || 0} buildings successfully`);
        return data || [];
      } catch (error) {
        console.error('💥 Critical error in buildings query:', error);
        throw error;
      }
    },
    retry: 3
  });

  // Fetch suppliers
  const { 
    data: suppliers, 
    isLoading: isSuppliersLoading,
    error: suppliersError 
  } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      console.log('👥 Fetching suppliers...');
      
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select('id, name, email')
          .eq('is_active', true)
          .order('name');
        
        if (error) {
          console.error('❌ Error fetching suppliers:', error);
          throw error;
        }
        
        console.log(`✅ Fetched ${data?.length || 0} suppliers successfully`);
        return data || [];
      } catch (error) {
        console.error('💥 Critical error in suppliers query:', error);
        throw error;
      }
    },
    retry: 3
  });

  // Apply all filters to assistances
  const filteredAssistances = (assistances || []).filter((assistance) => {
    // Search query filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        assistance.description?.toLowerCase().includes(searchLower) ||
        assistance.buildings?.name?.toLowerCase().includes(searchLower) ||
        assistance.suppliers?.name?.toLowerCase().includes(searchLower) ||
        assistance.intervention_types?.name?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Building filter
    if (buildingFilter && assistance.building_id?.toString() !== buildingFilter) {
      return false;
    }

    // Supplier filter
    if (supplierFilter && assistance.supplier_id?.toString() !== supplierFilter) {
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

    // Date range filter
    if (dateRange.from || dateRange.to) {
      const assistanceDate = new Date(assistance.created_at);
      
      if (dateRange.from && assistanceDate < dateRange.from) {
        return false;
      }
      
      if (dateRange.to) {
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999); // Include the entire end date
        if (assistanceDate > endDate) {
          return false;
        }
      }
    }

    return true;
  });

  // Calculate pagination
  const totalItems = filteredAssistances?.length || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  const paginatedAssistances = filteredAssistances?.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Navigation functions
  const goToPage = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages || 1)));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setBuildingFilter(null);
    setSupplierFilter(null);
    setStatusFilter(null);
    setTypeFilter(null);
    setDateRange({ from: null, to: null });
    setPage(1);
  };

  // Force refresh
  const forceRefresh = async () => {
    console.log('🔄 Force refreshing enhanced assistance data...');
    setRefreshTrigger(prev => prev + 1);
    const result = await refetchAssistances();
    console.log('✅ Enhanced force refresh completed');
    return result;
  };

  // Log any errors
  if (assistancesError) console.error('📋 Assistances error:', assistancesError);
  if (buildingsError) console.error('🏗️ Buildings error:', buildingsError);
  if (suppliersError) console.error('👥 Suppliers error:', suppliersError);

  return {
    assistances: assistances || [],
    buildings: buildings || [],
    suppliers: suppliers || [],
    filteredAssistances,
    paginatedAssistances,
    isAssistancesLoading,
    isBuildingsLoading,
    isSuppliersLoading,
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
      supplierFilter,
      setSupplierFilter,
      statusFilter,
      setStatusFilter,
      typeFilter,
      setTypeFilter,
      dateRange,
      setDateRange,
      clearAllFilters
    }
  };
}
