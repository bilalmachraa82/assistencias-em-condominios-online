
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash, X, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import SupplierForm from '@/components/suppliers/SupplierForm';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Suppliers() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<null | { id: number; name: string; email: string; phone?: string; specialization?: string; address?: string; nif?: string; is_active?: boolean }>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<null | { id: number; name: string }>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    },
    onError: (error: any) => {
      setDeleteError(error.message || "Erro ao remover fornecedor");
    },
  });

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

  const deleteAllSuppliers = useMutation({
    mutationFn: async () => {
      // First check if any suppliers are used in assistances
      const { data: usedSuppliers, error: checkError } = await supabase
        .from('assistances')
        .select('supplier_id')
        .limit(1);
      
      if (checkError) throw checkError;
      
      // If there are assistances using suppliers, we cannot delete them all
      if (usedSuppliers && usedSuppliers.length > 0) {
        throw new Error("Não é possível remover todos os fornecedores porque alguns estão sendo utilizados em registros de assistência.");
      }
      
      // Delete all suppliers
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .neq('id', 0); // This will delete all suppliers
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Sucesso",
        description: "Todos os fornecedores foram removidos com sucesso",
      });
      setIsDeletingAll(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover todos os fornecedores",
        variant: "destructive",
      });
      setIsDeletingAll(false);
      console.error('Error deleting all suppliers:', error);
    },
  });

  const handleSubmit = (values: { name: string; email: string; phone?: string; specialization?: string; address?: string; nif?: string; is_active?: boolean }) => {
    if (selectedSupplier) {
      updateSupplier.mutate({ id: selectedSupplier.id, ...values });
    } else {
      createSupplier.mutate({ ...values, is_active: true });
    }
  };

  const handleEdit = (supplier: { id: number; name: string; email: string; phone?: string; specialization?: string; address?: string; nif?: string; is_active?: boolean }) => {
    setSelectedSupplier(supplier);
    setIsFormOpen(true);
  };

  const confirmDelete = (supplier: { id: number; name: string }) => {
    setSupplierToDelete(supplier);
    setDeleteError(null);
  };

  const confirmDeleteAll = () => {
    setIsDeletingAll(true);
  };

  const handleToggleStatus = (supplier: { id: number; is_active: boolean }) => {
    toggleSupplierStatus.mutate({ id: supplier.id, is_active: supplier.is_active });
  };

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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-cyan-50"
              onClick={() => setIsFormOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Adicionar Fornecedor
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white"
              onClick={confirmDeleteAll}
            >
              <Trash className="h-4 w-4" />
              Remover Todos
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-white hover:bg-white">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Morada</TableHead>
                <TableHead>NIF</TableHead>
                <TableHead>Especialização</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[200px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : suppliers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Nenhum fornecedor cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                suppliers?.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>{supplier.name}</TableCell>
                    <TableCell>{supplier.email || '-'}</TableCell>
                    <TableCell>{supplier.phone || '-'}</TableCell>
                    <TableCell>{supplier.address || '-'}</TableCell>
                    <TableCell>{supplier.nif || '-'}</TableCell>
                    <TableCell>{supplier.specialization || '-'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        supplier.is_active 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {supplier.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleToggleStatus(supplier)}
                          title={supplier.is_active ? "Desativar fornecedor" : "Ativar fornecedor"}
                          className="h-8 w-8 p-0"
                        >
                          {supplier.is_active ? 
                            <X className="h-4 w-4 text-red-500" /> : 
                            <Check className="h-4 w-4 text-green-500" />
                          }
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(supplier)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Editar
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => confirmDelete(supplier)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash className="h-3 w-3" />
                          Remover
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <SupplierForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedSupplier(null);
        }}
        onSubmit={handleSubmit}
        initialData={selectedSupplier || undefined}
      />

      {/* Confirmation Dialog for Deleting Supplier */}
      <AlertDialog open={!!supplierToDelete} onOpenChange={() => !deleteError && setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteError ? "Erro ao Remover Fornecedor" : "Confirmar Remoção"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError ? (
                deleteError
              ) : (
                <>
                  Tem certeza que deseja remover o fornecedor <strong>{supplierToDelete?.name}</strong>?
                  <br />
                  <br />
                  Esta ação não poderá ser desfeita. Se este fornecedor estiver sendo usado em assistências,
                  considere desativá-lo ao invés de removê-lo.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {deleteError ? (
              <AlertDialogAction onClick={() => {
                setDeleteError(null);
                setSupplierToDelete(null);
              }}>
                Entendi
              </AlertDialogAction>
            ) : (
              <>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-red-600 hover:bg-red-700" 
                  onClick={() => supplierToDelete && deleteSupplier.mutate(supplierToDelete.id)}
                >
                  Remover
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for Deleting All Suppliers */}
      <AlertDialog open={isDeletingAll} onOpenChange={() => setIsDeletingAll(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção de Todos os Fornecedores</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover TODOS os fornecedores?
              <br />
              <br />
              Esta ação não poderá ser desfeita. Fornecedores que estão sendo usados em assistências
              não poderão ser removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700" 
              onClick={() => deleteAllSuppliers.mutate()}
            >
              Remover Todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
