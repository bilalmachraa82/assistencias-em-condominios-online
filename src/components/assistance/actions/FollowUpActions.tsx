
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  FileText, 
  AlertTriangle, 
  Calendar,
  Building,
  Clock,
  CheckCircle,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isAfter, isBefore, subDays } from 'date-fns';

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
  // Análise dos dados para ações específicas
  const today = new Date();
  const weekAgo = subDays(today, 7);
  const monthAgo = subDays(today, 30);

  const urgentAssistances = assistances.filter(a => 
    ['Pendente Resposta Inicial', 'Aceite'].includes(a.status) &&
    new Date(a.created_at) < weekAgo
  );

  const overdueScheduled = assistances.filter(a => 
    a.status === 'Agendado' && 
    a.scheduled_datetime && 
    isBefore(new Date(a.scheduled_datetime), today)
  );

  const pendingValidation = assistances.filter(a => 
    a.status === 'Concluído' && 
    !a.validation_email_sent_at
  );

  const completedThisMonth = assistances.filter(a => 
    a.status === 'Concluído' &&
    isAfter(new Date(a.updated_at), monthAgo)
  );

  // Função para exportar relatório de assistências urgentes
  const exportUrgentReport = () => {
    if (urgentAssistances.length === 0) {
      toast.error('Não há assistências urgentes para exportar');
      return;
    }

    const headers = [
      'ID',
      'Edifício',
      'Tipo',
      'Status',
      'Fornecedor',
      'Dias Pendentes',
      'Descrição'
    ];

    const csvContent = [
      headers.join(','),
      ...urgentAssistances.map(assistance => {
        const daysPending = Math.floor((today.getTime() - new Date(assistance.created_at).getTime()) / (1000 * 60 * 60 * 24));
        return [
          assistance.id,
          `"${assistance.buildings?.name || ''}"`,
          `"${assistance.type}"`,
          `"${assistance.status}"`,
          `"${assistance.suppliers?.name || ''}"`,
          daysPending,
          `"${assistance.description?.replace(/"/g, '""') || ''}"`
        ].join(',');
      })
    ].join('\n');

    downloadCSV(csvContent, 'assistencias_urgentes');
  };

  // Função para exportar relatório de gestão mensal
  const exportMonthlyManagementReport = () => {
    const headers = [
      'Edifício',
      'Total Assistências',
      'Concluídas',
      'Em Andamento',
      'Pendentes',
      'Taxa Conclusão (%)',
      'Tempo Médio Resolução (dias)'
    ];

    const buildingStats = buildings.map(building => {
      const buildingAssistances = assistances.filter(a => a.building_id === building.id);
      const completed = buildingAssistances.filter(a => a.status === 'Concluído');
      const inProgress = buildingAssistances.filter(a => 
        ['Aceite', 'Agendado', 'Em Progresso'].includes(a.status)
      );
      const pending = buildingAssistances.filter(a => a.status === 'Pendente Resposta Inicial');
      
      const completionRate = buildingAssistances.length > 0 
        ? ((completed.length / buildingAssistances.length) * 100).toFixed(1)
        : '0';

      const avgResolutionTime = completed.length > 0
        ? (completed.reduce((sum, a) => {
            const created = new Date(a.created_at);
            const updated = new Date(a.updated_at);
            return sum + Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          }, 0) / completed.length).toFixed(1)
        : '0';

      return [
        `"${building.name}"`,
        buildingAssistances.length,
        completed.length,
        inProgress.length,
        pending.length,
        completionRate,
        avgResolutionTime
      ].join(',');
    });

    const csvContent = [headers.join(','), ...buildingStats].join('\n');
    downloadCSV(csvContent, 'relatorio_gestao_mensal');
  };

  // Função para exportar agendamentos em atraso
  const exportOverdueSchedules = () => {
    if (overdueScheduled.length === 0) {
      toast.error('Não há agendamentos em atraso');
      return;
    }

    const headers = [
      'ID',
      'Edifício',
      'Fornecedor',
      'Data Agendada',
      'Dias Atraso',
      'Tipo',
      'Contato Fornecedor'
    ];

    const csvContent = [
      headers.join(','),
      ...overdueScheduled.map(assistance => {
        const daysOverdue = Math.floor((today.getTime() - new Date(assistance.scheduled_datetime).getTime()) / (1000 * 60 * 60 * 24));
        return [
          assistance.id,
          `"${assistance.buildings?.name || ''}"`,
          `"${assistance.suppliers?.name || ''}"`,
          format(new Date(assistance.scheduled_datetime), 'dd/MM/yyyy HH:mm'),
          daysOverdue,
          `"${assistance.type}"`,
          `"${assistance.suppliers?.email || assistance.suppliers?.phone || ''}"`
        ].join(',');
      })
    ].join('\n');

    downloadCSV(csvContent, 'agendamentos_em_atraso');
  };

  // Função auxiliar para download de CSV
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${format(today, 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Relatório ${filename} exportado com sucesso`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Ações de Gestão & Follow-up
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Assistências Urgentes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="font-medium text-sm">Urgentes (>7 dias)</span>
            </div>
            <div className="space-y-2">
              <Badge variant="destructive" className="w-full justify-center">
                {urgentAssistances.length} assistências
              </Badge>
              <Button 
                onClick={exportUrgentReport}
                className="w-full text-xs"
                variant="outline"
                size="sm"
                disabled={urgentAssistances.length === 0}
              >
                <Download className="h-3 w-3 mr-1" />
                Exportar Urgentes
              </Button>
            </div>
          </div>

          {/* Agendamentos em Atraso */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-400" />
              <span className="font-medium text-sm">Agendamentos Atrasados</span>
            </div>
            <div className="space-y-2">
              <Badge variant="secondary" className="w-full justify-center">
                {overdueScheduled.length} atrasados
              </Badge>
              <Button 
                onClick={exportOverdueSchedules}
                className="w-full text-xs"
                variant="outline"
                size="sm"
                disabled={overdueScheduled.length === 0}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Exportar Atrasados
              </Button>
            </div>
          </div>

          {/* Relatório de Gestão Mensal */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-sm">Gestão por Edifício</span>
            </div>
            <div className="space-y-2">
              <Badge variant="outline" className="w-full justify-center text-xs">
                {buildings.length} edifícios
              </Badge>
              <Button 
                onClick={exportMonthlyManagementReport}
                className="w-full text-xs"
                size="sm"
                disabled={buildings.length === 0}
              >
                <FileText className="h-3 w-3 mr-1" />
                Relatório Gestão
              </Button>
            </div>
          </div>

          {/* Validações Pendentes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="font-medium text-sm">Aguardam Validação</span>
            </div>
            <div className="space-y-2">
              <Badge variant="secondary" className="w-full justify-center">
                {pendingValidation.length} pendentes
              </Badge>
              <Button 
                onClick={() => {
                  if (pendingValidation.length === 0) {
                    toast.info('Não há validações pendentes');
                    return;
                  }
                  // Aqui poderia implementar envio de emails de validação em lote
                  toast.info('Funcionalidade de envio em lote será implementada');
                }}
                className="w-full text-xs"
                variant="outline"
                size="sm"
              >
                <Mail className="h-3 w-3 mr-1" />
                Enviar Validações
              </Button>
            </div>
          </div>
        </div>

        {/* Resumo dos Filtros Ativos */}
        <div className="mt-6 p-4 bg-gray-800/20 rounded-lg border">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Resumo da Seleção Atual
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Edifício:</span>
              <p className="font-medium">
                {selectedBuilding ? buildings.find(b => b.id.toString() === selectedBuilding)?.name : 'Todos'}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Fornecedor:</span>
              <p className="font-medium">
                {selectedSupplier ? suppliers.find(s => s.id.toString() === selectedSupplier)?.name : 'Todos'}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Status:</span>
              <p className="font-medium">{selectedStatus || 'Todos'}</p>
            </div>
            <div>
              <span className="text-gray-400">Total Filtrado:</span>
              <p className="font-medium text-blue-400">{assistances.length} assistências</p>
            </div>
          </div>

          {/* Estatísticas Rápidas */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="text-center p-2 bg-red-500/10 rounded">
              <p className="font-bold text-red-400">{urgentAssistances.length}</p>
              <p className="text-gray-400">Urgentes</p>
            </div>
            <div className="text-center p-2 bg-orange-500/10 rounded">
              <p className="font-bold text-orange-400">{overdueScheduled.length}</p>
              <p className="text-gray-400">Atrasados</p>
            </div>
            <div className="text-center p-2 bg-green-500/10 rounded">
              <p className="font-bold text-green-400">{completedThisMonth.length}</p>
              <p className="text-gray-400">Concluídos (mês)</p>
            </div>
            <div className="text-center p-2 bg-blue-500/10 rounded">
              <p className="font-bold text-blue-400">{pendingValidation.length}</p>
              <p className="text-gray-400">P/ Validar</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
