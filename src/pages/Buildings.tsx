
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useBuildings } from '@/hooks/useBuildings';
import BuildingTable from '@/components/buildings/BuildingTable';
import BuildingActions from '@/components/buildings/BuildingActions';
import BuildingForm from '@/components/buildings/BuildingForm';
import DeleteBuildingDialog from '@/components/buildings/DeleteBuildingDialog';
import DeleteAllBuildingsDialog from '@/components/buildings/DeleteAllBuildingsDialog';

export default function Buildings() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    buildings,
    isLoading,
    isFormOpen,
    selectedBuilding,
    buildingToDelete,
    deleteError,
    isDeletingAll,
    deletingAllError,
    handleSubmit,
    handleEdit,
    handleOpenForm,
    handleCloseForm,
    confirmDelete,
    confirmDeleteAll,
    handleToggleStatus,
    handleDeleteConfirm,
    handleDeleteAllConfirm,
    closeDeleteDialog,
    closeDeleteAllDialog,
  } = useBuildings();

  // Filter buildings based on search query
  const filteredBuildings = buildings?.filter((building) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      building.name.toLowerCase().includes(query) ||
      (building.address && building.address.toLowerCase().includes(query)) ||
      (building.cadastral_code && building.cadastral_code.toLowerCase().includes(query)) ||
      (building.admin_notes && building.admin_notes.toLowerCase().includes(query))
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Edifícios</h1>
            <p className="text-muted-foreground">
              Gerencie a lista de edifícios e suas configurações
            </p>
          </div>
          <BuildingActions 
            onAddBuilding={handleOpenForm}
            onDeleteAll={confirmDeleteAll}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        <BuildingTable
          buildings={filteredBuildings}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={confirmDelete}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      <BuildingForm
        open={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        initialData={selectedBuilding || undefined}
      />

      <DeleteBuildingDialog
        open={!!buildingToDelete}
        building={buildingToDelete}
        error={deleteError}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />

      <DeleteAllBuildingsDialog
        open={isDeletingAll}
        error={deletingAllError}
        onClose={closeDeleteAllDialog}
        onConfirm={handleDeleteAllConfirm}
      />
    </DashboardLayout>
  );
}
