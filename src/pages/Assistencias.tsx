
import React, { useState, useCallback, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';

// Custom components
import AssistanceFilter from '@/components/assistance/AssistanceFilter';
import AssistanceDetailsWrapper from '@/components/assistance/AssistanceDetailsWrapper';
import AssistanceList from '@/components/assistance/AssistanceList';
import NewAssistanceButton from '@/components/assistance/NewAssistanceButton';
import RunRemindersButton from '@/components/assistance/RunRemindersButton';
import ProcessRemindersButton from '@/components/assistance/ProcessRemindersButton';
import useAssistanceData from '@/components/assistance/useAssistanceData';
import { formatDate } from '@/utils/DateTimeUtils';
import { Pagination } from '@/components/ui/pagination';
import { supabase } from '@/integrations/supabase/client';
import { getUserFriendlyError, logError } from '@/utils/ErrorUtils';

export default function Assistencias() {
  const [selectedAssistance, setSelectedAssistance] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Use custom hook to fetch and filter data
  const {
    buildings,
    paginatedAssistances,
    isAssistancesLoading,
    isBuildingsLoading,
    assistancesError,
    fetchError,
    refetchAssistances,
    pagination,
    filters
  } = useAssistanceData(sortOrder);

  // Handle errors from data fetching
  useEffect(() => {
    if (assistancesError || fetchError) {
      const error = assistancesError || fetchError;
      const errorMessage = getUserFriendlyError(
        error, 
        'Erro ao carregar assistências. Tente novamente mais tarde.'
      );
      setLoadingError(errorMessage);
      console.error('Assistance loading error:', error);
    } else {
      setLoadingError(null);
    }
  }, [assistancesError, fetchError]);

  // Force a refresh when the component mounts with retry logic
  useEffect(() => {
    const initialLoad = async () => {
      try {
        console.log("Initial loading of assistances");
        const result = await refetchAssistances();
        
        if (!result.success) {
          console.error("Error during initial data load:", result.error);
          setLoadingError(getUserFriendlyError(
            result.error,
            'Erro ao carregar dados iniciais. Tente novamente mais tarde.'
          ));
        }
      } catch (err) {
        console.error("Exception during initial data load:", err);
        setLoadingError(getUserFriendlyError(
          err, 
          'Erro ao carregar dados iniciais. Tente novamente mais tarde.'
        ));
      }
    };
    
    initialLoad();
  }, [refetchAssistances]);

  // Handle assistance view
  const handleViewAssistance = async (assistance: any) => {
    try {
      console.log(`Fetching fresh data for assistance #${assistance.id}`);
      const { data: freshAssistance, error } = await supabase
        .from('assistances')
        .select(`
          *,
          buildings(name),
          suppliers(name),
          intervention_types(name)
        `)
        .eq('id', assistance.id)
        .single();
        
      if (error) {
        console.error('Error fetching fresh assistance data:', error);
        toast.error('Erro ao buscar dados atualizados da assistência');
        setSelectedAssistance(assistance); // Fallback to the provided assistance
      } else {
        console.log('Fresh assistance data fetched successfully');
        setSelectedAssistance(freshAssistance);
      }
      
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error('Error in handleViewAssistance:', error);
      setSelectedAssistance(assistance);
      setIsViewDialogOpen(true);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  // Create a wrapper function to handle the Promise<void> return type
  const handleRefetchAssistances = useCallback(async (): Promise<void> => {
    try {
      console.log('Refetching assistances data...');
      const result = await refetchAssistances();
      
      if (!result.success) {
        throw result.error;
      }
      
      // If an assistance is currently selected, refresh its data too
      if (selectedAssistance && isViewDialogOpen) {
        console.log(`Refreshing selected assistance #${selectedAssistance.id}`);
        const { data: freshAssistance, error } = await supabase
          .from('assistances')
          .select(`
            *,
            buildings(name),
            suppliers(name),
            intervention_types(name)
          `)
          .eq('id', selectedAssistance.id)
          .single();
          
        if (!error && freshAssistance) {
          console.log('Updated selected assistance with fresh data');
          setSelectedAssistance(freshAssistance);
        }
      }
      
      toast.success('Dados atualizados com sucesso');
    } catch (error) {
      console.error('Error refetching assistances:', error);
      toast.error('Erro ao atualizar a lista de assistências');
    }
  }, [refetchAssistances, selectedAssistance, isViewDialogOpen]);

  // Handle retry button click
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await handleRefetchAssistances();
      setLoadingError(null);
    } catch (err) {
      console.error("Error during retry:", err);
      setLoadingError(getUserFriendlyError(
        err, 
        'Erro ao tentar novamente. Tente mais tarde.'
      ));
    } finally {
      setIsRetrying(false);
    }
  };

  // Handle assistance deletion
  const handleDeleteAssistance = async (assistance: any) => {
    try {
      console.log("Attempting to delete assistance:", assistance.id);
      setIsDeleting(true);
      
      // Delete the assistance from the database
      const { error } = await supabase
        .from('assistances')
        .delete()
        .eq('id', assistance.id);

      if (error) {
        console.error('Erro ao excluir assistência:', error);
        toast.error(getUserFriendlyError(error, 'Erro ao excluir assistência'));
        return;
      }

      // Log the activity
      await supabase
        .from('activity_log')
        .insert([{
          assistance_id: assistance.id,
          description: `Assistência #${assistance.id} excluída`,
          actor: 'admin'
        }])
        .then(({ error: logError }) => {
          if (logError) {
            console.error('Erro ao registrar atividade:', logError);
            // Continue even if logging fails
          }
        });
      
      // Close the dialog if it was the selected assistance
      if (selectedAssistance?.id === assistance.id) {
        setIsViewDialogOpen(false);
        setSelectedAssistance(null);
      }
      
      // Refetch the data after successful deletion
      await handleRefetchAssistances();
      
      toast.success(`Assistência #${assistance.id} excluída com sucesso!`);
    } catch (error: any) {
      logError('deleteAssistance', error);
      toast.error(getUserFriendlyError(error, 'Erro ao excluir assistência'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle dialog close with refresh
  const handleDialogClose = useCallback(async () => {
    setIsViewDialogOpen(false);
    // Refresh data when dialog is closed to ensure list is updated
    console.log("Dialog closed, refreshing data...");
    await handleRefetchAssistances();
  }, [handleRefetchAssistances]);

  // Show loading error if data fetching failed
  if (loadingError && !isAssistancesLoading) {
    return (
      <DashboardLayout>
        <div className="animate-fade-in-up">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 lg:mb-10 gap-4">
            <div>
              <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">Assistências</h1>
              <p className="text-[#cbd5e1] mt-2 text-lg">Gerencie suas solicitações de manutenção</p>
            </div>
          </div>
          
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold text-red-400 mb-2">Erro ao carregar dados</h3>
            <p className="text-white/80">{loadingError}</p>
            <button 
              onClick={handleRetry}
              disabled={isRetrying}
              className="mt-4 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? 'Tentando...' : 'Tentar novamente'}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Main render
  return (
    <DashboardLayout>
      <div className="animate-fade-in-up">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 lg:mb-10 gap-4">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">Assistências</h1>
            <p className="text-[#cbd5e1] mt-2 text-lg">Gerencie suas solicitações de manutenção</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <NewAssistanceButton 
              buildings={buildings || []}
              isBuildingsLoading={isBuildingsLoading}
              onAssistanceCreated={handleRefetchAssistances}
            />
          </div>
        </div>

        <AssistanceDetailsWrapper 
          isOpen={isViewDialogOpen}
          onClose={handleDialogClose}
          assistance={selectedAssistance}
          onAssistanceUpdate={handleRefetchAssistances}
        />

        <AssistanceFilter
          searchQuery={filters.searchQuery}
          onSearchChange={filters.setSearchQuery}
          buildingFilter={filters.buildingFilter}
          onBuildingFilterChange={filters.setBuildingFilter}
          statusFilter={filters.statusFilter}
          onStatusFilterChange={filters.setStatusFilter}
          typeFilter={filters.typeFilter}
          onTypeFilterChange={filters.setTypeFilter}
          buildings={buildings || []}
          isBuildingsLoading={isBuildingsLoading}
        />

        {/* Show loading indicator or empty state if needed */}
        {isAssistancesLoading && (
          <div className="bg-white/5 rounded-3xl p-6 text-center my-8">
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <p className="text-gray-400">Carregando assistências...</p>
          </div>
        )}

        {!isAssistancesLoading && (!paginatedAssistances || paginatedAssistances.length === 0) && (
          <div className="bg-white/5 rounded-3xl p-6 text-center my-8">
            <p className="text-gray-400 py-12">Nenhuma assistência encontrada.</p>
            <button
              onClick={handleRetry}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded transition-all"
            >
              Atualizar dados
            </button>
          </div>
        )}

        {!isAssistancesLoading && paginatedAssistances && paginatedAssistances.length > 0 && (
          <AssistanceList 
            isLoading={isAssistancesLoading || isDeleting}
            assistances={paginatedAssistances}
            onSortOrderChange={toggleSortOrder}
            sortOrder={sortOrder}
            onViewAssistance={handleViewAssistance}
            onDeleteAssistance={handleDeleteAssistance}
            formatDate={formatDate}
          />
        )}

        {/* Pagination controls - only show when we have data */}
        {!isAssistancesLoading && pagination.totalItems > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              totalItems={pagination.totalItems}
              onPageChange={pagination.goToPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[10, 20, 50, 100]}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
