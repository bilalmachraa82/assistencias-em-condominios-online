
import React from 'react';
import { Button } from "@/components/ui/button";
import { FileText, Eye, SortAsc, SortDesc, Trash, Copy, X } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import StatusBadge from './badges/StatusBadge';

interface AssistanceListProps {
  isLoading: boolean;
  assistances: any[] | undefined;
  onSortOrderChange: () => void;
  sortOrder: 'desc' | 'asc';
  onViewAssistance: (assistance: any) => void;
  onDeleteAssistance?: (assistance: any) => void;
  formatDate: (dateString: string) => string;
}

export default function AssistanceList({
  isLoading,
  assistances,
  onSortOrderChange,
  sortOrder,
  onViewAssistance,
  onDeleteAssistance,
  formatDate
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
  const copyLinkToClipboard = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência');
  };

  // State for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [assistanceToDelete, setAssistanceToDelete] = React.useState<any>(null);

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (assistanceToDelete && onDeleteAssistance) {
      onDeleteAssistance(assistanceToDelete);
      setDeleteDialogOpen(false);
      setAssistanceToDelete(null);
    }
  };

  // Open delete dialog
  const openDeleteDialog = (assistance: any) => {
    setAssistanceToDelete(assistance);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="bg-white/5 rounded-3xl p-4 md:p-6 backdrop-blur-lg shadow-xl mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
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
          {sortOrder === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">Edifício</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Fornecedor</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Urgência</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Data</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Link</th>
                <th className="px-4 py-3 text-left font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-3 text-[#cbd5e1]" colSpan={8}>
                    <div className="flex justify-center items-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : assistances?.length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-[#cbd5e1]" colSpan={8}>
                    <div className="text-center py-6">
                      Nenhuma assistência encontrada com os filtros atuais.
                    </div>
                  </td>
                </tr>
              ) : (
                assistances?.map((assistance) => {
                  const supplierLink = getSupplierLink(assistance);
                  
                  return (
                    <tr key={assistance.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-[#cbd5e1]">{assistance.id}</td>
                      <td className="px-4 py-3 text-[#cbd5e1]">
                        {assistance.buildings?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-[#cbd5e1] hidden md:table-cell">
                        {assistance.suppliers?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={assistance.status} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          assistance.type === 'Normal' ? 'bg-green-500/20 text-green-300' :
                          assistance.type === 'Urgente' ? 'bg-orange-500/20 text-orange-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {assistance.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-[#8E9196] hidden sm:table-cell">
                        {formatDate(assistance.created_at)}
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        {supplierLink ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8"
                                  onClick={() => copyLinkToClipboard(supplierLink)}
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
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onViewAssistance(assistance)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {onDeleteAssistance && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openDeleteDialog(assistance)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              title="Excluir assistência"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white text-black">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a assistência #{assistanceToDelete?.id}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
