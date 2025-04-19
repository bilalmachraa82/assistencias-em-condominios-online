
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
        // Update existing type
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
        // Create new type
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
      <div className="animate-fade-in-up">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-extrabold leading-tight">Configuração de Serviços</h1>
            <p className="text-[#cbd5e1] mt-2 text-lg">Gerencie as categorias de serviços disponíveis</p>
          </div>
          <Button 
            onClick={() => setIsNewTypeDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Categoria
          </Button>
        </div>

        <div className="bg-white/5 rounded-3xl p-6 backdrop-blur-lg shadow-xl">
          {isLoading ? (
            <div className="text-center py-4">Carregando categorias...</div>
          ) : interventionTypes?.length === 0 ? (
            <div className="text-center py-4">Nenhuma categoria encontrada</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {interventionTypes?.map((type) => (
                <div 
                  key={type.id}
                  className="p-4 rounded-lg border border-white/10 bg-white/5 backdrop-blur-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{type.name}</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingType(type);
                          setIsNewTypeDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(type.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      type.maps_to_urgency === 'Urgente' 
                        ? 'bg-red-500/10 text-red-500' 
                        : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {type.maps_to_urgency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
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
