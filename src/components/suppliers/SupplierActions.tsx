
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Upload, Search } from 'lucide-react';

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
  onSearchChange,
}: SupplierActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Pesquisar fornecedores..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={onImportPredefined}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Importar Predefinidos
        </Button>
        <Button onClick={onAddSupplier} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Fornecedor
        </Button>
        <Button 
          variant="destructive" 
          onClick={onDeleteAll}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar Todos
        </Button>
      </div>
    </div>
  );
}
