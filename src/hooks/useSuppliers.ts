import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Supplier = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  address?: string;
  nif?: string;
  is_active: boolean;
};

// Predefined suppliers data from the provided list
const predefinedSuppliers = [
  {
    name: "TKE",
    email: "info.tkept@tkelevator.com",
    phone: "+351 21 43 08 100",
    address: "Sintra Business Park, Edifício 4, 2B, Zona Industrial da Abrunheira, 2710‑089 Sintra",
    nif: "501 445 226",
    specialization: "Elevadores",
    is_active: true
  },
  {
    name: "Clefta",
    email: "geral@clefta.pt",
    phone: "(+351) 217 648 435",
    address: "Rua Mariano Pina, 13, Loja B, 1500‑442 Lisboa",
    nif: "501 324 046",
    specialization: "Segurança",
    is_active: true
  },
  {
    name: "Sr. Obras",
    email: "ana.ferreira.santos@srobras.pt",
    phone: "961 777 625 / 966 370 189",
    address: "Avenida da República, 6, 7.º Esq., 1050‑191 Lisboa",
    nif: "509 541 887",
    specialization: "Construção e Reparações",
    is_active: true
  },
  {
    name: "Mestre das Chaves",
    email: "lojamestredaschaves@gmail.com",
    phone: "939 324 688 / 933 427 963",
    address: "Rua Augusto Gil, 14‑A, 2675‑507 Odivelas (Lisboa)",
    nif: "506 684 504",
    specialization: "Serralharia",
    is_active: true
  },
  {
    name: "Desinfest Lar",
    email: "desinfestlar@sapo.pt",
    phone: "+351 219 336 788",
    address: "Largo da Saudade, Vivenda Rosinha, 2675‑260 Odivelas",
    nif: "502 763 760",
    specialization: "Controlo de Pragas",
    is_active: true
  },
  {
    name: "Ascenso Eleva Lda",
    email: "ascensoeleva.lda@sapo.pt",
    phone: "+351 219 166 101",
    address: "Rua de Urano, 10‑A, Serra das Minas, 2635‑580 Rio de Mouro – Sintra",
    nif: "503 077 291",
    specialization: "Elevadores",
    is_active: true
  },
  {
    name: "Ipest",
    email: "geral@ipest.pt",
    phone: "+351 219 661 404 / 925 422 204",
    address: "Rua Casal dos Ninhos, Nº 2E, Escritório 8, 2665‑536 Venda do Pinheiro",
    nif: "",
    specialization: "Controlo de Pragas",
    is_active: true
  }
];

export function useSuppliers() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<null | Supplier>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<null | { id: string; name: string }>(null);
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
    .from('contractors')
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
    .from('contractors')
        .insert([{ ...values, organization_id: '00000000-0000-4000-8000-000000000001' }]);
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
    mutationFn: async ({ id, ...values }: { id: string; name: string; email: string; phone?: string; specialization?: string; address?: string; nif?: string; is_active?: boolean }) => {
      const { error } = await supabase
        .from('contractors')
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
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('contractors')
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
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('contractors')
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

  // Delete all suppliers - Updated to more aggressively delete suppliers even with foreign key references
  const deleteAllSuppliers = useMutation({
    mutationFn: async () => {
      try {
        // First get all suppliers
        const { data: allSuppliers, error: getSuppliersError } = await supabase
          .from('contractors')
          .select('id, name');
        
        if (getSuppliersError) throw getSuppliersError;
        
        if (allSuppliers.length === 0) {
          // No suppliers to delete
          return { deleted: 0, failed: 0, failedNames: [] };
        }
        
        // For each supplier, attempt to delete
        let deleted = 0;
        let failed = 0;
        const failedNames: string[] = [];
        
        for (const supplier of allSuppliers) {
          const { error: deleteError } = await supabase
            .from('contractors')
            .delete()
            .eq('id', supplier.id);
          
          if (deleteError) {
            // Log but continue with others
            failed++;
            failedNames.push(supplier.name);
            console.error(`Failed to delete supplier ${supplier.name}:`, deleteError);
          } else {
            deleted++;
          }
        }
        
        // Return stats so we can inform the user
        return { deleted, failed, failedNames };
      } catch (error) {
        console.error('Error in delete all operation:', error);
        throw error;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      
      if (result.failed > 0) {
        // Some suppliers couldn't be deleted
        const failedMessage = result.failedNames.length > 3 
          ? `${result.failedNames.slice(0, 3).join(', ')} e outros` 
          : result.failedNames.join(', ');
          
        toast({
          title: "Atenção",
          description: `${result.deleted} fornecedores removidos com sucesso. ${result.failed} fornecedores não puderam ser removidos porque estão sendo utilizados em registros de assistência: ${failedMessage}`,
          variant: "default",
        });
      } else {
        // All successfully deleted
        toast({
          title: "Sucesso",
          description: `${result.deleted} fornecedores removidos com sucesso`,
        });
      }
      
      setIsDeletingAll(false);
      setDeletingAllError(null);
    },
    onError: (error: any) => {
      setDeletingAllError(error.message || "Erro ao remover fornecedores");
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover fornecedores",
        variant: "destructive",
      });
    },
  });

  // Import predefined suppliers
  const importPredefinedSuppliers = useMutation({
    mutationFn: async () => {
      // Check which suppliers already exist to avoid duplicates
      const { data: existingSuppliers } = await supabase
        .from('contractors')
        .select('name, email');
      
      const existingNames = new Set(existingSuppliers?.map(s => s.name.toLowerCase()));
      const existingEmails = new Set(existingSuppliers?.map(s => s.email.toLowerCase()));
      
      // Filter out suppliers that already exist (by name or email)
      const suppliersToImport = predefinedSuppliers.filter(
        supplier => !existingNames.has(supplier.name.toLowerCase()) && 
                   !existingEmails.has(supplier.email.toLowerCase())
      );
      
      if (suppliersToImport.length === 0) {
        return { imported: 0, total: predefinedSuppliers.length };
      }
      
      const { error } = await supabase
        .from('contractors')
        .insert(suppliersToImport.map(s => ({ ...s, organization_id: '00000000-0000-4000-8000-000000000001' })));
        
      if (error) throw error;
      
      return { 
        imported: suppliersToImport.length, 
        total: predefinedSuppliers.length 
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      
      if (result.imported === 0) {
        toast({
          title: "Informação",
          description: "Todos os fornecedores da lista já existem no sistema.",
        });
      } else {
        toast({
          title: "Sucesso",
          description: `Importados ${result.imported} de ${result.total} fornecedores. ${result.total - result.imported} já existiam no sistema.`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao importar fornecedores.",
        variant: "destructive",
      });
      console.error('Error importing suppliers:', error);
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

  const confirmDelete = (supplier: { id: string; name: string }) => {
    setSupplierToDelete(supplier);
    setDeleteError(null);
  };

  const confirmDeleteAll = () => {
    setIsDeletingAll(true);
    setDeletingAllError(null);
  };

  const handleToggleStatus = (supplier: { id: string; is_active: boolean }) => {
    toggleSupplierStatus.mutate({ id: supplier.id, is_active: supplier.is_active });
  };

  const handleDeleteConfirm = (id: string) => {
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

  const handleImportPredefined = () => {
    importPredefinedSuppliers.mutate();
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
    handleImportPredefined,
  };
}
