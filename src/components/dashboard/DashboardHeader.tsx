
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import BuildingSelectorDialog from "../assistance/BuildingSelectorDialog";
import AssistanceFormDialog from "../assistance/AssistanceFormDialog";
import useCreateAssistance from "@/hooks/useCreateAssistance";
import { toast } from "sonner";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function DashboardHeader() {
  const [selectedBuilding, setSelectedBuilding] = useState<null | { id: number; name: string }>(null);
  const [isNewAssistanceDialogOpen, setIsNewAssistanceDialogOpen] = useState(false);
  const [isAssistanceFormOpen, setIsAssistanceFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch buildings for the dialog
  const { data: buildings, isLoading: isBuildingsLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('buildings').select('*');
      if (error) throw error;
      return data;
    },
  });

  const handleBuildingSelect = (building: any) => {
    if (!building) {
      toast.error('Por favor, selecione um edifício.');
      return;
    }
    
    setSelectedBuilding(building);
    setIsNewAssistanceDialogOpen(false);
    setIsAssistanceFormOpen(true);
  };

  const handleRefetchAssistances = async (): Promise<void> => {
    // This is a placeholder for the actual refetch function
    toast.success('Assistência criada com sucesso!');
  };

  return (
    <div className="flex justify-between items-center mb-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent">
          Visão Geral do Sistema
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Acompanhe o desempenho e métricas das assistências
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Button 
          onClick={() => setIsNewAssistanceDialogOpen(true)}
          className="apple-button"
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Assistência
        </Button>
      </div>

      <BuildingSelectorDialog 
        isOpen={isNewAssistanceDialogOpen}
        onOpenChange={setIsNewAssistanceDialogOpen}
        buildings={buildings}
        isBuildingsLoading={isBuildingsLoading}
        selectedBuilding={selectedBuilding}
        onBuildingChange={setSelectedBuilding}
        onContinue={() => handleBuildingSelect(selectedBuilding)}
      />

      <AssistanceFormDialog 
        isOpen={isAssistanceFormOpen}
        onOpenChange={setIsAssistanceFormOpen}
        selectedBuilding={selectedBuilding}
        onSubmit={async (formData) => {
          setIsSubmitting(true);
          try {
            const createdAssistance = await useCreateAssistance(formData, selectedBuilding);
            setIsAssistanceFormOpen(false);
            setSelectedBuilding(null);
            await handleRefetchAssistances();
            
            // Show specific message about next steps
            toast.info(
              'Para enviar um email ao fornecedor, abra os detalhes da assistência e clique em "Enviar Email".',
              { duration: 6000 }
            );
          } catch (error) {
            console.error('Error creating assistance:', error);
          } finally {
            setIsSubmitting(false);
          }
        }}
        onCancel={() => setIsAssistanceFormOpen(false)}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
