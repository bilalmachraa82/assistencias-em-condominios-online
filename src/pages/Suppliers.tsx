import React, { useState, useEffect } from 'react';
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

// Real suppliers data for initialization
const REAL_SUPPLIERS = [
  {
    name: "TKE",
    phone: "+351 21 43 08 100",
    email: "info.tkept@tkelevator.com",
    address: "Sintra Business Park, Edifício 4, 2B, Zona Industrial da Abrunheira, 2710-089 Sintra, Portugal",
    nif: "501445226",
    specialization: "Elevadores, manutenção e instalação",
    is_active: true
  },
  {
    name: "Clefta",
    phone: "(+351) 217 648 435",
    email: "geral@clefta.pt",
    address: "Rua Mariano Pina, 13, Loja B, 1500-442 Lisboa, Portugal",
    nif: "501324046",
    specialization: "Instalações elétricas, reparações",
    is_active: true
  },
  {
    name: "Sr. Obras",
    phone: "+351 212 580 409, +351 224 109 492, +351 239 100 675",
    email: "apoio.cliente@srobras.pt",
    address: "Avenida da República, 6, 7º Esq., 1050-191 Lisboa, Portugal",
    nif: "509541887",
    specialization: "Remodelações, construção, consultoria",
    is_active: true
  },
  {
    name: "Mestre das Chaves",
    phone: "+351 219 318 040",
    email: "mestre@chaves.pt",
    address: "Rua Augusto Gil, 14-A, 2675-507 Odivelas, Lisboa, Portugal",
    nif: "506684504",
    specialization: "Comércio e representação de fechaduras",
    is_active: true
  },
  {
    name: "Desinfest Lar",
    phone: "+351 219 336 788",
    email: "desinfest.lar@oninet.pt",
    address: "Largo da Saudade, Vivenda Rosinha, 2675-260 Odivelas, Portugal",
    nif: "502763760",
    specialization: "Desinfestações e desinfecções",
    is_active: true
  },
  {
    name: "Ipest",
    phone: "+351 219 661 404, +351 925 422 204",
    email: "geral@ipest.pt",
    address: "Rua Casal dos Ninhos, Nº 2E, Escritório 8, 2665-536 Venda do Pinheiro, Portugal",
    nif: "",
    specialization: "Controlo de pragas",
    is_active: true
  },
];

export default function Suppliers() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<null | { id: number; name: string; email: string; phone?: string; specialization?: string; address?: string; nif?: string; is_active?: boolean }>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<null | { id: number; name: string }>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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

  // Inicialize os fornecedores reais se ainda não existirem
  useEffect(() => {
    const initializeRealData = async () => {
      if (suppliers && suppliers.length > 0) {
        // Verifica quais fornecedores reais ainda não existem no banco
        const existingEmails = suppliers.map(s => s.email);
        
        // Filtra apenas os fornecedores reais que não existem no banco
        const suppliersToAdd = REAL_SUPPLIERS.filter(supplier => 
          !existingEmails.includes(supplier.email)
        );
        
        // Se houver fornecedores para adicionar, adiciona um por um
        if (suppliersToAdd.length > 0) {
          let addedCount = 0;
          for (const supplier of suppliersToAdd) {
            try {
              const { error } = await supabase.from('suppliers').insert([supplier]);
              if (!error) addedCount++;
            } catch (error) {
              console.error('Error adding supplier:', error);
            }
          }
          
          // Atualiza os dados após adicionar os novos fornecedores
          if (addedCount > 0) {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast({
              title: "Fornecedores adicionados",
              description: `${addedCount} fornecedores reais foram adicionados.`,
            });
          }
        }
      }
    };
    
    initializeRealData();
  }, [suppliers, queryClient, toast]);

  // Adicionar função para remover fornecedor existente (ClimaSolutions)
  useEffect(() => {
    const removeClimaSolutions = async () => {
      if (suppliers && suppliers.length > 0) {
        // Procura por ClimaSolutions no banco de dados
        const climaSolutions = suppliers.find(s => 
          s.name.includes("ClimaSolutions") || 
          s.name.includes("Clima Solutions")
        );
        
        // Se encontrar, remove
        if (climaSolutions) {
          try {
            const { error } = await supabase
              .from('suppliers')
              .delete()
              .eq('id', climaSolutions.id);
            
            if (!error) {
              queryClient.invalidateQueries({ queryKey: ['suppliers'] });
              toast({
                title: "Fornecedor removido",
                description: "ClimaSolutions foi removido com sucesso.",
              });
            }
          } catch (error) {
            console.error('Error removing ClimaSolutions:', error);
          }
        }
      }
    };
    
    removeClimaSolutions();
  }, [suppliers, queryClient, toast]);

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
    </DashboardLayout>
  );
}
