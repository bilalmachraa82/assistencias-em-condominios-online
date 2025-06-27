
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Users, Building, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FollowUpActionsProps {
  assistances: any[];
  buildings: { id: number; name: string }[];
  suppliers: { id: number; name: string }[];
  selectedBuilding?: string | null;
  selectedSupplier?: string | null;
  selectedStatus?: string | null;
}

export default function FollowUpActions({
  assistances,
  buildings,
  suppliers,
  selectedBuilding,
  selectedSupplier,
  selectedStatus
}: FollowUpActionsProps) {
  const openAssistances = assistances.filter(a => 
    !['Concluído', 'Cancelado'].includes(a.status)
  );

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = [
      'ID',
      'Tipo',
      'Descrição',
      'Status',
      'Edifício',
      'Fornecedor',
      'Data Criação',
      'Data Agendamento'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(assistance => [
        assistance.id,
        `"${assistance.type}"`,
        `"${assistance.description?.replace(/"/g, '""') || ''}"`,
        `"${assistance.status}"`,
        `"${assistance.buildings?.name || ''}"`,
        `"${assistance.suppliers?.name || ''}"`,
        assistance.created_at ? new Date(assistance.created_at).toLocaleDateString('pt-PT') : '',
        assistance.scheduled_datetime ? new Date(assistance.scheduled_datetime).toLocaleDateString('pt-PT') : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exportado ${data.length} registos para ${filename}.csv`);
  };

  const handleExportAll = () => {
    exportToCSV(assistances, 'assistencias_filtradas');
  };

  const handleExportOpen = () => {
    exportToCSV(openAssistances, 'assistencias_em_aberto');
  };

  const generateFollowUpReport = () => {
    const buildingName = selectedBuilding ? 
      buildings.find(b => b.id.toString() === selectedBuilding)?.name : 'Todos os Edifícios';
    const supplierName = selectedSupplier ? 
      suppliers.find(s => s.id.toString() === selectedSupplier)?.name : 'Todos os Fornecedores';

    const reportData = assistances.map(assistance => ({
      ...assistance,
      follow_up_priority: !['Concluído', 'Cancelado'].includes(assistance.status) ? 'Alta' : 'Baixa',
      days_since_creation: Math.floor((new Date().getTime() - new Date(assistance.created_at).getTime()) / (1000 * 60 * 60 * 24))
    }));

    exportToCSV(reportData, `relatorio_followup_${buildingName.replace(/\s+/g, '_')}_${supplierName.replace(/\s+/g, '_')}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Ações de Follow-up
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Export Filtered Data */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-blue-400" />
              <span className="font-medium">Exportar Filtrados</span>
            </div>
            <div className="space-y-2">
              <Badge variant="outline" className="w-full justify-center">
                {assistances.length} assistências
              </Badge>
              <Button 
                onClick={handleExportAll}
                className="w-full"
                variant="outline"
                disabled={assistances.length === 0}
              >
                Exportar CSV
              </Button>
            </div>
          </div>

          {/* Export Open Assistances */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-400" />
              <span className="font-medium">Apenas Em Aberto</span>
            </div>
            <div className="space-y-2">
              <Badge variant="destructive" className="w-full justify-center">
                {openAssistances.length} em aberto
              </Badge>
              <Button 
                onClick={handleExportOpen}
                className="w-full"
                variant="outline"
                disabled={openAssistances.length === 0}
              >
                Exportar CSV
              </Button>
            </div>
          </div>

          {/* Generate Follow-up Report */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-400" />
              <span className="font-medium">Relatório Follow-up</span>
            </div>
            <div className="space-y-2">
              <Badge variant="secondary" className="w-full justify-center text-xs">
                Com prioridades
              </Badge>
              <Button 
                onClick={generateFollowUpReport}
                className="w-full"
                disabled={assistances.length === 0}
              >
                Gerar Relatório
              </Button>
            </div>
          </div>
        </div>

        {/* Current Filter Summary */}
        <div className="mt-4 p-3 bg-gray-800/30 rounded-lg">
          <h4 className="font-medium mb-2">Filtros Ativos:</h4>
          <div className="space-y-1 text-sm text-gray-300">
            <p>• Edifício: {selectedBuilding ? buildings.find(b => b.id.toString() === selectedBuilding)?.name : 'Todos'}</p>
            <p>• Fornecedor: {selectedSupplier ? suppliers.find(s => s.id.toString() === selectedSupplier)?.name : 'Todos'}</p>
            <p>• Status: {selectedStatus || 'Todos'}</p>
            <p>• Total: {assistances.length} assistências | Em aberto: {openAssistances.length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
