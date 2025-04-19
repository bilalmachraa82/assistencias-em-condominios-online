
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ServiceTypeForm from '@/components/services/ServiceTypeForm';

export default function ConfiguracaoServicos() {
  const [isNewTypeDialogOpen, setIsNewTypeDialogOpen] = React.useState(false);
  const [editingType, setEditingType] = React.useState<any>(null);
  const queryClient = useQueryClient();

  const { data: interventionTypes, isLoading } = useQuery({
    queryKey: ['intervention-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intervention_types')
        .select('*')
        .order('description', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('intervention_types')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intervention-types'] });
      toast.success('Categoria removida com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover categoria:', error);
      toast.error('Erro ao remover categoria. Tente novamente.');
    },
  });

  const handleSubmit = async (formData: any) => {
    try {
      if (editingType) {
        const { error } = await supabase
          .from('intervention_types')
          .update({
            name: formData.name,
            description: formData.description,
            maps_to_urgency: formData.maps_to_urgency,
          })
          .eq('id', editingType.id);

        if (error) throw error;
        toast.success('Categoria atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('intervention_types')
          .insert([{
            name: formData.name,
            description: formData.description,
            maps_to_urgency: formData.maps_to_urgency,
          }]);

        if (error) throw error;
        toast.success('Categoria criada com sucesso!');
      }

      setIsNewTypeDialogOpen(false);
      setEditingType(null);
      queryClient.invalidateQueries({ queryKey: ['intervention-types'] });
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error('Erro ao salvar categoria. Tente novamente.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja remover esta categoria?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuração de Serviços</h1>
            <p className="text-muted-foreground">
              Gerencie as categorias de serviços disponíveis
            </p>
          </div>
          <Button 
            onClick={() => setIsNewTypeDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Categoria
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Nível de Urgência</TableHead>
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
              ) : interventionTypes?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Nenhuma categoria cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                interventionTypes?.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>{type.name}</TableCell>
                    <TableCell>{type.description}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        type.maps_to_urgency === 'Urgente' 
                          ? 'bg-red-50 text-red-700' 
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {type.maps_to_urgency}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingType(type);
                            setIsNewTypeDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(type.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog 
          open={isNewTypeDialogOpen} 
          onOpenChange={(open) => {
            setIsNewTypeDialogOpen(open);
            if (!open) setEditingType(null);
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingType ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
              <DialogDescription>
                {editingType 
                  ? 'Edite os detalhes da categoria de serviço.' 
                  : 'Preencha os detalhes para criar uma nova categoria de serviço.'}
              </DialogDescription>
            </DialogHeader>
            <ServiceTypeForm
              initialData={editingType}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsNewTypeDialogOpen(false);
                setEditingType(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
