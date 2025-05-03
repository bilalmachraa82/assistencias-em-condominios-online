
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useSuppliers } from '@/hooks/useSuppliers';
import SupplierTable from '@/components/suppliers/SupplierTable';
import SupplierActions from '@/components/suppliers/SupplierActions';
import SupplierForm from '@/components/suppliers/SupplierForm';
import DeleteSupplierDialog from '@/components/suppliers/DeleteSupplierDialog';
import DeleteAllSuppliersDialog from '@/components/suppliers/DeleteAllSuppliersDialog';

export default function Suppliers() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    suppliers,
    isLoading,
    isFormOpen,
    selectedSupplier,
    supplierToDelete,
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
    handleImportPredefined,
  } = useSuppliers();

  // Filter suppliers based on search query
  const filteredSuppliers = suppliers?.filter((supplier) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      supplier.name.toLowerCase().includes(query) ||
      supplier.email.toLowerCase().includes(query) ||
      (supplier.phone && supplier.phone.toLowerCase().includes(query)) ||
      (supplier.specialization && supplier.specialization.toLowerCase().includes(query)) ||
      (supplier.address && supplier.address.toLowerCase().includes(query)) ||
      (supplier.nif && supplier.nif.toLowerCase().includes(query))
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Fornecedores</h1>
            <p className="text-muted-foreground">
              Gerencie a lista de fornecedores e suas configurações
            </p>
          </div>
          <SupplierActions 
            onAddSupplier={handleOpenForm}
            onDeleteAll={confirmDeleteAll}
            onImportPredefined={handleImportPredefined}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        <SupplierTable
          suppliers={filteredSuppliers}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={confirmDelete}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      <SupplierForm
        open={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        initialData={selectedSupplier || undefined}
      />

      <DeleteSupplierDialog
        open={!!supplierToDelete}
        supplier={supplierToDelete}
        error={deleteError}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />

      <DeleteAllSuppliersDialog
        open={isDeletingAll}
        error={deletingAllError}
        onClose={closeDeleteAllDialog}
        onConfirm={handleDeleteAllConfirm}
      />
    </DashboardLayout>
  );
}
