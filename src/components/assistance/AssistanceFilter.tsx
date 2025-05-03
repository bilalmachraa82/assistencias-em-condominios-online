
import React from 'react';
import { Button } from "@/components/ui/button";
import { Search, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface AssistanceFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  buildingFilter: string | null;
  onBuildingFilterChange: (buildingId: string | null) => void;
  statusFilter: string | null;
  onStatusFilterChange: (status: string | null) => void;
  typeFilter: string | null;
  onTypeFilterChange: (type: string | null) => void;
  buildings: { id: number; name: string }[];
  isBuildingsLoading: boolean;
}

export default function AssistanceFilter({
  searchQuery,
  onSearchChange,
  buildingFilter,
  onBuildingFilterChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  buildings,
  isBuildingsLoading
}: AssistanceFilterProps) {
  const statuses = [
    "Pendente Resposta Inicial",
    "Agendado",
    "Em Progresso",
    "Concluído",
    "Cancelado",
  ];

  const types = [
    "Normal",
    "Urgente",
    "Emergência"
  ];

  const hasActiveFilters = buildingFilter || statusFilter || typeFilter;
  
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Pesquisar assistências..."
            className="pl-9 w-full"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={`flex items-center gap-2 ${hasActiveFilters ? 'bg-blue-600 text-white' : ''}`}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-1 rounded-full bg-white text-blue-600 w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {(buildingFilter ? 1 : 0) + (statusFilter ? 1 : 0) + (typeFilter ? 1 : 0)}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4 p-2">
              <h4 className="font-medium text-sm">Filtrar por</h4>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-500">Edifício</label>
                <Select 
                  value={buildingFilter || ""} 
                  onValueChange={(value) => onBuildingFilterChange(value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os edifícios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os edifícios</SelectItem>
                    {isBuildingsLoading ? (
                      <SelectItem value="" disabled>Carregando...</SelectItem>
                    ) : (
                      buildings?.map((building) => (
                        <SelectItem key={building.id} value={String(building.id)}>
                          {building.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-500">Status</label>
                <Select 
                  value={statusFilter || ""} 
                  onValueChange={(value) => onStatusFilterChange(value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-500">Urgência</label>
                <Select 
                  value={typeFilter || ""} 
                  onValueChange={(value) => onTypeFilterChange(value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as urgências" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as urgências</SelectItem>
                    {types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-between pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onBuildingFilterChange(null);
                    onStatusFilterChange(null);
                    onTypeFilterChange(null);
                  }}
                  disabled={!hasActiveFilters}
                >
                  Limpar filtros
                </Button>
                
                <Button type="submit">Aplicar</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
