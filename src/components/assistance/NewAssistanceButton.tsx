
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Building, Plus } from 'lucide-react';
import BuildingSelectorDialog from './BuildingSelectorDialog';
import AssistanceFormDialog from './AssistanceFormDialog';
import useCreateAssistance from '@/hooks/useCreateAssistance';
import { toast } from 'sonner';

interface NewAssistanceButtonProps {
  buildings: any[] | undefined;
  isBuildingsLoading: boolean;
  onAssistanceCreated: () => Promise<void>;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  className?: string;
}

export default function NewAssistanceButton({
  buildings,
  isBuildingsLoading,
  onAssistanceCreated,
  variant = "default",
  className = ""
}: NewAssistanceButtonProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<null | { id: number; name: string }>(null);
  const [isNewAssistanceDialogOpen, setIsNewAssistanceDialogOpen] = useState(false);
  const [isAssistanceFormOpen, setIsAssistanceFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBuildingSelect = (building: any) => {
    if (!building) {
      toast.error('Por favor, selecione um edifício.');
      return;
    }
    
    setSelectedBuilding(building);
    setIsNewAssistanceDialogOpen(false);
    setIsAssistanceFormOpen(true);
  };

  return (
    <>
      <Button 
        onClick={() => setIsNewAssistanceDialogOpen(true)}
        className={`flex items-center gap-2 ${className}`}
        variant={variant}
      >
        <Plus className="h-4 w-4" />
        Nova Assistência
      </Button>

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
            await onAssistanceCreated();
            
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
    </>
  );
}
