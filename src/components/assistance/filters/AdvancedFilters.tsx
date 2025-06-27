
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Users, Calendar, Filter, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdvancedFiltersProps {
  buildings: { id: number; name: string }[];
  suppliers: { id: number; name: string }[];
  selectedBuilding: string | null;
  selectedSupplier: string | null;
  selectedStatus: string | null;
  dateRange: { from: Date | null; to: Date | null };
  onBuildingChange: (buildingId: string | null) => void;
  onSupplierChange: (supplierId: string | null) => void;
  onStatusChange: (status: string | null) => void;
  onDateRangeChange: (range: { from: Date | null; to: Date | null }) => void;
  onClearAll: () => void;
}

export default function AdvancedFilters({
  buildings,
  suppliers,
  selectedBuilding,
  selectedSupplier,
  selectedStatus,
  dateRange,
  onBuildingChange,
  onSupplierChange,
  onStatusChange,
  onDateRangeChange,
  onClearAll
}: AdvancedFiltersProps) {
  const statuses = [
    "Pendente Resposta Inicial",
    "Agendado",
    "Em Progresso",
    "Concluído",
    "Cancelado",
  ];

  const hasActiveFilters = selectedBuilding || selectedSupplier || selectedStatus || dateRange.from || dateRange.to;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearAll}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar Tudo
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro por Edifício */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Edifício
            </label>
            <Select 
              value={selectedBuilding || "all"} 
              onValueChange={(value) => onBuildingChange(value === "all" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os edifícios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os edifícios</SelectItem>
                {buildings?.map((building) => (
                  <SelectItem key={building.id} value={String(building.id)}>
                    {building.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Fornecedor */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Fornecedor
            </label>
            <Select 
              value={selectedSupplier || "all"} 
              onValueChange={(value) => onSupplierChange(value === "all" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os fornecedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os fornecedores</SelectItem>
                {suppliers?.map((supplier) => (
                  <SelectItem key={supplier.id} value={String(supplier.id)}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select 
              value={selectedStatus || "all"} 
              onValueChange={(value) => onStatusChange(value === "all" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Data */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período
            </label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
                onChange={(e) => onDateRangeChange({
                  from: e.target.value ? new Date(e.target.value) : null,
                  to: dateRange.to
                })}
                className="text-sm"
              />
              <Input
                type="date"
                value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
                onChange={(e) => onDateRangeChange({
                  from: dateRange.from,
                  to: e.target.value ? new Date(e.target.value) : null
                })}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedBuilding && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                {buildings?.find(b => b.id === parseInt(selectedBuilding))?.name}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-4 w-4 p-0"
                  onClick={() => onBuildingChange(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {selectedSupplier && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {suppliers?.find(s => s.id === parseInt(selectedSupplier))?.name}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-4 w-4 p-0"
                  onClick={() => onSupplierChange(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {selectedStatus && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {selectedStatus}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-4 w-4 p-0"
                  onClick={() => onStatusChange(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
