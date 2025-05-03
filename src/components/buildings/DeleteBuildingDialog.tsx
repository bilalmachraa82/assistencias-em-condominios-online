
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteBuildingDialogProps {
  open: boolean;
  building: { id: number; name: string } | null;
  error: string | null;
  onClose: () => void;
  onConfirm: (id: number) => void;
}

export default function DeleteBuildingDialog({ 
  open, 
  building, 
  error, 
  onClose, 
  onConfirm 
}: DeleteBuildingDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={() => !error && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {error ? "Erro ao Remover Edifício" : "Confirmar Remoção"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {error ? (
              error
            ) : (
              <>
                Tem certeza que deseja remover o edifício <strong>{building?.name}</strong>?
                <br />
                <br />
                Esta ação não poderá ser desfeita. Se este edifício estiver sendo usado em assistências,
                considere desativá-lo ao invés de removê-lo.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {error ? (
            <AlertDialogAction onClick={() => {
              onClose();
            }}>
              Entendi
            </AlertDialogAction>
          ) : (
            <>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600 hover:bg-red-700" 
                onClick={() => building && onConfirm(building.id)}
              >
                Remover
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
