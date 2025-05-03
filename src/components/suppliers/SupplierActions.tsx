
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Trash, Database } from 'lucide-react';

interface SupplierActionsProps {
  onAddSupplier: () => void;
  onDeleteAll: () => void;
  onImportPredefined: () => void;
}

export default function SupplierActions({ onAddSupplier, onDeleteAll, onImportPredefined }: SupplierActionsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
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
        className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white"
        onClick={onImportPredefined}
      >
        <Database className="h-4 w-4" />
        Importar Lista
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
