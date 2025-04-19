
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
import { Plus, Settings, Edit } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import BuildingForm from '@/components/buildings/BuildingForm';
import { useToast } from '@/hooks/use-toast';

export default function Buildings() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<null | { id: number; name: string; address: string }>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: buildings, isLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const createBuilding = useMutation({
    mutationFn: async (values: { name: string; address: string }) => {
      const { error } = await supabase
        .from('buildings')
        .insert([values]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast({
        title: "Sucesso",
        description: "Prédio adicionado com sucesso",
      });
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao adicionar prédio",
        variant: "destructive",
      });
      console.error('Error creating building:', error);
    },
  });

  const updateBuilding = useMutation({
    mutationFn: async ({ id, ...values }: { id: number; name: string; address: string }) => {
      const { error } = await supabase
        .from('buildings')
        .update(values)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast({
        title: "Sucesso",
        description: "Prédio atualizado com sucesso",
      });
      setIsFormOpen(false);
      setSelectedBuilding(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar prédio",
        variant: "destructive",
      });
      console.error('Error updating building:', error);
    },
  });

  const handleSubmit = (values: { name: string; address: string }) => {
    if (selectedBuilding) {
      updateBuilding.mutate({ id: selectedBuilding.id, ...values });
    } else {
      createBuilding.mutate(values);
    }
  };

  const handleEdit = (building: { id: number; name: string; address: string }) => {
    setSelectedBuilding(building);
    setIsFormOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Prédios</h1>
            <p className="text-muted-foreground">
              Gerencie a lista de prédios e suas configurações
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setIsFormOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Adicionar Prédio
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Menu Definição
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Morada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : buildings?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Nenhum prédio cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                buildings?.map((building) => (
                  <TableRow key={building.id}>
                    <TableCell>{building.name}</TableCell>
                    <TableCell>{building.address}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        building.is_active 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {building.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(building)}
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

      <BuildingForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedBuilding(null);
        }}
        onSubmit={handleSubmit}
        initialData={selectedBuilding || undefined}
      />
    </DashboardLayout>
  );
}
