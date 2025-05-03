
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

interface DeleteAllSuppliersDialogProps {
  open: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteAllSuppliersDialog({ 
  open, 
  error, 
  onClose, 
  onConfirm 
}: DeleteAllSuppliersDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Remoção de Todos os Fornecedores</AlertDialogTitle>
          <AlertDialogDescription>
            {error ? (
              error
            ) : (
              <>
                Tem certeza que deseja remover TODOS os fornecedores?
                <br />
                <br />
                Esta ação não poderá ser desfeita. Fornecedores que estão sendo usados em assistências
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
