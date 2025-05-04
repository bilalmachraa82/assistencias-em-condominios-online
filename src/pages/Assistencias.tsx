
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';

// Custom components
import AssistanceFilter from '@/components/assistance/AssistanceFilter';
import AssistanceDetailsWrapper from '@/components/assistance/AssistanceDetailsWrapper';
import AssistanceList from '@/components/assistance/AssistanceList';
import NewAssistanceButton from '@/components/assistance/NewAssistanceButton';
import useAssistanceData from '@/components/assistance/useAssistanceData';
import { formatDate } from '@/utils/DateTimeUtils';

export default function Assistencias() {
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

  const handleViewAssistance = (assistance: any) => {
    setSelectedAssistance(assistance);
    setIsViewDialogOpen(true);
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
            <NewAssistanceButton 
              buildings={buildings}
              isBuildingsLoading={isBuildingsLoading}
              onAssistanceCreated={handleRefetchAssistances}
            />
          </div>
        </div>

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
