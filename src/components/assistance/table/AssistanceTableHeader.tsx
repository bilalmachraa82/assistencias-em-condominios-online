
import React from 'react';
import { Button } from "@/components/ui/button";
import { SortAsc, SortDesc } from 'lucide-react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AssistanceTableHeaderProps {
  sortOrder: 'desc' | 'asc';
  onSortOrderChange: () => void;
}

export default function AssistanceTableHeader({ sortOrder, onSortOrderChange }: AssistanceTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="text-left font-medium">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSortOrderChange}
            className="flex items-center gap-2"
          >
            ID
            {sortOrder === 'desc' ? (
              <SortDesc className="h-4 w-4" />
            ) : (
              <SortAsc className="h-4 w-4" />
            )}
          </Button>
        </TableHead>
        <TableHead className="text-left font-medium">Edifício</TableHead>
        <TableHead className="text-left font-medium hidden md:table-cell">Fornecedor</TableHead>
        <TableHead className="text-left font-medium">Status</TableHead>
        <TableHead className="text-left font-medium hidden md:table-cell">Urgência</TableHead>
        <TableHead className="text-left font-medium hidden sm:table-cell">Data</TableHead>
        <TableHead className="text-left font-medium hidden lg:table-cell">Link</TableHead>
        <TableHead className="text-left font-medium">Ações</TableHead>
      </TableRow>
    </TableHeader>
  );
}
