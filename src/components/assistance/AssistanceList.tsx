
import React from 'react';
import { Button } from "@/components/ui/button";
import { FileText, Eye, SortAsc, SortDesc, Trash, Copy, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import StatusBadge from './badges/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  // Get appropriate link for current status
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
  
  // Copy link to clipboard
  const copyLinkToClipboard = (link: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência');
  };

  // Handle delete confirmation with enhanced error handling
  const handleDeleteConfirm = async (assistance: any) => {
    try {
      console.log(`🗑️ Attempting to delete assistance #${assistance.id}`);
      await onDeleteAssistance(assistance);
      console.log(`✅ Successfully deleted assistance #${assistance.id}`);
    } catch (error) {
      console.error(`❌ Failed to delete assistance #${assistance.id}:`, error);
      toast.error('Erro ao excluir assistência. Tente novamente.');
    }
  };

  // Handle row click for viewing assistance
  const handleRowClick = (assistance: any) => {
    console.log(`👁️ Viewing assistance #${assistance.id}`);
    onViewAssistance(assistance);
  };

  // Handle view button click - separate from row click
  const handleViewButtonClick = (assistance: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent row click event
    onViewAssistance(assistance);
  };

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
            <table className="min-w-full divide-y divide-gray-700/30">
              <thead>
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
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {assistances.map((assistance) => {
                  const supplierLink = getSupplierLink(assistance);
                  const isLateItem = isLate(assistance);
                  
                  return (
                    <tr 
                      key={assistance.id} 
                      className={`${
                        isLateHighlighted || isLateItem ? 'bg-red-900/10 hover:bg-red-900/20' : 'hover:bg-white/5'
                      } cursor-pointer transition-colors`}
                      onClick={() => handleRowClick(assistance)}
                    >
                      <TableCell className="text-[#cbd5e1] font-medium">#{assistance.id}</TableCell>
                      <TableCell className="text-[#cbd5e1]">
                        {assistance.buildings?.name || '-'}
                      </TableCell>
                      <TableCell className="text-[#cbd5e1] hidden md:table-cell">
                        {assistance.suppliers?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={assistance.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          assistance.type === 'Normal' ? 'bg-green-500/20 text-green-300' :
                          assistance.type === 'Urgente' ? 'bg-orange-500/20 text-orange-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {assistance.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-[#8E9196] hidden sm:table-cell">
                        {formatDate(assistance.created_at)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                        {supplierLink ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8"
                                  onClick={(e) => copyLinkToClipboard(supplierLink, e)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copiar link para fornecedor</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span>-</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => handleViewButtonClick(assistance, e)}
                                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-8 w-8"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ver detalhes</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          {onDeleteAssistance && (
                            <AlertDialog>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Excluir assistência</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <AlertDialogContent className="bg-gray-800 text-white border border-gray-700">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-300">
                                    Tem certeza que deseja excluir a assistência #{assistance.id}?
                                    <br />
                                    <strong>Esta ação não pode ser desfeita.</strong>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteConfirm(assistance)}
                                    className="bg-red-500 hover:bg-red-600 text-white"
                                  >
                                    Excluir Definitivamente
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                      
                      {/* Add visual indicator for late items */}
                      {isLateItem && (
                        <TableCell className="px-3 py-4 whitespace-nowrap text-sm text-red-300">
                          <AlertTriangle className="h-4 w-4" />
                        </AlertCell>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
