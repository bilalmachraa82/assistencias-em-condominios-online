
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Supplier = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  address?: string;
  nif?: string;
  is_active: boolean;
};

export function useSuppliers() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<null | Supplier>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<null | { id: number; name: string }>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deletingAllError, setDeletingAllError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all suppliers
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Create supplier
  const createSupplier = useMutation({
    mutationFn: async (values: { name: string; email: string; phone?: string; specialization?: string; address?: string; nif?: string; is_active?: boolean }) => {
      const { error } = await supabase
        .from('suppliers')
        .insert([values]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Sucesso",
        description: "Fornecedor adicionado com sucesso",
      });
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao adicionar fornecedor",
        variant: "destructive",
      });
      console.error('Error creating supplier:', error);
    },
  });

  // Update supplier
  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...values }: { id: number; name: string; email: string; phone?: string; specialization?: string; address?: string; nif?: string; is_active?: boolean }) => {
      const { error } = await supabase
        .from('suppliers')
        .update(values)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Sucesso",
        description: "Fornecedor atualizado com sucesso",
      });
      setIsFormOpen(false);
      setSelectedSupplier(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar fornecedor",
        variant: "destructive",
      });
      console.error('Error updating supplier:', error);
    },
  });

  // Delete supplier
  const deleteSupplier = useMutation({
    mutationFn: async (id: number) => {
      try {
        const { error } = await supabase
          .from('suppliers')
          .delete()
          .eq('id', id);
        
        if (error) {
          // Check if this is a foreign key constraint error
          if (error.code === '23503') {
            throw new Error("Este fornecedor não pode ser removido porque está sendo utilizado em registros de assistência.");
          }
          throw error;
        }
      } catch (error) {
        console.error('Error deleting supplier:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Sucesso",
        description: "Fornecedor removido com sucesso",
      });
      setSupplierToDelete(null);
      setDeleteError(null);
    },
    onError: (error: any) => {
      setDeleteError(error.message || "Erro ao remover fornecedor");
    },
  });

  // Toggle supplier active status
  const toggleSupplierStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: !is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Sucesso",
        description: "Status do fornecedor atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do fornecedor",
        variant: "destructive",
      });
      console.error('Error toggling supplier status:', error);
    },
  });

  // Delete all suppliers
  const deleteAllSuppliers = useMutation({
    mutationFn: async () => {
      try {
        // First check which suppliers are used in assistances
        const { data: assistancesData, error: assistancesError } = await supabase
          .from('assistances')
          .select('supplier_id')
          .not('supplier_id', 'is', null);
        
        if (assistancesError) throw assistancesError;
        
        // Extract unique supplier IDs that are in use
        const usedSupplierIds = [...new Set(assistancesData.map(item => item.supplier_id))];
        
        if (usedSupplierIds.length > 0) {
          // Don't delete suppliers that are in use
          const { error: deleteError } = await supabase
            .from('suppliers')
            .delete()
            .not('id', 'in', `(${usedSupplierIds.join(',')})`);
          
          if (deleteError) throw deleteError;
          
          // If some suppliers couldn't be deleted, throw a meaningful error
          if (usedSupplierIds.length === 1) {
            throw new Error("1 fornecedor não pôde ser removido porque está sendo utilizado em registros de assistência.");
          } else {
            throw new Error(`${usedSupplierIds.length} fornecedores não puderam ser removidos porque estão sendo utilizados em registros de assistência.`);
          }
        } else {
          // Delete all suppliers if none are in use
          const { error: deleteError } = await supabase
            .from('suppliers')
            .delete()
            .neq('id', 0); // This will delete all suppliers
          
          if (deleteError) throw deleteError;
        }
      } catch (error: any) {
        console.error('Error deleting all suppliers:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Sucesso",
        description: "Fornecedores removidos com sucesso",
      });
      setIsDeletingAll(false);
      setDeletingAllError(null);
    },
    onError: (error: any) => {
      setDeletingAllError(error.message || "Erro ao remover fornecedores");
      toast({
        title: "Atenção",
        description: error.message || "Alguns fornecedores não puderam ser removidos",
        variant: "destructive",
      });
      console.error('Error deleting all suppliers:', error);
    },
  });

  // Form handlers
  const handleSubmit = (values: { name: string; email: string; phone?: string; specialization?: string; address?: string; nif?: string; is_active?: boolean }) => {
    if (selectedSupplier) {
      updateSupplier.mutate({ id: selectedSupplier.id, ...values });
    } else {
      createSupplier.mutate({ ...values, is_active: true });
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleOpenForm = () => {
    setSelectedSupplier(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedSupplier(null);
  };

  const confirmDelete = (supplier: { id: number; name: string }) => {
    setSupplierToDelete(supplier);
    setDeleteError(null);
  };

  const confirmDeleteAll = () => {
    setIsDeletingAll(true);
    setDeletingAllError(null);
  };

  const handleToggleStatus = (supplier: { id: number; is_active: boolean }) => {
    toggleSupplierStatus.mutate({ id: supplier.id, is_active: supplier.is_active });
  };

  const handleDeleteConfirm = (id: number) => {
    deleteSupplier.mutate(id);
  };

  const handleDeleteAllConfirm = () => {
    deleteAllSuppliers.mutate();
  };

  const closeDeleteDialog = () => {
    setSupplierToDelete(null);
    setDeleteError(null);
  };

  const closeDeleteAllDialog = () => {
    setIsDeletingAll(false);
    setDeletingAllError(null);
  };

  return {
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
  };
}
