
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Trash, Database, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";

interface SupplierActionsProps {
  onAddSupplier: () => void;
  onDeleteAll: () => void;
  onImportPredefined: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function SupplierActions({ 
  onAddSupplier, 
  onDeleteAll, 
  onImportPredefined, 
  searchQuery,
  onSearchChange
}: SupplierActionsProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Pesquisar fornecedores..."
            className="pl-9 w-full"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
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
    </div>
  );
}
