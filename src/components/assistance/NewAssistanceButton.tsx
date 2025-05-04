
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Building } from 'lucide-react';
import BuildingSelectorDialog from './BuildingSelectorDialog';
import AssistanceFormDialog from './AssistanceFormDialog';

interface NewAssistanceButtonProps {
  buildings: any[] | undefined;
  isBuildingsLoading: boolean;
  onAssistanceCreated: () => Promise<void>;
}

export default function NewAssistanceButton({
  buildings,
  isBuildingsLoading,
  onAssistanceCreated
}: NewAssistanceButtonProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<null | { id: number; name: string }>(null);
  const [isNewAssistanceDialogOpen, setIsNewAssistanceDialogOpen] = useState(false);
  const [isAssistanceFormOpen, setIsAssistanceFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBuildingSelect = (building: any) => {
    setSelectedBuilding(building);
    setIsNewAssistanceDialogOpen(false);
    setIsAssistanceFormOpen(true);
  };

  return (
    <>
      <Button 
        onClick={() => setIsNewAssistanceDialogOpen(true)}
        className="flex items-center gap-2"
      >
        <Building className="h-4 w-4" />
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
            await useCreateAssistance(formData, selectedBuilding);
            setIsAssistanceFormOpen(false);
            setSelectedBuilding(null);
            await onAssistanceCreated();
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
