
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Trash, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";

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
  onSearchChange
}: BuildingActionsProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Pesquisar edifícios..."
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
          onClick={onAddBuilding}
        >
          <Plus className="h-4 w-4" />
          Adicionar Edifício
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
