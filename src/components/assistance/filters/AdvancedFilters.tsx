
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X, FilterX } from 'lucide-react';
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

interface AdvancedFiltersProps {
  buildings: { id: number; name: string }[];
  suppliers: { id: number; name: string }[];
  selectedBuilding?: string | null;
  selectedSupplier?: string | null;
  selectedStatus?: string | null;
  dateRange: { from: Date | null; to: Date | null };
  onBuildingChange: (buildingId: string | null) => void;
  onSupplierChange: (supplierId: string | null) => void;
  onStatusChange: (status: string | null) => void;
  onDateRangeChange: (range: { from: Date | null; to: Date | null }) => void;
  onClearAll: () => void;
}

const statusOptions = [
  'Pendente Resposta Inicial',
  'Aceite',
  'Agendado',
  'Em Progresso',
  'Concluído',
  'Cancelado',
  'Rejeitado'
];

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
  const hasActiveFilters = selectedBuilding || selectedSupplier || selectedStatus || dateRange.from || dateRange.to;

  const handleDateSelect = (range: DateRange | undefined) => {
    if (range) {
      onDateRangeChange({
        from: range.from || null,
        to: range.to || null
      });
    } else {
      onDateRangeChange({ from: null, to: null });
    }
  };

  // Handler functions to convert between "all" and null values
  const handleBuildingChange = (value: string) => {
    onBuildingChange(value === "all" ? null : value);
  };

  const handleSupplierChange = (value: string) => {
    onSupplierChange(value === "all" ? null : value);
  };

  const handleStatusChange = (value: string) => {
    onStatusChange(value === "all" ? null : value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Filtros Avançados</CardTitle>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={onClearAll}>
              <FilterX className="h-4 w-4 mr-2" />
              Limpar Todos
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Building Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Edifício</label>
            <Select value={selectedBuilding || "all"} onValueChange={handleBuildingChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os edifícios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os edifícios</SelectItem>
                {buildings.map((building) => (
                  <SelectItem key={building.id} value={building.id.toString()}>
                    {building.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Supplier Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Fornecedor</label>
            <Select value={selectedSupplier || "all"} onValueChange={handleSupplierChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os fornecedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os fornecedores</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={selectedStatus || "all"} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Período</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    "Selecionar período"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from || undefined}
                  selected={{
                    from: dateRange.from || undefined,
                    to: dateRange.to || undefined,
                  }}
                  onSelect={handleDateSelect}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {selectedBuilding && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Edifício: {buildings.find(b => b.id.toString() === selectedBuilding)?.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onBuildingChange(null)}
                />
              </Badge>
            )}
            {selectedSupplier && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Fornecedor: {suppliers.find(s => s.id.toString() === selectedSupplier)?.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onSupplierChange(null)}
                />
              </Badge>
            )}
            {selectedStatus && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {selectedStatus}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onStatusChange(null)}
                />
              </Badge>
            )}
            {(dateRange.from || dateRange.to) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Período: {dateRange.from ? format(dateRange.from, "dd/MM/yyyy") : "..."} - {dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : "..."}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onDateRangeChange({ from: null, to: null })}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
