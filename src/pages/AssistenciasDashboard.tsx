
import React, { useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';

// Custom components
import AssistanceFilter from '@/components/assistance/AssistanceFilter';
import AssistanceDetailsWrapper from '@/components/assistance/AssistanceDetailsWrapper';
import AssistanceList from '@/components/assistance/AssistanceList';
import { AssistanceCalendarView } from '@/components/assistance/AssistanceCalendarView';
import NewAssistanceButton from '@/components/assistance/NewAssistanceButton';
import RunRemindersButton from '@/components/assistance/RunRemindersButton';
import useAssistanceData from '@/components/assistance/useAssistanceData';
import { formatDate } from '@/utils/DateTimeUtils';
import { Pagination } from '@/components/ui/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { getUserFriendlyError, logError } from '@/utils/ErrorUtils';

export default function AssistenciasDashboard() {
  const [selectedAssistance, setSelectedAssistance] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  
  // Use custom hook to fetch and filter data
  const {
    buildings,
    paginatedAssistances,
    isAssistancesLoading,
    isBuildingsLoading,
    refetchAssistances,
    pagination,
    filters
  } = useAssistanceData(sortOrder);

  // Handle assistance view
  const handleViewAssistance = async (assistance: any) => {
    try {
      console.log(`👁️ Fetching fresh data for assistance #${assistance.id}`);
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
        console.error('❌ Error fetching fresh assistance data:', error);
        toast.error('Erro ao buscar dados atualizados da assistência');
        setSelectedAssistance(assistance); // Fallback to the provided assistance
      } else {
        console.log('✅ Fresh assistance data fetched successfully');
        setSelectedAssistance(freshAssistance);
      }
      
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error('❌ Error in handleViewAssistance:', error);
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
      console.log('🔄 Refetching assistances data...');
      await refetchAssistances();
      
      // If an assistance is currently selected, refresh its data too
      if (selectedAssistance && isViewDialogOpen) {
        console.log(`🔄 Refreshing selected assistance #${selectedAssistance.id}`);
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
          console.log('✅ Updated selected assistance with fresh data');
          setSelectedAssistance(freshAssistance);
        }
      }
      
      toast.success('Dados atualizados com sucesso');
    } catch (error) {
      console.error('❌ Error refetching assistances:', error);
      toast.error('Erro ao atualizar a lista de assistências');
    }
  }, [refetchAssistances, selectedAssistance, isViewDialogOpen]);

  // Handle assistance deletion with robust error handling and verification
  const handleDeleteAssistance = async (assistance: any): Promise<void> => {
    try {
      console.log(`🗑️ Starting robust deletion process for assistance #${assistance.id}`);
      setIsDeleting(true);
      
      // Use the new robust deletion function from Supabase
      const { data: deleteResult, error: deleteError } = await supabase
        .rpc('delete_assistance_safely', { p_assistance_id: assistance.id });

      if (deleteError) {
        console.error('❌ Database RPC delete error:', deleteError);
        toast.error(getUserFriendlyError(deleteError, 'Erro ao executar função de eliminação segura'));
        return;
      }

      console.log('📋 Deletion result:', deleteResult);

      // Check if the function returned success
      if (!deleteResult?.success) {
        console.error('❌ Deletion function returned failure:', deleteResult?.error);
        toast.error(deleteResult?.error || 'Erro desconhecido na eliminação');
        return;
      }

      console.log(`✅ Assistance #${assistance.id} successfully deleted via safe function`);
      
      // Verify the assistance was actually deleted by trying to fetch it
      const { data: verifyAssistance, error: verifyError } = await supabase
        .from('assistances')
        .select('id')
        .eq('id', assistance.id)
        .maybeSingle();

      if (verifyError) {
        console.warn('⚠️ Could not verify deletion (non-critical):', verifyError);
      } else if (verifyAssistance) {
        console.error('💥 CRITICAL: Assistance still exists after deletion!');
        toast.error('Erro crítico: assistência ainda existe após eliminação');
        return;
      } else {
        console.log('✅ Verified: assistance no longer exists in database');
      }
      
      // Close the dialog if it was the selected assistance
      if (selectedAssistance?.id === assistance.id) {
        console.log('🚪 Closing dialog for deleted assistance');
        setIsViewDialogOpen(false);
        setSelectedAssistance(null);
      }
      
      // Force complete cache invalidation and refetch
      console.log('🔄 Forcing complete cache invalidation and refetch...');
      await handleRefetchAssistances();
      
      toast.success(`Assistência #${assistance.id} eliminada definitivamente!`);
      console.log(`🎉 Complete deletion process finished for assistance #${assistance.id}`);
      
    } catch (error: any) {
      console.error(`💥 Critical error during robust deletion of assistance #${assistance.id}:`, error);
      logError('deleteAssistance', error);
      toast.error(getUserFriendlyError(error, 'Erro crítico na eliminação robusta'));
    } finally {
      setIsDeleting(false);
      console.log('🏁 Deletion process cleanup completed');
    }
  };

  // Handle dialog close with refresh
  const handleDialogClose = useCallback(async () => {
    console.log('🚪 Closing assistance dialog and refreshing data');
    setIsViewDialogOpen(false);
    // Refresh data when dialog is closed to ensure list is updated
    await handleRefetchAssistances();
  }, [handleRefetchAssistances]);

  return (
    <DashboardLayout>
      <div className="animate-fade-in-up">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 lg:mb-10 gap-4">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">Assistências</h1>
            <p className="text-[#cbd5e1] mt-2 text-lg">Gerencie suas solicitações de manutenção</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <RunRemindersButton />
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            <AssistanceList 
              isLoading={isAssistancesLoading || isDeleting}
              assistances={paginatedAssistances || []}
              onSortOrderChange={toggleSortOrder}
              sortOrder={sortOrder}
              onViewAssistance={handleViewAssistance}
              onDeleteAssistance={handleDeleteAssistance}
              formatDate={formatDate}
            />

            {/* Pagination controls */}
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
          </TabsContent>
          
          <TabsContent value="calendar">
            <AssistanceCalendarView 
              assistances={paginatedAssistances || []}
              isLoading={isAssistancesLoading}
              onViewAssistance={handleViewAssistance}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
