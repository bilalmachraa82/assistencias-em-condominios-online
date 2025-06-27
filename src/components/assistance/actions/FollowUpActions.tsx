
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Mail, FileText, Filter, Users, Building } from 'lucide-react';
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
  const [isExporting, setIsExporting] = useState(false);

  // Generate CSV content
  const generateCSV = (data: any[]) => {
    const headers = [
      'ID',
      'Edifício',
      'Fornecedor',
      'Tipo de Intervenção',
      'Descrição',
      'Status',
      'Urgência',
      'Data Criação',
      'Data Agendamento',
      'Última Atualização'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(assistance => [
        assistance.id,
        `"${assistance.buildings?.name || 'N/A'}"`,
        `"${assistance.suppliers?.name || 'N/A'}"`,
        `"${assistance.intervention_types?.name || 'N/A'}"`,
        `"${assistance.description?.replace(/"/g, '""') || 'N/A'}"`,
        `"${assistance.status}"`,
        `"${assistance.type}"`,
        new Date(assistance.created_at).toLocaleDateString('pt-PT'),
        assistance.scheduled_datetime ? new Date(assistance.scheduled_datetime).toLocaleDateString('pt-PT') : 'N/A',
        new Date(assistance.updated_at).toLocaleDateString('pt-PT')
      ].join(','))
    ].join('\n');

    return csvContent;
  };

  // Export to CSV
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const csvContent = generateCSV(assistances);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        // Generate filename with filters
        let filename = 'assistencias';
        if (selectedBuilding) {
          const building = buildings?.find(b => b.id === parseInt(selectedBuilding));
          filename += `_${building?.name?.replace(/\s+/g, '_')}`;
        }
        if (selectedSupplier) {
          const supplier = suppliers?.find(s => s.id === parseInt(selectedSupplier));
          filename += `_${supplier?.name?.replace(/\s+/g, '_')}`;
        }
        if (selectedStatus) {
          filename += `_${selectedStatus.replace(/\s+/g, '_')}`;
        }
        filename += `_${new Date().toISOString().split('T')[0]}.csv`;
        
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Exportadas ${assistances.length} assistências para CSV`);
      }
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar dados');
    } finally {
      setIsExporting(false);
    }
  };

  // Export only open assistances
  const handleExportOpenOnly = async () => {
    const openAssistances = assistances.filter(a => 
      !['Concluído', 'Cancelado'].includes(a.status)
    );
    
    if (openAssistances.length === 0) {
      toast.info('Não há assistências em aberto para exportar');
      return;
    }

    setIsExporting(true);
    try {
      const csvContent = generateCSV(openAssistances);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `assistencias_em_aberto_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Exportadas ${openAssistances.length} assistências em aberto`);
      }
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar dados');
    } finally {
      setIsExporting(false);
    }
  };

  // Generate follow-up report
  const generateFollowUpReport = () => {
    const openAssistances = assistances.filter(a => 
      !['Concluído', 'Cancelado'].includes(a.status)
    );
    
    const urgentAssistances = openAssistances.filter(a => 
      a.type === 'Urgente' || a.type === 'Emergência'
    );

    const overdueAssistances = openAssistances.filter(a => {
      if (a.scheduled_datetime) {
        return new Date(a.scheduled_datetime) < new Date();
      }
      return false;
    });

    let report = `RELATÓRIO DE FOLLOW-UP - ${new Date().toLocaleDateString('pt-PT')}\n\n`;
    
    if (selectedBuilding) {
      const building = buildings?.find(b => b.id === parseInt(selectedBuilding));
      report += `EDIFÍCIO: ${building?.name}\n\n`;
    }
    
    if (selectedSupplier) {
      const supplier = suppliers?.find(s => s.id === parseInt(selectedSupplier));
      report += `FORNECEDOR: ${supplier?.name}\n\n`;
    }

    report += `RESUMO:\n`;
    report += `- Total de assistências: ${assistances.length}\n`;
    report += `- Assistências em aberto: ${openAssistances.length}\n`;
    report += `- Assistências urgentes: ${urgentAssistances.length}\n`;
    report += `- Assistências em atraso: ${overdueAssistances.length}\n\n`;

    if (urgentAssistances.length > 0) {
      report += `ASSISTÊNCIAS URGENTES:\n`;
      urgentAssistances.forEach(a => {
        report += `- #${a.id}: ${a.buildings?.name} - ${a.status} (${a.type})\n`;
      });
      report += `\n`;
    }

    if (overdueAssistances.length > 0) {
      report += `ASSISTÊNCIAS EM ATRASO:\n`;
      overdueAssistances.forEach(a => {
        report += `- #${a.id}: ${a.buildings?.name} - Agendado para ${new Date(a.scheduled_datetime).toLocaleDateString('pt-PT')}\n`;
      });
    }

    return report;
  };

  const handleGenerateReport = () => {
    const report = generateFollowUpReport();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_followup_${new Date().toISOString().split('T')[0]}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Relatório de follow-up gerado com sucesso');
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Ações de Follow-up
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={handleExportCSV}
            disabled={isExporting || assistances.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar Seleção ({assistances.length})
          </Button>

          <Button 
            onClick={handleExportOpenOnly}
            disabled={isExporting}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Exportar Apenas Em Aberto
          </Button>

          <Button 
            onClick={handleGenerateReport}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Gerar Relatório Follow-up
          </Button>
        </div>

        {/* Current filter summary */}
        <div className="mt-4 p-3 bg-gray-800/30 rounded-lg">
          <p className="text-sm text-gray-400 mb-2">Filtros ativos:</p>
          <div className="flex flex-wrap gap-2">
            {selectedBuilding && (
              <span className="flex items-center gap-1 text-sm bg-blue-600/20 text-blue-300 px-2 py-1 rounded">
                <Building className="h-3 w-3" />
                {buildings?.find(b => b.id === parseInt(selectedBuilding))?.name}
              </span>
            )}
            {selectedSupplier && (
              <span className="flex items-center gap-1 text-sm bg-green-600/20 text-green-300 px-2 py-1 rounded">
                <Users className="h-3 w-3" />
                {suppliers?.find(s => s.id === parseInt(selectedSupplier))?.name}
              </span>
            )}
            {selectedStatus && (
              <span className="text-sm bg-orange-600/20 text-orange-300 px-2 py-1 rounded">
                {selectedStatus}
              </span>
            )}
            {!selectedBuilding && !selectedSupplier && !selectedStatus && (
              <span className="text-sm text-gray-400">Nenhum filtro ativo - exibindo todas as assistências</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
