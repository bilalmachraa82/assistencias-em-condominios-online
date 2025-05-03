
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Trash } from 'lucide-react';

interface SupplierActionsProps {
  onAddSupplier: () => void;
  onDeleteAll: () => void;
}

export default function SupplierActions({ onAddSupplier, onDeleteAll }: SupplierActionsProps) {
  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white"
        onClick={onAddSupplier}
      >
        <Plus className="h-4 w-4" />
        Adicionar Fornecedor
      </Button>
      <Button 
        variant="outline" 
        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white"
        onClick={onDeleteAll}
      >
        <Trash className="h-4 w-4" />
        Remover Todos
      </Button>
    </div>
  );
}
