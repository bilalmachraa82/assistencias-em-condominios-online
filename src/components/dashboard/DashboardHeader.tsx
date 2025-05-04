
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Camera, Sun } from "lucide-react";
import { Link } from "react-router-dom";
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
    <div className="flex justify-between items-center mb-10 animate-fade-in-up">
      <div>
        <h1 className="text-5xl font-extrabold leading-tight">Olá, Andre!</h1>
        <p className="text-[#cbd5e1] mt-2 text-lg">
          Pronto para transformar assistências em soluções?
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="glass px-4 py-2 rounded-full flex items-center gap-2 text-[#f1f5f9]">
          <MapPin className="h-4 w-4" />
          <span>Lisboa</span>
          <Sun className="h-4 w-4 text-[#fb923c]" />
          <span>21°C</span>
        </div>
        <Button 
          onClick={() => setIsNewAssistanceDialogOpen(true)}
          className="bg-gradient-to-r from-[#38bdf8] to-[#6366f1] text-white hover:opacity-90"
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Assistência
        </Button>
        <Button variant="ghost" className="glass">
          <Camera className="mr-2 h-4 w-4" /> Nova Foto
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
