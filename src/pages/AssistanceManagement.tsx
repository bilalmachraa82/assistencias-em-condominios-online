import React, { useState, useCallback, useMemo } from 'react';
import { format, isAfter, isBefore, addHours } from 'date-fns';
import { 
  Calendar, Clock, AlertTriangle, CheckCircle, 
  Filter, ChevronDown, ChevronUp, Users, Building,
  MessageCircle, Calendar as CalendarIcon, Search,
  X, Eye, Trash
} from 'lucide-react';
import { Tab } from '@headlessui/react';
import { toast } from 'sonner';

// UI Components
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Custom components & hooks
import DashboardLayout from '@/components/layout/DashboardLayout';
import useAssistanceData from '@/components/assistance/useAssistanceData';
import StatusBadge from '@/components/assistance/badges/StatusBadge';
import { formatDate } from '@/utils/DateTimeUtils';
import { supabase } from '@/integrations/supabase/client';
import { getUserFriendlyError, logError } from '@/utils/ErrorUtils';
import { getNextPossibleStatuses } from '@/utils/StatusUtils';
import { AssistanceCalendarView } from '@/components/assistance/AssistanceCalendarView';
import { DeleteAssistanceResult, validateDeleteAssistanceResult } from '@/types/assistance';

// Export the comprehensive management dashboard
export default function AssistanceManagement() {
  // State for the UI
  const [selectedAssistance, setSelectedAssistance] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Use custom hook to fetch data
  const {
    buildings,
    assistances,
    filteredAssistances,
    isAssistancesLoading,
    isBuildingsLoading,
    refetchAssistances,
    filters
  } = useAssistanceData(sortOrder);

  // Prepare data for different tabs/views
  const pendingAssistances = useMemo(() => filteredAssistances?.filter(a => 
    ['Pendente Resposta Inicial', 'Pendente Aceitação', 'Pendente Agendamento'].includes(a.status)
  ) || [], [filteredAssistances]);
  
  const scheduledAssistances = useMemo(() => filteredAssistances?.filter(a => 
    ['Agendado', 'Em Progresso', 'Pendente Validação'].includes(a.status)
  ) || [], [filteredAssistances]);
  
  const lateAssistances = useMemo(() => filteredAssistances?.filter(a => {
    // Assistance is considered late if:
    // 1. Status is "Agendado" and scheduled_datetime is in the past (more than 24h)
    // 2. Status is "Pendente Validação" and has been in this state for more than 48h
    if (a.status === 'Agendado' && a.scheduled_datetime) {
      const scheduledDate = new Date(a.scheduled_datetime);
      const now = new Date();
      return isAfter(now, addHours(scheduledDate, 24));
    }
    if (a.status === 'Pendente Validação') {
      const updatedAt = new Date(a.updated_at);
      const now = new Date();
      return isAfter(now, addHours(updatedAt, 48));
    }
    return false;
  }) || [], [filteredAssistances]);
  
  const completedAssistances = useMemo(() => filteredAssistances?.filter(a => 
    ['Concluído'].includes(a.status)
  ) || [], [filteredAssistances]);

  const cancelledAssistances = useMemo(() => filteredAssistances?.filter(a => 
    ['Cancelado', 'Recusada Fornecedor'].includes(a.status)
  ) || [], [filteredAssistances]);

  // Determine which list to show based on active tab
  const getAssistancesForTab = () => {
    switch(activeTab) {
      case 0: return filteredAssistances;
      case 1: return pendingAssistances;
      case 2: return scheduledAssistances;
      case 3: return lateAssistances;
      case 4: return completedAssistances;
      case 5: return cancelledAssistances;
      default: return filteredAssistances;
    }
  };

  // Tab configuration
  const tabs = [
    { name: 'Todas', icon: Calendar, count: filteredAssistances?.length || 0 },
    { name: 'Pendentes', icon: Clock, count: pendingAssistances.length },
    { name: 'Agendadas', icon: CalendarIcon, count: scheduledAssistances.length },
    { name: 'Atrasadas', icon: AlertTriangle, count: lateAssistances.length },
    { name: 'Concluídas', icon: CheckCircle, count: completedAssistances.length },
    { name: 'Canceladas', icon: AlertTriangle, count: cancelledAssistances.length }
  ];

  // Handle opening assistance details
  const handleViewAssistance = async (assistance: any) => {
    setIsLoading(true);
    try {
      console.log(`Getting fresh data for assistance #${assistance.id}`);
      const { data: freshAssistance, error } = await supabase
        .from('assistances')
        .select(`
          *,
          buildings(name),
          suppliers(name),
          intervention_types(name)
        `)
        .eq('id', assistance.id)
        .single();
        
      if (error) {
        console.error('Error fetching assistance data:', error);
        toast.error('Erro ao buscar dados atualizados');
        setSelectedAssistance(assistance); // Fallback to the provided data
      } else {
        setSelectedAssistance(freshAssistance);
        setNewStatus(freshAssistance.status);
        setAdminNote(freshAssistance.admin_notes || '');
      }
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('View assistance error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle closing assistance details modal
  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedAssistance(null);
    setIsEditingStatus(false);
    setNewStatus(null);
    setAdminNote('');
  };

  // Toggle sort order functionality
  const handleSortChange = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Handle saving status changes
  const handleSaveStatusChange = async () => {
    if (!selectedAssistance || !newStatus) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('assistances')
        .update({ 
          status: newStatus,
          admin_notes: adminNote,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedAssistance.id);

      if (error) {
        toast.error(`Erro ao atualizar: ${error.message}`);
        return;
      }

      // Log the activity
      await supabase.from('activity_log').insert([{
        assistance_id: selectedAssistance.id,
        description: `Status atualizado para ${newStatus}`,
        actor: 'admin'
      }]);

      toast.success('Assistência atualizada com sucesso');
      setIsEditingStatus(false);
      await refetchAssistances();
      
      // Refresh the selected assistance data
      const { data: refreshed } = await supabase
        .from('assistances')
        .select(`*, buildings(name), suppliers(name), intervention_types(name)`)
        .eq('id', selectedAssistance.id)
        .single();
        
      if (refreshed) {
        setSelectedAssistance(refreshed);
        setNewStatus(refreshed.status);
        setAdminNote(refreshed.admin_notes || '');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending email to supplier
  const handleSendEmail = async (assistanceId: number) => {
    // Implementation for sending emails to suppliers
    toast.info('Funcionalidade de envio de email será implementada em breve');
  };

  // Handle deleting assistance - UPDATED with robust deletion
  const handleDeleteAssistance = async (assistance: any) => {
    if (!confirm(`Tem certeza que deseja excluir a assistência #${assistance.id}?`)) return;
    
    setIsLoading(true);
    try {
      console.log(`🗑️ Starting robust deletion process for assistance #${assistance.id}`);
      
      // Use the new robust deletion function from Supabase
      const { data: resultRaw, error: deleteError } = await supabase
        .rpc('delete_assistance_safely', { p_assistance_id: assistance.id });

      if (deleteError) {
        console.error('❌ Database RPC delete error:', deleteError);
        toast.error(`Erro ao executar função de eliminação: ${deleteError.message}`);
        return;
      }

      let deleteResult: DeleteAssistanceResult;
      try {
        deleteResult = validateDeleteAssistanceResult(resultRaw);
      } catch (parseErr) {
        toast.error('Erro inesperado ao interpretar resposta de eliminação');
        console.error(parseErr);
        return;
      }

      console.log('📋 Deletion result:', deleteResult);

      if (!deleteResult.success) {
        console.error('❌ Deletion function returned failure:', deleteResult.error);
        toast.error(deleteResult.error || 'Erro desconhecido na eliminação');
        return;
      }

      console.log(`✅ Assistance #${assistance.id} successfully deleted via safe function`);
      
      // Verify the assistance was actually deleted
      const { data: verifyAssistance, error: verifyError } = await supabase
        .from('assistances')
        .select('id')
        .eq('id', assistance.id)
        .maybeSingle();

      if (verifyError) {
        console.warn('⚠️ Could not verify deletion (non-critical):', verifyError);
      } else if (verifyAssistance) {
        console.error('💥 CRITICAL: Assistance still exists after deletion!');
        toast.error('Erro crítico: assistência ainda existe após eliminação');
        return;
      } else {
        console.log('✅ Verified: assistance no longer exists in database');
      }

      toast.success(`Assistência #${assistance.id} eliminada definitivamente!`);
      
      if (isDetailModalOpen && selectedAssistance?.id === assistance.id) {
        handleCloseModal();
      }
      
      await refetchAssistances();
      console.log(`🎉 Complete deletion process finished for assistance #${assistance.id}`);
    } catch (error) {
      console.error('💥 Critical error during robust deletion:', error);
      toast.error('Erro crítico ao excluir assistência');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to generate supplier link
  const getSupplierLink = (assistance: any) => {
    const baseUrl = window.location.origin;
    
    switch(assistance.status) {
      case 'Pendente Aceitação':
        return assistance.acceptance_token ? 
          `${baseUrl}/supplier/accept?token=${assistance.acceptance_token}` : null;
      case 'Pendente Agendamento':
        return assistance.scheduling_token ?
          `${baseUrl}/supplier/schedule?token=${assistance.scheduling_token}` : null;
      case 'Agendado':
        return assistance.validation_token ?
          `${baseUrl}/supplier/complete?token=${assistance.validation_token}` : null;
      default:
        return null;
    }
  };

  // Function to copy supplier link to clipboard
  const copyLinkToClipboard = (assistance: any) => {
    const link = getSupplierLink(assistance);
    if (!link) {
      toast.error('Nenhum link disponível para esta etapa');
      return;
    }
    
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para área de transferência');
  };

  // Function to check if assistance is late
  const isAssistanceLate = (assistance: any): boolean => {
    if (assistance.status === 'Agendado' && assistance.scheduled_datetime) {
      const scheduledDate = new Date(assistance.scheduled_datetime);
      const now = new Date();
      return isAfter(now, addHours(scheduledDate, 24));
    }
    if (assistance.status === 'Pendente Validação') {
      const updatedAt = new Date(assistance.updated_at);
      const now = new Date();
      return isAfter(now, addHours(updatedAt, 48));
    }
    return false;
  };

  // Handle changing the tab
  const handleTabChange = (index: number) => {
    setActiveTab(index);
  };

  // CSS function for tab styling
  const classNames = (...classes: string[]) => {
    return classes.filter(Boolean).join(' ');
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in-up">
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Gestão de Assistências</h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe e gerencie todas as solicitações de assistência técnica
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="default" 
              onClick={() => refetchAssistances()}
              disabled={isAssistancesLoading}
            >
              {isAssistancesLoading ? 'Atualizando...' : 'Atualizar Dados'}
            </Button>
          </div>
        </div>

        {/* Tabs navigation */}
        <div className="mb-6">
          <Tab.Group selectedIndex={activeTab} onChange={handleTabChange}>
            <Tab.List className="flex space-x-1 rounded-xl bg-[#1e293b]/50 p-1 overflow-x-auto">
              {tabs.map((tab) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-lg py-2.5 text-sm font-medium flex items-center justify-center whitespace-nowrap',
                      'focus:outline-none',
                      selected
                        ? 'bg-white/[0.15] shadow text-white'
                        : 'text-white/60 hover:bg-white/[0.12] hover:text-white'
                    )
                  }
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                  <span className={classNames(
                    'ml-2 px-2 py-0.5 rounded-full text-xs',
                    activeTab === tabs.indexOf(tab) ? 'bg-white/20' : 'bg-white/10'
                  )}>
                    {tab.count}
                  </span>
                </Tab>
              ))}
            </Tab.List>

            {/* Tab panels content */}
            <Tab.Panels className="mt-4">
              {/* Tabs 0-5: List views */}
              {[0, 1, 2, 3, 4, 5].map((tabIndex) => (
                <Tab.Panel key={tabIndex} className="rounded-xl p-2">
                  {/* Filter options */}
                  <div className="mb-4 flex flex-col md:flex-row gap-3">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        placeholder="Buscar por ID, edifício ou fornecedor..."
                        className="w-full px-4 py-2 bg-[#1e293b]/50 border border-white/10 rounded-lg"
                        value={filters.searchQuery}
                        onChange={(e) => filters.setSearchQuery(e.target.value)}
                      />
                      <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          <span>Edifício</span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#1e293b] border-white/10">
                        <DropdownMenuItem 
                          onClick={() => filters.setBuildingFilter(null)}
                          className={!filters.buildingFilter ? "bg-white/10" : ""}
                        >
                          Todos
                        </DropdownMenuItem>
                        {buildings?.map(building => (
                          <DropdownMenuItem
                            key={building.id}
                            onClick={() => filters.setBuildingFilter(String(building.id))}
                            className={filters.buildingFilter === String(building.id) ? "bg-white/10" : ""}
                          >
                            {building.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                
                  {/* Assistance list */}
                  <div className="overflow-x-auto bg-[#1e293b]/30 rounded-lg border border-white/5">
                    {isAssistancesLoading ? (
                      <div className="p-6 space-y-3">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-[200px]" />
                              <Skeleton className="h-4 w-[160px]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : getAssistancesForTab().length === 0 ? (
                      <div className="p-10 text-center">
                        <p className="text-lg text-white/70">Nenhum registro encontrado</p>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-700/30">
                        <thead>
                          <tr className="bg-white/5">
                            <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                              <div className="flex items-center cursor-pointer" onClick={() => handleSortChange('id')}>
                                ID
                                {sortField === 'id' && (
                                  sortOrder === 'desc' ? <ChevronDown className="ml-1 h-4 w-4" /> : <ChevronUp className="ml-1 h-4 w-4" />
                                )}
                              </div>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                              Edifício
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider hidden md:table-cell">
                              Fornecedor
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider hidden md:table-cell">
                              <div className="flex items-center cursor-pointer" onClick={() => handleSortChange('created_at')}>
                                Data
                                {sortField === 'created_at' && (
                                  sortOrder === 'desc' ? <ChevronDown className="ml-1 h-4 w-4" /> : <ChevronUp className="ml-1 h-4 w-4" />
                                )}
                              </div>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider hidden lg:table-cell">
                              Agendamento
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/30">
                          {getAssistancesForTab().map((assistance: any) => {
                            const isLate = isAssistanceLate(assistance);
                            
                            return (
                              <tr 
                                key={assistance.id} 
                                className={`${
                                  isLate ? 'bg-red-900/10 hover:bg-red-900/20' : 'hover:bg-white/5'
                                } cursor-pointer transition-colors`}
                                onClick={() => handleViewAssistance(assistance)}
                              >
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  #{assistance.id}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  {assistance.buildings?.name || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm hidden md:table-cell">
                                  {assistance.suppliers?.name || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <StatusBadge status={assistance.status} />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm hidden md:table-cell">
                                  {formatDate(assistance.created_at)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm hidden lg:table-cell">
                                  {assistance.scheduled_datetime ? 
                                    format(new Date(assistance.scheduled_datetime), 'dd/MM/yyyy HH:mm') : 
                                    '-'
                                  }
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-blue-400 hover:text-blue-300"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewAssistance(assistance);
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="text-red-400 hover:text-red-300"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteAssistance(assistance);
                                      }}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                                {isLate && (
                                  <td className="px-2">
                                    <AlertTriangle className="h-4 w-4 text-red-400" />
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>
        
        {/* Detail Modal */}
        {isDetailModalOpen && selectedAssistance && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-[#1e293b] max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Assistência #{selectedAssistance.id}</h2>
                <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Basic info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-white/70 mb-1">Edifício</h3>
                    <p className="text-base">{selectedAssistance.buildings?.name || '-'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white/70 mb-1">Fornecedor</h3>
                    <p className="text-base">{selectedAssistance.suppliers?.name || '-'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white/70 mb-1">Tipo de Intervenção</h3>
                    <p className="text-base">{selectedAssistance.intervention_types?.name || '-'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white/70 mb-1">Criado em</h3>
                    <p className="text-base">{formatDate(selectedAssistance.created_at)}</p>
                  </div>
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-white/70 mb-1">Descrição</h3>
                    <p className="text-base">{selectedAssistance.description || '-'}</p>
                  </div>
                </div>
                
                {/* Status management */}
                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Status da Assistência</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditingStatus(!isEditingStatus)}
                      className="text-sm"
                    >
                      {isEditingStatus ? 'Cancelar' : 'Alterar Status'}
                    </Button>
                  </div>
                  
                  {isEditingStatus ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {getNextPossibleStatuses(selectedAssistance.status).map(status => (
                          <Button
                            key={status}
                            variant={newStatus === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => setNewStatus(status)}
                          >
                            {status}
                          </Button>
                        ))}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Notas do Administrador
                        </label>
                        <textarea
                          rows={4}
                          className="w-full px-3 py-2 bg-[#0f172a] border border-white/10 rounded-md"
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Adicione notas sobre esta assistência..."
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditingStatus(false);
                            setNewStatus(selectedAssistance.status);
                            setAdminNote(selectedAssistance.admin_notes || '');
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="default"
                          onClick={handleSaveStatusChange}
                          disabled={isLoading || newStatus === selectedAssistance.status}
                        >
                          {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <StatusBadge status={selectedAssistance.status} />
                      <div className="ml-4">
                        <p className="text-sm text-white/70">
                          Última atualização: {formatDate(selectedAssistance.updated_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Supplier communication */}
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-lg font-medium mb-4">Comunicação com Fornecedor</h3>
                  
                  <div className="space-y-3">
                    {/* Supplier link */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Link para Fornecedor</h4>
                        <p className="text-xs text-white/70">
                          {getSupplierLink(selectedAssistance) 
                            ? 'Link disponível para esta etapa' 
                            : 'Nenhum link disponível para esta etapa'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLinkToClipboard(selectedAssistance)}
                        disabled={!getSupplierLink(selectedAssistance)}
                      >
                        Copiar Link
                      </Button>
                    </div>
                    
                    {/* Email to supplier */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Enviar Email</h4>
                        <p className="text-xs text-white/70">Notificar fornecedor sobre esta assistência</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendEmail(selectedAssistance.id)}
                      >
                        Enviar Email
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Scheduling information if available */}
                {selectedAssistance.scheduled_datetime && (
                  <div className="border-t border-white/10 pt-4">
                    <h3 className="text-lg font-medium mb-2">Agendamento</h3>
                    <div className="bg-white/5 p-3 rounded-md">
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 text-blue-400 mr-2" />
                        <div>
                          <p className="font-medium">
                            {format(new Date(selectedAssistance.scheduled_datetime), 'dd/MM/yyyy')}
                          </p>
                          <p className="text-sm text-white/70">
                            {format(new Date(selectedAssistance.scheduled_datetime), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Admin notes */}
                {selectedAssistance.admin_notes && (
                  <div className="border-t border-white/10 pt-4">
                    <h3 className="text-lg font-medium mb-2">Notas do Administrador</h3>
                    <div className="bg-white/5 p-3 rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{selectedAssistance.admin_notes}</p>
                    </div>
                  </div>
                )}
                
                {/* Actions footer */}
                <div className="border-t border-white/10 pt-4 flex justify-between">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      handleDeleteAssistance(selectedAssistance);
                    }}
                  >
                    Excluir Assistência
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleCloseModal}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
