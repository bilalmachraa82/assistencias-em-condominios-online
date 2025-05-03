
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Building } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Custom components
import AssistanceFilter from '@/components/assistance/AssistanceFilter';
import AssistanceDetailsWrapper from '@/components/assistance/AssistanceDetailsWrapper';
import AssistanceList from '@/components/assistance/AssistanceList';
import BuildingSelectorDialog from '@/components/assistance/BuildingSelectorDialog';
import AssistanceFormDialog from '@/components/assistance/AssistanceFormDialog';
import useAssistanceData from '@/components/assistance/useAssistanceData';

export default function Assistencias() {
  const [selectedBuilding, setSelectedBuilding] = useState<null | { id: number; name: string }>(null);
  const [isNewAssistanceDialogOpen, setIsNewAssistanceDialogOpen] = useState(false);
  const [isAssistanceFormOpen, setIsAssistanceFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAssistance, setSelectedAssistance] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  
  // Use custom hook to fetch and filter data
  const {
    buildings,
    filteredAssistances,
    isAssistancesLoading,
    isBuildingsLoading,
    refetchAssistances,
    filters
  } = useAssistanceData(sortOrder);

  // Create a wrapper function to handle the Promise<void> return type
  const handleRefetchAssistances = async (): Promise<void> => {
    await refetchAssistances();
  };

  const handleBuildingSelect = (building: any) => {
    setSelectedBuilding(building);
    setIsNewAssistanceDialogOpen(false);
    setIsAssistanceFormOpen(true);
  };

  const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };

  const handleAssistanceSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      
      // Generate tokens
      const interaction_token = generateToken();
      const acceptance_token = generateToken();
      const scheduling_token = generateToken();
      const validation_token = generateToken();
      
      console.log("Creating assistance with data:", {
        ...formData,
        interaction_token,
        acceptance_token,
        scheduling_token,
        validation_token,
        building_id: selectedBuilding?.id,
        status: 'Pendente Aceitação'
      });

      const { data, error } = await supabase
        .from('assistances')
        .insert([
          { 
            ...formData,
            interaction_token,
            acceptance_token,
            scheduling_token,
            validation_token,
            building_id: selectedBuilding?.id,
            status: 'Pendente Aceitação',
            alert_level: 1
          }
        ])
        .select();

      if (error) {
        console.error('Erro ao criar assistência:', error);
        toast.error(`Erro ao criar assistência: ${error.message}`);
        throw error;
      }

      // Log activity
      await supabase
        .from('activity_log')
        .insert([{
          assistance_id: data[0].id,
          description: 'Assistência criada',
          actor: 'Admin'
        }]);

      toast.success('Assistência criada com sucesso!');
      toast.info('Agora você pode enviar um email para o fornecedor com o link de aceitação.');
      setIsAssistanceFormOpen(false);
      setSelectedBuilding(null);
      await refetchAssistances();
    } catch (error) {
      console.error('Erro ao criar assistência:', error);
      toast.error('Erro ao criar assistência. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewAssistance = (assistance: any) => {
    setSelectedAssistance(assistance);
    setIsViewDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in-up">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-extrabold leading-tight">Assistências</h1>
            <p className="text-[#cbd5e1] mt-2 text-lg">Gerencie suas solicitações de manutenção</p>
          </div>
          <div>
            <Button 
              onClick={() => setIsNewAssistanceDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Building className="h-4 w-4" />
              Nova Assistência
            </Button>
          </div>
        </div>

        <BuildingSelectorDialog 
          isOpen={isNewAssistanceDialogOpen}
          onOpenChange={setIsNewAssistanceDialogOpen}
          buildings={buildings}
          isBuildingsLoading={isBuildingsLoading}
          selectedBuilding={selectedBuilding}
          onBuildingChange={setSelectedBuilding}
          onContinue={() => handleBuildingSelect(selectedBuilding)}
        />

        <AssistanceFormDialog 
          isOpen={isAssistanceFormOpen}
          onOpenChange={setIsAssistanceFormOpen}
          selectedBuilding={selectedBuilding}
          onSubmit={handleAssistanceSubmit}
          onCancel={() => setIsAssistanceFormOpen(false)}
          isSubmitting={isSubmitting}
        />

        <AssistanceDetailsWrapper 
          isOpen={isViewDialogOpen}
          onClose={() => setIsViewDialogOpen(false)}
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

        <AssistanceList 
          isLoading={isAssistancesLoading}
          assistances={filteredAssistances}
          onSortOrderChange={toggleSortOrder}
          sortOrder={sortOrder}
          onViewAssistance={handleViewAssistance}
          formatDate={formatDate}
        />
      </div>
    </DashboardLayout>
  );
}
