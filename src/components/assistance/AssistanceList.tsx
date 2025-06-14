
import React from 'react';
import { Table, TableBody } from "@/components/ui/table";
import AssistanceTableHeader from './table/AssistanceTableHeader';
import AssistanceTableRow from './table/AssistanceTableRow';

interface AssistanceListProps {
  assistances: any[];
  isLoading: boolean;
  onViewAssistance: (assistance: any) => void;
  onDeleteAssistance: (assistance: any) => void;
  sortOrder: 'desc' | 'asc';
  onSortOrderChange: () => void;
  formatDate: (date: string) => string;
  isLateHighlighted?: boolean;
}

export default function AssistanceList({
  assistances,
  isLoading,
  onViewAssistance,
  onDeleteAssistance,
  sortOrder,
  onSortOrderChange,
  formatDate,
  isLateHighlighted = false
}: AssistanceListProps) {
  // Debug logging
  React.useEffect(() => {
    console.log('📋 AssistanceList - Received assistances:', assistances?.length || 0);
    console.log('⏳ AssistanceList - Is loading:', isLoading);
    if (assistances?.length > 0) {
      console.log('📊 First assistance sample:', assistances[0]);
    }
  }, [assistances, isLoading]);

  return (
    <div className="mt-6">
      {isLoading ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : assistances.length === 0 ? (
        <div className="text-center py-6">
          Nenhuma assistência encontrada com os filtros atuais.
        </div>
      ) : (
        <div className="bg-[#1e293b]/30 overflow-hidden shadow border border-white/5 sm:rounded-lg">
          <div className="overflow-x-auto">
            <Table className="min-w-full divide-y divide-gray-700/30">
              <AssistanceTableHeader 
                sortOrder={sortOrder}
                onSortOrderChange={onSortOrderChange}
              />
              <TableBody className="divide-y divide-gray-700/30">
                {assistances.map((assistance) => (
                  <AssistanceTableRow
                    key={assistance.id}
                    assistance={assistance}
                    onViewAssistance={onViewAssistance}
                    onDeleteAssistance={onDeleteAssistance}
                    formatDate={formatDate}
                    isLateHighlighted={isLateHighlighted}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
