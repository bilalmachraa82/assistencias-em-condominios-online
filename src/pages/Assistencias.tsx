import React, { useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Enhanced components
import AdvancedFilters from '@/components/assistance/filters/AdvancedFilters';
import FollowUpStats from '@/components/assistance/analytics/FollowUpStats';
import FollowUpActions from '@/components/assistance/actions/FollowUpActions';

// Existing components  
import AssistanceDetails from '@/components/assistance/AssistanceDetails';
import AssistanceList from '@/components/assistance/AssistanceList';
import NewAssistanceButton from '@/components/assistance/NewAssistanceButton';
import useEnhancedAssistanceData from '@/components/assistance/useEnhancedAssistanceData';
import { formatDate } from '@/utils/DateTimeUtils';
import { Pagination } from '@/components/ui/pagination';
import { supabase } from '@/integrations/supabase/client';
import { validateDeleteAssistanceResult } from '@/types/assistance';

export default function Assistencias() {
  const [selectedAssistance, setSelectedAssistance] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  
  // Use enhanced hook for better filtering and analytics
  const {
    assistances,
    buildings,
    suppliers,
    paginatedAssistances,
    filteredAssistances,
    isAssistancesLoading,
    isBuildingsLoading,
    isSuppliersLoading,
    refetchAssistances,
    pagination,
    filters
  } = useEnhancedAssistanceData(sortOrder);

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
        setSelectedAssistance(assistance);
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

  // Enhanced refresh function
  const handleRefetchAssistances = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 Refetching assistances data...');
      await refetchAssistances();
      
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

  // Enhanced delete function with better error handling
  const handleDeleteAssistance = async (assistance: any) => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    console.log(`🗑️ Starting deletion process for assistance #${assistance.id}`);
    
    try {
      const { data: result, error: rpcError } = await supabase
        .rpc('delete_assistance_safely', { p_assistance_id: assistance.id });

      if (rpcError) {
        console.error('❌ RPC Error during deletion:', rpcError);
        toast.error(`Erro ao eliminar assistência: ${rpcError.message}`);
        return;
      }

      console.log('📋 Deletion result:', result);
      
      const validatedResult = validateDeleteAssistanceResult(result);

      if (!validatedResult.success) {
        console.error('❌ Function returned failure:', validatedResult.error);
        toast.error(validatedResult.error || 'Erro ao eliminar assistência');
        return;
      }

      console.log(`✅ Assistance #${assistance.id} deleted successfully`);
      toast.success(`Assistência #${assistance.id} eliminada com sucesso!`);
      
      if (selectedAssistance && selectedAssistance.id === assistance.id) {
        setIsViewDialogOpen(false);
        setSelectedAssistance(null);
      }
      
      await handleRefetchAssistances();
      
    } catch (error) {
      console.error(`💥 Exception during deletion:`, error);
      toast.error('Erro inesperado ao eliminar assistência');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle dialog close with refresh
  const handleDialogClose = useCallback(async () => {
    console.log('🚪 Closing assistance dialog and refreshing data');
    setIsViewDialogOpen(false);
    await handleRefetchAssistances();
  }, [handleRefetchAssistances]);

  return (
    <DashboardLayout>
      <div className="animate-fade-in-up space-y-8">
        {/* Modern Header Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-vibrant opacity-5 blur-3xl" />
          <div className="relative glass-card p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-3">
                <h1 className="text-5xl lg:text-6xl font-bold gradient-text leading-tight">
                  Assistências
                </h1>
                <p className="text-muted-foreground text-lg font-medium max-w-2xl">
                  Gerencie suas solicitações de manutenção com tecnologia avançada
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-primary rounded-full animate-pulse-soft" />
                    <span>Sistema em tempo real</span>
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <span>Total: {filteredAssistances?.length || 0}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <NewAssistanceButton 
                  buildings={buildings || []}
                  isBuildingsLoading={isBuildingsLoading}
                  onAssistanceCreated={handleRefetchAssistances}
                />
              </div>
            </div>
          </div>
        </div>

        <AssistanceDetails 
          isOpen={isViewDialogOpen}
          onClose={handleDialogClose}
          assistance={selectedAssistance}
          onAssistanceUpdate={handleRefetchAssistances}
        />

        {/* Modern Tabs with Glass Effect */}
        <div className="glass-card p-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-glass-bg border border-glass-border backdrop-blur-xl grid w-full grid-cols-2 p-1 rounded-xl">
              <TabsTrigger 
                value="list" 
                className="rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-colored"
              >
                Lista Detalhada
              </TabsTrigger>
              <TabsTrigger 
                value="analytics"
                className="rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-colored"
              >
                Resumo & Análise
              </TabsTrigger>
            </TabsList>
          
            <TabsContent value="list" className="space-y-8 animate-fade-in">
              <div className="glass-card p-6">
                <AdvancedFilters
                  buildings={buildings || []}
                  suppliers={suppliers || []}
                  selectedBuilding={filters.buildingFilter}
                  selectedSupplier={filters.supplierFilter}
                  selectedStatus={filters.statusFilter}
                  dateRange={filters.dateRange}
                  onBuildingChange={filters.setBuildingFilter}
                  onSupplierChange={filters.setSupplierFilter}
                  onStatusChange={filters.setStatusFilter}
                  onDateRangeChange={filters.setDateRange}
                  onClearAll={filters.clearAllFilters}
                />
              </div>

              <div className="glass-card p-6">
                <AssistanceList 
                  isLoading={isAssistancesLoading || isDeleting}
                  assistances={paginatedAssistances || []}
                  onSortOrderChange={toggleSortOrder}
                  sortOrder={sortOrder}
                  onViewAssistance={handleViewAssistance}
                  onDeleteAssistance={handleDeleteAssistance}
                  formatDate={formatDate}
                />
              </div>

              {!isAssistancesLoading && pagination.totalItems > 0 && (
                <div className="glass-card p-6">
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
          
            <TabsContent value="analytics" className="space-y-8 animate-fade-in">
              <div className="glass-card p-6">
                <AdvancedFilters
                  buildings={buildings || []}
                  suppliers={suppliers || []}
                  selectedBuilding={filters.buildingFilter}
                  selectedSupplier={filters.supplierFilter}
                  selectedStatus={filters.statusFilter}
                  dateRange={filters.dateRange}
                  onBuildingChange={filters.setBuildingFilter}
                  onSupplierChange={filters.setSupplierFilter}
                  onStatusChange={filters.setStatusFilter}
                  onDateRangeChange={filters.setDateRange}
                  onClearAll={filters.clearAllFilters}
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="glass-card p-6">
                  <FollowUpStats
                    assistances={filteredAssistances || []}
                    buildings={buildings || []}
                    suppliers={suppliers || []}
                    selectedBuilding={filters.buildingFilter}
                    selectedSupplier={filters.supplierFilter}
                  />
                </div>
                
                <div className="glass-card p-6">
                  <FollowUpActions
                    assistances={filteredAssistances || []}
                    buildings={buildings || []}
                    suppliers={suppliers || []}
                    selectedBuilding={filters.buildingFilter}
                    selectedSupplier={filters.supplierFilter}
                    selectedStatus={filters.statusFilter}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
