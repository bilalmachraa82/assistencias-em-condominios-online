
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AssistanceForm from '@/components/assistance/AssistanceForm';

interface AssistanceFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBuilding: { id: number; name: string } | null;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function AssistanceFormDialog({
  isOpen,
  onOpenChange,
  selectedBuilding,
  onSubmit,
  onCancel,
  isSubmitting
}: AssistanceFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isSubmitting) {
        onOpenChange(open);
      }
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Assistência</DialogTitle>
          <DialogDescription>
            Preencha os detalhes para criar uma nova solicitação de assistência.
          </DialogDescription>
        </DialogHeader>
        <AssistanceForm
          selectedBuilding={selectedBuilding}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
