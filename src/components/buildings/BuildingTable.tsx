
import React from 'react';
import { X, Check, Edit, Trash } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

type Building = {
  id: number;
  name: string;
  address?: string;
  cadastral_code?: string;
  admin_notes?: string;
  is_active: boolean;
};

interface BuildingTableProps {
  buildings: Building[] | null;
  isLoading: boolean;
  onEdit: (building: Building) => void;
  onDelete: (building: {
    id: number;
    name: string;
  }) => void;
  onToggleStatus: (building: {
    id: number;
    is_active: boolean;
  }) => void;
}

export default function BuildingTable({
  buildings,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus
}: BuildingTableProps) {
  return (
    <div className="border rounded-md overflow-hidden">
      <ScrollArea className="w-full">
        <Table>
          <TableHeader className="bg-white hover:bg-white">
            <TableRow>
              <TableHead className="bg-slate-50 whitespace-nowrap">Nome</TableHead>
              <TableHead className="whitespace-nowrap">Morada</TableHead>
              <TableHead className="whitespace-nowrap">Código Cadastral</TableHead>
              <TableHead className="whitespace-nowrap">Notas</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="w-[180px] whitespace-nowrap">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : buildings?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Nenhum edifício cadastrado
                </TableCell>
              </TableRow>
            ) : (
              buildings?.map(building => (
                <TableRow key={building.id}>
                  <TableCell className="max-w-[150px] truncate">{building.name}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{building.address || '-'}</TableCell>
                  <TableCell className="max-w-[100px] truncate">{building.cadastral_code || '-'}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{building.admin_notes || '-'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${building.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {building.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" onClick={() => onToggleStatus(building)} title={building.is_active ? "Desativar edifício" : "Ativar edifício"} className="h-8 w-8 p-0">
                        {building.is_active ? <X className="h-4 w-4 text-red-500" /> : <Check className="h-4 w-4 text-green-500" />}
                      </Button>
                      
                      <Button variant="outline" size="sm" onClick={() => onEdit(building)} className="flex items-center gap-1 text-emerald-700 px-2">
                        <Edit className="h-3 w-3" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      
                      <Button variant="outline" size="sm" onClick={() => onDelete(building)} className="flex items-center gap-1 text-red-600 hover:text-red-800 hover:bg-red-50 px-2">
                        <Trash className="h-3 w-3" />
                        <span className="hidden sm:inline">Remover</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
