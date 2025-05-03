
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

interface DeleteAllBuildingsDialogProps {
  open: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteAllBuildingsDialog({ 
  open, 
  error, 
  onClose, 
  onConfirm 
}: DeleteAllBuildingsDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Remoção de Todos os Edifícios</AlertDialogTitle>
          <AlertDialogDescription>
            {error ? (
              error
            ) : (
              <>
                Tem certeza que deseja remover TODOS os edifícios?
                <br />
                <br />
                Esta ação não poderá ser desfeita. Edifícios que estão sendo usados em assistências
                não poderão ser removidos.
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
                onClick={onConfirm}
              >
                Remover Todos
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
