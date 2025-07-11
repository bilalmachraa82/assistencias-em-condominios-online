
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TableCell, TableRow } from "@/components/ui/table";
import StatusBadge from '../badges/StatusBadge';
import AssistanceSupplierLink from './AssistanceSupplierLink';
import AssistanceTableActions from './AssistanceTableActions';

interface AssistanceTableRowProps {
  assistance: any;
  onViewAssistance: (assistance: any) => void;
  onDeleteAssistance?: (assistance: any) => void;
  formatDate: (date: string) => string;
  isLateHighlighted?: boolean;
}

export default function AssistanceTableRow({
  assistance,
  onViewAssistance,
  onDeleteAssistance,
  formatDate,
  isLateHighlighted = false
}: AssistanceTableRowProps) {
  // Helper function to determine if an assistance is late
  const isLate = (assistance: any): boolean => {
    if (assistance.status === 'Agendado' && assistance.scheduled_datetime) {
      const scheduledDate = new Date(assistance.scheduled_datetime);
      const now = new Date();
      return scheduledDate < now && (now.getTime() - scheduledDate.getTime()) / (1000 * 3600) > 24;
    }
    if (assistance.status === 'Pendente Validação') {
      const updatedAt = new Date(assistance.updated_at);
      const now = new Date();
      return (now.getTime() - updatedAt.getTime()) / (1000 * 3600) > 48;
    }
    return false;
  };

  // Handle row click for viewing assistance
  const handleRowClick = (assistance: any) => {
    console.log(`👁️ Viewing assistance #${assistance.id}`);
    onViewAssistance(assistance);
  };

  const isLateItem = isLate(assistance);

  return (
    <TableRow 
      className={`${
        isLateHighlighted || isLateItem ? 'bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20' : 'hover:bg-muted/50'
      } cursor-pointer transition-colors`}
      onClick={() => handleRowClick(assistance)}
    >
      <TableCell className="text-foreground font-medium">#{assistance.id}</TableCell>
      <TableCell className="text-foreground">
        {assistance.buildings?.name || '-'}
      </TableCell>
      <TableCell className="text-foreground hidden md:table-cell">
        {assistance.suppliers?.name || '-'}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <StatusBadge status={assistance.status} />
          {isLateItem && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Assistência em atraso</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <span className={`px-2 py-1 rounded-full text-xs ${
          assistance.type === 'Normal' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' :
          assistance.type === 'Urgente' ? 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300' :
          'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'
        }`}>
          {assistance.type}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground hidden sm:table-cell">
        {formatDate(assistance.created_at)}
      </TableCell>
      <TableCell className="hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
        <AssistanceSupplierLink assistance={assistance} />
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <AssistanceTableActions 
          assistance={assistance}
          onViewAssistance={onViewAssistance}
          onDeleteAssistance={onDeleteAssistance}
        />
      </TableCell>
    </TableRow>
  );
}
