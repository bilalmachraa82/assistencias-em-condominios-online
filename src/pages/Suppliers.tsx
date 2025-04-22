
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
import { Plus, Edit } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import SupplierForm from '@/components/suppliers/SupplierForm';
import { useToast } from '@/hooks/use-toast';

const SEED_SUPPLIERS = [
  {
    name: "TKE",
    phone: "+351 21 43 08 100",
    email: "info.tkept@tkelevator.com",
    address: "Sintra Business Park, Edifício 4, 2B, Zona Industrial da Abrunheira, 2710-089 Sintra, Portugal",
    nif: "501445226",
    specialization: "Elevadores, manutenção e instalação",
  },
  {
    name: "Clefta",
    phone: "(+351) 217 648 435",
    email: "geral@clefta.pt",
    address: "Rua Mariano Pina, 13, Loja B, 1500-442 Lisboa, Portugal",
    nif: "501324046",
    specialization: "Instalações elétricas, reparações",
  },
  {
    name: "Sr. Obras",
    phone: "+351 212 580 409, +351 224 109 492, +351 239 100 675",
    email: "apoio.cliente@srobras.pt, parceiros@srobras.pt",
    address: "Avenida da República, 6, 7º Esq., 1050-191 Lisboa, Portugal",
    nif: "509541887",
    specialization: "Remodelações, construção, consultoria",
  },
  {
    name: "Mestre das Chaves",
    phone: "+351 219 318 040",
    email: "",
    address: "Rua Augusto Gil, 14-A, 2675-507 Odivelas, Lisboa, Portugal",
    nif: "506684504",
    specialization: "Comércio e representação de fechaduras",
  },
  {
    name: "Desinfest Lar",
    phone: "+351 219 336 788",
    email: "desinfest.lar@oninet.pt",
    address: "Largo da Saudade, Vivenda Rosinha, 2675-260 Odivelas, Portugal",
    nif: "502763760",
    specialization: "Desinfestações e desinfecções",
  },
  {
    name: "Ipest",
    phone: "+351 219 661 404, +351 925 422 204",
    email: "geral@ipest.pt",
    address: "Rua Casal dos Ninhos, Nº 2E, Escritório 8, 2665-536 Venda do Pinheiro, Portugal",
    nif: "",
    specialization: "Controlo de pragas",
  },
];

export default function Suppliers() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<null | { id: number; name: string; email: string; phone?: string; specialization?: string; address?: string; nif?: string }>(null);
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
    mutationFn: async (values: { name: string; email: string; phone?: string; specialization?: string; address?: string; nif?: string }) => {
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
    mutationFn: async ({ id, ...values }: { id: number; name: string; email: string; phone?: string; specialization?: string; address?: string; nif?: string }) => {
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

  // Seed logic: If there are no suppliers, create them
  useEffect(() => {
    if (suppliers && suppliers.length === 0) {
      SEED_SUPPLIERS.forEach((supplier) => {
        createSupplier.mutate(supplier);
      });
    }
    // eslint-disable-next-line
  }, [suppliers]);

  const handleSubmit = (values: { name: string; email: string; phone?: string; specialization?: string; address?: string; nif?: string }) => {
    if (selectedSupplier) {
      updateSupplier.mutate({ id: selectedSupplier.id, ...values });
    } else {
      createSupplier.mutate(values);
    }
  };

  const handleEdit = (supplier: { id: number; name: string; email: string; phone?: string; specialization?: string; address?: string; nif?: string }) => {
    setSelectedSupplier(supplier);
    setIsFormOpen(true);
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
                <TableHead className="w-[100px]">Ações</TableHead>
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
                    <TableCell>{supplier.email}</TableCell>
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
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(supplier)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
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
    </DashboardLayout>
  );
}

