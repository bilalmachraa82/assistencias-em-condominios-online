
import React from 'react';
import { Button } from "@/components/ui/button";
import { FileText } from 'lucide-react';

interface AssistanceListProps {
  isLoading: boolean;
  assistances: any[] | undefined;
  onSortOrderChange: () => void;
  sortOrder: 'desc' | 'asc';
  onViewAssistance: (assistance: any) => void;
  formatDate: (dateString: string) => string;
}

export default function AssistanceList({
  isLoading,
  assistances,
  onSortOrderChange,
  sortOrder,
  onViewAssistance,
  formatDate
}: AssistanceListProps) {
  return (
    <div className="bg-white/5 rounded-3xl p-6 backdrop-blur-lg shadow-xl mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Listagem de Assistências
        </h2>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onSortOrderChange}
          className="flex items-center gap-1"
        >
          <span>Data</span>
          {sortOrder === 'desc' ? '↓' : '↑'}
        </Button>
      </div>
      
      <div className="overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left font-medium">ID</th>
              <th className="px-4 py-3 text-left font-medium">Edifício</th>
              <th className="px-4 py-3 text-left font-medium">Tipo</th>
              <th className="px-4 py-3 text-left font-medium">Fornecedor</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Urgência</th>
              <th className="px-4 py-3 text-left font-medium">Data</th>
              <th className="px-4 py-3 text-left font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td className="px-4 py-3 text-[#cbd5e1]" colSpan={8}>
                  Carregando assistências...
                </td>
              </tr>
            ) : assistances?.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-[#cbd5e1]" colSpan={8}>
                  Nenhuma assistência encontrada com os filtros atuais.
                </td>
              </tr>
            ) : (
              assistances?.map((assistance) => (
                <tr key={assistance.id}>
                  <td className="px-4 py-3 text-[#cbd5e1]">{assistance.id}</td>
                  <td className="px-4 py-3 text-[#cbd5e1]">{assistance.buildings?.name}</td>
                  <td className="px-4 py-3 text-[#cbd5e1]">{assistance.intervention_types?.name}</td>
                  <td className="px-4 py-3 text-[#cbd5e1]">{assistance.suppliers?.name}</td>
                  <td className="px-4 py-3 text-[#cbd5e1]">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      assistance.status === 'Pendente Resposta Inicial' ? 'bg-yellow-500/20 text-yellow-300' :
                      assistance.status === 'Agendado' ? 'bg-blue-500/20 text-blue-300' :
                      assistance.status === 'Em Progresso' ? 'bg-purple-500/20 text-purple-300' :
                      assistance.status === 'Concluído' ? 'bg-green-500/20 text-green-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {assistance.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#cbd5e1]">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      assistance.type === 'Normal' ? 'bg-green-500/20 text-green-300' :
                      assistance.type === 'Urgente' ? 'bg-orange-500/20 text-orange-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {assistance.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-[#8E9196]">{formatDate(assistance.created_at)}</td>
                  <td className="px-4 py-3">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onViewAssistance(assistance)}
                    >
                      Ver
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
