
import React from 'react';
import { X, Check, Edit, Trash } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Supplier = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  nif?: string;
  specialization?: string;
  is_active: boolean;
};

interface SupplierTableProps {
  suppliers: Supplier[] | null;
  isLoading: boolean;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: { id: number; name: string }) => void;
  onToggleStatus: (supplier: { id: number; is_active: boolean }) => void;
}

export default function SupplierTable({
  suppliers,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus
}: SupplierTableProps) {
  return (
    <div className="border rounded-md overflow-hidden">
      <ScrollArea className="w-full">
        <Table>
          <TableHeader className="bg-white hover:bg-white">
            <TableRow>
              <TableHead className="whitespace-nowrap">Nome</TableHead>
              <TableHead className="whitespace-nowrap">Email</TableHead>
              <TableHead className="whitespace-nowrap">Telefone</TableHead>
              <TableHead className="whitespace-nowrap">Morada</TableHead>
              <TableHead className="whitespace-nowrap">NIF</TableHead>
              <TableHead className="whitespace-nowrap">Especialização</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="w-[180px] whitespace-nowrap">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : suppliers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Nenhum fornecedor cadastrado
                </TableCell>
              </TableRow>
            ) : (
              suppliers?.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="max-w-[120px] truncate">{supplier.name}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{supplier.email || '-'}</TableCell>
                  <TableCell className="max-w-[100px] truncate">{supplier.phone || '-'}</TableCell>
                  <TableCell className="max-w-[120px] truncate">{supplier.address || '-'}</TableCell>
                  <TableCell className="max-w-[80px] truncate">{supplier.nif || '-'}</TableCell>
                  <TableCell className="max-w-[100px] truncate">{supplier.specialization || '-'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      supplier.is_active 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {supplier.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onToggleStatus(supplier)}
                        title={supplier.is_active ? "Desativar fornecedor" : "Ativar fornecedor"}
                        className="h-8 w-8 p-0"
                      >
                        {supplier.is_active ? 
                          <X className="h-4 w-4 text-red-500" /> : 
                          <Check className="h-4 w-4 text-green-500" />
                        }
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEdit(supplier)}
                        className="flex items-center gap-1 px-2"
                      >
                        <Edit className="h-3 w-3" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onDelete(supplier)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-800 hover:bg-red-50 px-2"
                      >
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
