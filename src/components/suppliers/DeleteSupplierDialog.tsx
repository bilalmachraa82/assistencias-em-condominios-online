
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

interface DeleteSupplierDialogProps {
  open: boolean;
  supplier: { id: number; name: string } | null;
  error: string | null;
  onClose: () => void;
  onConfirm: (id: number) => void;
}

export default function DeleteSupplierDialog({ 
  open, 
  supplier, 
  error, 
  onClose, 
  onConfirm 
}: DeleteSupplierDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={() => !error && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {error ? "Erro ao Remover Fornecedor" : "Confirmar Remoção"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {error ? (
              error
            ) : (
              <>
                Tem certeza que deseja remover o fornecedor <strong>{supplier?.name}</strong>?
                <br />
                <br />
                Esta ação não poderá ser desfeita. Se este fornecedor estiver sendo usado em assistências,
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
                onClick={() => supplier && onConfirm(supplier.id)}
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
