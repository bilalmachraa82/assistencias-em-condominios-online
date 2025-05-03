
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useSuppliers } from '@/hooks/useSuppliers';
import SupplierTable from '@/components/suppliers/SupplierTable';
import SupplierActions from '@/components/suppliers/SupplierActions';
import SupplierForm from '@/components/suppliers/SupplierForm';
import DeleteSupplierDialog from '@/components/suppliers/DeleteSupplierDialog';
import DeleteAllSuppliersDialog from '@/components/suppliers/DeleteAllSuppliersDialog';

export default function Suppliers() {
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
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
          />
        </div>

        <SupplierTable
          suppliers={suppliers}
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
