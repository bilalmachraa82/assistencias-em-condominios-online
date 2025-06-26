
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

type Building = {
  id: number;
  name: string;
  address?: string;
  cadastral_code?: string;
  nif?: string;
  admin_notes?: string;
  is_active: boolean;
  created_at?: string;
};

interface BuildingTableProps {
  buildings?: Building[];
  isLoading: boolean;
  onEdit: (building: Building) => void;
  onDelete: (building: { id: number; name: string }) => void;
  onToggleStatus: (building: { id: number; is_active: boolean }) => void;
}

export default function BuildingTable({
  buildings,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
}: BuildingTableProps) {
  console.log('🏗️ BuildingTable - Received buildings:', buildings);
  console.log('⏳ BuildingTable - Is loading:', isLoading);
  console.log('📊 BuildingTable - Buildings count:', buildings?.length || 0);

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Morada</TableHead>
              <TableHead>Código Postal</TableHead>
              <TableHead>NIF</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Notas</TableHead>
              <TableHead className="w-[120px]">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[90px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!buildings || buildings.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Morada</TableHead>
              <TableHead>Código Postal</TableHead>
              <TableHead>NIF</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Notas</TableHead>
              <TableHead className="w-[120px]">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Nenhum edifício cadastrado. Clique em "Novo Edifício" para adicionar o primeiro.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Morada</TableHead>
            <TableHead>Código Postal</TableHead>
            <TableHead>NIF</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Notas</TableHead>
            <TableHead className="w-[120px]">Acções</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {buildings.map((building) => (
            <TableRow key={building.id}>
              <TableCell className="font-medium">{building.name}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {building.address || '-'}
              </TableCell>
              <TableCell>{building.cadastral_code || '-'}</TableCell>
              <TableCell>{building.nif || '-'}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleStatus(building)}
                  className="p-0 h-auto"
                >
                  <Badge variant={building.is_active ? "default" : "secondary"}>
                    {building.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </Button>
              </TableCell>
              <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">
                {building.admin_notes || '-'}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(building)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete({ id: building.id, name: building.name })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
