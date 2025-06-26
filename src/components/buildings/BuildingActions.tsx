
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Search } from 'lucide-react';

interface BuildingActionsProps {
  onAddBuilding: () => void;
  onDeleteAll: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function BuildingActions({
  onAddBuilding,
  onDeleteAll,
  searchQuery,
  onSearchChange,
}: BuildingActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Pesquisar edifícios..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={onAddBuilding} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Edifício
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
