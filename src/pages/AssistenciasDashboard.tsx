
import React, { useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tab } from '@headlessui/react';
import { CalendarDays, Clock, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';

// Import existing components
import AssistanceFilter from '@/components/assistance/AssistanceFilter';
import AssistanceDetailsWrapper from '@/components/assistance/AssistanceDetailsWrapper';
import AssistanceList from '@/components/assistance/AssistanceList';
import NewAssistanceButton from '@/components/assistance/NewAssistanceButton';
import EmailSender from '@/components/assistance/EmailSender';
import RunRemindersButton from '@/components/assistance/RunRemindersButton';
import ProcessRemindersButton from '@/components/assistance/ProcessRemindersButton';
import useAssistanceData from '@/components/assistance/useAssistanceData';
import { formatDate } from '@/utils/DateTimeUtils';
import { supabase } from '@/integrations/supabase/client';
import { getUserFriendlyError, logError } from '@/utils/ErrorUtils';
import { AssistanceCalendarView } from '@/components/assistance/AssistanceCalendarView';

// Component for the actions menu that appears when viewing an assistance
const AssistanceActions = ({ assistance, onAssistanceUpdate }) => {
  if (!assistance) return null;
  
  return (
    <div className="mt-4 border-t pt-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Ações</h3>
        <div className="flex flex-wrap gap-2">
          <EmailSender 
            assistanceId={assistance.id} 
            assistanceStatus={assistance.status}
          />
          {/* Add more action buttons here as needed */}
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-2">Lembretes</h3>
        <div className="text-xs text-muted-foreground mb-2">
          Processar lembretes para fornecedores com ações pendentes.
        </div>
        <div className="flex flex-wrap gap-2">
          <RunRemindersButton />
          <ProcessRemindersButton />
        </div>
      </div>
    </div>
  );
};

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function AssistenciasDashboard() {
  const [selectedAssistance, setSelectedAssistance] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Use custom hook to fetch and filter data
  const {
    buildings,
    assistances,
    filteredAssistances,
    paginatedAssistances,
    isAssistancesLoading,
    isBuildingsLoading,
    refetchAssistances,
    pagination,
    filters
  } = useAssistanceData(sortOrder);

  // Get assistance groups for tabs
  const pendingAssistances = filteredAssistances?.filter(a => 
    ['Pendente Resposta Inicial', 'Pendente Aceitação', 'Pendente Agendamento'].includes(a.status)
  ) || [];
  
  const scheduledAssistances = filteredAssistances?.filter(a => 
    ['Agendado', 'Em Progresso', 'Pendente Validação'].includes(a.status)
  ) || [];
  
  const lateAssistances = filteredAssistances?.filter(a => {
    // Assistance is considered late if:
    // 1. Status is "Agendado" and scheduled_datetime is in the past (more than 24h)
    // 2. Status is "Pendente Validação" and has been in this state for more than 48h
    if (a.status === 'Agendado' && a.scheduled_datetime) {
      const scheduledDate = new Date(a.scheduled_datetime);
      const now = new Date();
      const hoursDiff = (now.getTime() - scheduledDate.getTime()) / (1000 * 3600);
      return hoursDiff > 24;
    }
    if (a.status === 'Pendente Validação') {
      // Check if updated_at is more than 48h ago
      const updatedAt = new Date(a.updated_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - updatedAt.getTime()) / (1000 * 3600);
      return hoursDiff > 48;
    }
    return false;
  }) || [];
  
  const completedAssistances = filteredAssistances?.filter(a => 
    ['Concluído'].includes(a.status)
  ) || [];

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
      await refetchAssistances();
      
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
      const { error: logError } = await supabase
        .from('activity_log')
        .insert([{
          assistance_id: assistance.id,
          description: `Assistência #${assistance.id} excluída`,
          actor: 'admin'
        }]);
        
      if (logError) {
        console.error('Erro ao registrar atividade:', logError);
      }
      
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
    await handleRefetchAssistances();
  }, [handleRefetchAssistances]);

  // Get the correct list of assistances based on active tab
  const getAssistancesForTab = () => {
    switch(activeTab) {
      case 0: // All assistances
        return paginatedAssistances;
      case 1: // Pending
        return pendingAssistances;
      case 2: // Scheduled
        return scheduledAssistances;
      case 3: // Late
        return lateAssistances;
      case 4: // Completed
        return completedAssistances;
      case 5: // Calendar view
        return scheduledAssistances;
      default:
        return paginatedAssistances;
    }
  };

  const tabs = [
    { name: 'Todas', icon: CalendarDays, count: filteredAssistances?.length || 0 },
    { name: 'Pendentes', icon: Clock, count: pendingAssistances.length },
    { name: 'Agendadas', icon: Calendar, count: scheduledAssistances.length },
    { name: 'Atrasadas', icon: AlertTriangle, count: lateAssistances.length },
    { name: 'Concluídas', icon: CheckCircle, count: completedAssistances.length },
    { name: 'Calendário', icon: Calendar, count: null }
  ];

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
              buildings={buildings}
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
          additionalContent={
            <AssistanceActions 
              assistance={selectedAssistance} 
              onAssistanceUpdate={handleRefetchAssistances} 
            />
          }
        />

        <div className="mb-6">
          <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
            <Tab.List className="flex space-x-2 rounded-xl bg-[#1e293b]/50 p-1 overflow-x-auto">
              {tabs.map((tab, idx) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-lg py-2.5 text-sm font-medium flex items-center justify-center whitespace-nowrap',
                      'focus:outline-none focus:ring-2 ring-white/60 ring-offset-2 ring-offset-blue-400',
                      selected
                        ? 'bg-white/[0.15] shadow text-white'
                        : 'text-white/60 hover:bg-white/[0.12] hover:text-white'
                    )
                  }
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                  {tab.count !== null && (
                    <span className={classNames(
                      'ml-2 px-2 py-0.5 rounded-full text-xs',
                      activeTab === idx ? 'bg-white/20' : 'bg-white/10'
                    )}>
                      {tab.count}
                    </span>
                  )}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels className="mt-4">
              {/* Tabs 0-4: List views */}
              {[0, 1, 2, 3, 4].map((tabIndex) => (
                <Tab.Panel key={tabIndex} className={classNames('rounded-xl')}>
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
                    isLoading={isAssistancesLoading || isDeleting}
                    assistances={tabIndex === 0 ? paginatedAssistances : 
                                tabIndex === 1 ? pendingAssistances : 
                                tabIndex === 2 ? scheduledAssistances :
                                tabIndex === 3 ? lateAssistances :
                                completedAssistances}
                    onSortOrderChange={toggleSortOrder}
                    sortOrder={sortOrder}
                    onViewAssistance={handleViewAssistance}
                    onDeleteAssistance={handleDeleteAssistance}
                    formatDate={formatDate}
                    isLateHighlighted={tabIndex === 3}
                  />
                </Tab.Panel>
              ))}

              {/* Tab 5: Calendar view */}
              <Tab.Panel key={5} className={classNames('rounded-xl')}>
                <AssistanceCalendarView 
                  assistances={scheduledAssistances}
                  onViewAssistance={handleViewAssistance}
                  isLoading={isAssistancesLoading}
                />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </DashboardLayout>
  );
}
