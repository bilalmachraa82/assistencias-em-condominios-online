
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Building = {
  id: number;
  name: string;
  address?: string;
  cadastral_code?: string;
  admin_notes?: string;
  is_active: boolean;
};

export function useBuildings() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<null | Building>(null);
  const [buildingToDelete, setBuildingToDelete] = useState<null | { id: number; name: string }>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deletingAllError, setDeletingAllError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all buildings
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

  // Create building
  const createBuilding = useMutation({
    mutationFn: async (values: { name: string; address?: string; cadastral_code?: string; admin_notes?: string; is_active?: boolean }) => {
      const { error } = await supabase
        .from('buildings')
        .insert([values]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast({
        title: "Sucesso",
        description: "Edifício adicionado com sucesso",
      });
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao adicionar edifício",
        variant: "destructive",
      });
      console.error('Error creating building:', error);
    },
  });

  // Update building
  const updateBuilding = useMutation({
    mutationFn: async ({ id, ...values }: { id: number; name: string; address?: string; cadastral_code?: string; admin_notes?: string; is_active?: boolean }) => {
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
        description: "Edifício atualizado com sucesso",
      });
      setIsFormOpen(false);
      setSelectedBuilding(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar edifício",
        variant: "destructive",
      });
      console.error('Error updating building:', error);
    },
  });

  // Delete building
  const deleteBuilding = useMutation({
    mutationFn: async (id: number) => {
      try {
        const { error } = await supabase
          .from('buildings')
          .delete()
          .eq('id', id);
        
        if (error) {
          // Check if this is a foreign key constraint error
          if (error.code === '23503') {
            throw new Error("Este edifício não pode ser removido porque está sendo utilizado em registros de assistência.");
          }
          throw error;
        }
      } catch (error) {
        console.error('Error deleting building:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast({
        title: "Sucesso",
        description: "Edifício removido com sucesso",
      });
      setBuildingToDelete(null);
      setDeleteError(null);
    },
    onError: (error: any) => {
      setDeleteError(error.message || "Erro ao remover edifício");
    },
  });

  // Toggle building active status
  const toggleBuildingStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      const { error } = await supabase
        .from('buildings')
        .update({ is_active: !is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast({
        title: "Sucesso",
        description: "Status do edifício atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do edifício",
        variant: "destructive",
      });
      console.error('Error toggling building status:', error);
    },
  });

  // Delete all buildings
  const deleteAllBuildings = useMutation({
    mutationFn: async () => {
      try {
        // First get all buildings
        const { data: allBuildings, error: getBuildingsError } = await supabase
          .from('buildings')
          .select('id, name');
        
        if (getBuildingsError) throw getBuildingsError;
        
        if (allBuildings.length === 0) {
          // No buildings to delete
          return { deleted: 0, failed: 0, failedNames: [] };
        }
        
        // For each building, attempt to delete
        let deleted = 0;
        let failed = 0;
        const failedNames: string[] = [];
        
        for (const building of allBuildings) {
          const { error: deleteError } = await supabase
            .from('buildings')
            .delete()
            .eq('id', building.id);
          
          if (deleteError) {
            // Log but continue with others
            failed++;
            failedNames.push(building.name);
            console.error(`Failed to delete building ${building.name}:`, deleteError);
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
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      
      if (result.failed > 0) {
        // Some buildings couldn't be deleted
        const failedMessage = result.failedNames.length > 3 
          ? `${result.failedNames.slice(0, 3).join(', ')} e outros` 
          : result.failedNames.join(', ');
          
        toast({
          title: "Atenção",
          description: `${result.deleted} edifícios removidos com sucesso. ${result.failed} edifícios não puderam ser removidos porque estão sendo utilizados em registros de assistência: ${failedMessage}`,
          variant: "default",
        });
      } else {
        // All successfully deleted
        toast({
          title: "Sucesso",
          description: `${result.deleted} edifícios removidos com sucesso`,
        });
      }
      
      setIsDeletingAll(false);
      setDeletingAllError(null);
    },
    onError: (error: any) => {
      setDeletingAllError(error.message || "Erro ao remover edifícios");
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover edifícios",
        variant: "destructive",
      });
    },
  });

  // Form handlers
  const handleSubmit = (values: { name: string; address?: string; cadastral_code?: string; admin_notes?: string; is_active?: boolean }) => {
    if (selectedBuilding) {
      updateBuilding.mutate({ id: selectedBuilding.id, ...values });
    } else {
      createBuilding.mutate({ ...values, is_active: true });
    }
  };

  const handleEdit = (building: Building) => {
    setSelectedBuilding(building);
    setIsFormOpen(true);
  };

  const handleOpenForm = () => {
    setSelectedBuilding(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedBuilding(null);
  };

  const confirmDelete = (building: { id: number; name: string }) => {
    setBuildingToDelete(building);
    setDeleteError(null);
  };

  const confirmDeleteAll = () => {
    setIsDeletingAll(true);
    setDeletingAllError(null);
  };

  const handleToggleStatus = (building: { id: number; is_active: boolean }) => {
    toggleBuildingStatus.mutate({ id: building.id, is_active: building.is_active });
  };

  const handleDeleteConfirm = (id: number) => {
    deleteBuilding.mutate(id);
  };

  const handleDeleteAllConfirm = () => {
    deleteAllBuildings.mutate();
  };

  const closeDeleteDialog = () => {
    setBuildingToDelete(null);
    setDeleteError(null);
  };

  const closeDeleteAllDialog = () => {
    setIsDeletingAll(false);
    setDeletingAllError(null);
  };

  return {
    buildings,
    isLoading,
    isFormOpen,
    selectedBuilding,
    buildingToDelete,
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
