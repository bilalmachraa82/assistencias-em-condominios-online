import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Building, Plus } from 'lucide-react';
import BuildingSelectorDialog from './BuildingSelectorDialog';
import AssistanceFormDialog from './AssistanceFormDialog';
import useCreateAssistance from '@/hooks/useCreateAssistance';
import { toast } from 'sonner';
import { sendAssistanceEmail } from '@/utils/EmailUtils';

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
  const [selectedBuilding, setSelectedBuilding] = useState<null | { id: string; name: string }>(null);
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
            
            if (createdAssistance) {
              console.log(`Automatically sending acceptance email for assistance #${createdAssistance.id}`);
              const { success, error } = await sendAssistanceEmail(Number(createdAssistance.id), 'acceptance');

              if (success) {
                toast.success("Email de aceitação enviado automaticamente para o fornecedor.");
              } else {
                toast.warning(`A assistência foi criada, mas falhou o envio do email: ${error}. Pode enviá-lo manualmente nos detalhes.`);
              }
            }

            setIsAssistanceFormOpen(false);
            setSelectedBuilding(null);
            await onAssistanceCreated();
            
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
