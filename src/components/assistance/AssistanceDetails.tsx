
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building, Wrench, User, AlertTriangle, Calendar, MessageSquare, Pencil, Save, X, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AssistanceDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  assistance: any;
  onAssistanceUpdate: () => Promise<void>;
  additionalContent?: React.ReactNode; // Add this line to accept additionalContent
}

export default function AssistanceDetails({ 
  isOpen, 
  onClose, 
  assistance, 
  onAssistanceUpdate,
  additionalContent 
}: AssistanceDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(assistance?.status);
  const [adminNotes, setAdminNotes] = useState(assistance?.admin_notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statuses = [
    "Pendente Resposta Inicial",
    "Pendente Aceitação",
    "Recusada Fornecedor",
    "Pendente Agendamento",
    "Agendado",
    "Em Progresso",
    "Pendente Validação",
    "Concluído",
    "Reagendamento Solicitado", 
    "Validação Expirada",
    "Cancelado",
  ];

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Não agendado';
    
    return new Date(dateString).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSaveChanges = async () => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('assistances')
        .update({
          status,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', assistance.id);
        
      if (error) {
        console.error('Erro ao atualizar assistência:', error);
        toast.error('Erro ao atualizar assistência.');
        return;
      }
      
      // Log the activity
      await supabase
        .from('activity_log')
        .insert([{
          assistance_id: assistance.id,
          description: `Status atualizado para: ${status}`,
          actor: 'Admin'
        }]);
        
      toast.success('Assistência atualizada com sucesso!');
      setIsEditing(false);
      onAssistanceUpdate();
    } catch (error) {
      console.error('Erro ao atualizar assistência:', error);
      toast.error('Ocorreu um erro ao atualizar a assistência.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeClass = (statusValue: string) => {
    switch (statusValue) {
      case 'Pendente Resposta Inicial':
      case 'Pendente Aceitação':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'Recusada Fornecedor':
        return 'bg-red-500/20 text-red-300';
      case 'Pendente Agendamento':
      case 'Agendado':
        return 'bg-blue-500/20 text-blue-300';
      case 'Em Progresso':
      case 'Pendente Validação':
        return 'bg-purple-500/20 text-purple-300';
      case 'Concluído':
        return 'bg-green-500/20 text-green-300';
      case 'Reagendamento Solicitado':
        return 'bg-orange-500/20 text-orange-300';
      case 'Validação Expirada':
        return 'bg-gray-500/20 text-gray-300';
      case 'Cancelado':
      case 'Cancelada Admin':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'Normal':
        return 'bg-green-500/20 text-green-300';
      case 'Urgente':
        return 'bg-orange-500/20 text-orange-300';
      case 'Emergência':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const handleResetTokens = async (tokenType: string) => {
    try {
      setIsSubmitting(true);
      
      // Generate a new random token
      const newToken = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
      
      const updateData: Record<string, any> = {};
      updateData[tokenType] = newToken;
      
      const { error } = await supabase
        .from('assistances')
        .update(updateData)
        .eq('id', assistance.id);
        
      if (error) {
        console.error(`Erro ao atualizar token ${tokenType}:`, error);
        toast.error(`Erro ao atualizar token ${tokenType}.`);
        return;
      }
      
      toast.success(`Token ${tokenType} atualizado com sucesso!`);
      onAssistanceUpdate();
    } catch (error) {
      console.error(`Erro ao atualizar token ${tokenType}:`, error);
      toast.error(`Ocorreu um erro ao atualizar o token ${tokenType}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!assistance) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Detalhes da Assistência #{assistance.id}</span>
            {!isEditing ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex gap-1 items-center" 
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-4 w-4" /> Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex gap-1 items-center text-red-500" 
                  onClick={() => {
                    setIsEditing(false);
                    setStatus(assistance.status);
                    setAdminNotes(assistance.admin_notes || '');
                  }}
                >
                  <X className="h-4 w-4" /> Cancelar
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  className="flex gap-1 items-center" 
                  onClick={handleSaveChanges}
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4" /> Salvar
                </Button>
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            Informações detalhadas da solicitação de assistência.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Building className="h-4 w-4" /> Edifício
              </h3>
              <p className="mt-1 text-base">{assistance.buildings?.name}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Wrench className="h-4 w-4" /> Tipo de Intervenção
              </h3>
              <p className="mt-1 text-base">{assistance.intervention_types?.name}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" /> Fornecedor
              </h3>
              <p className="mt-1 text-base">{assistance.suppliers?.name}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-4 w-4" /> Status
              </h3>
              {isEditing ? (
                <Select 
                  value={status} 
                  onValueChange={setStatus}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(assistance.status)}`}>
                    {assistance.status}
                  </span>
                </p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" /> Data Criação
              </h3>
              <p className="mt-1 text-base">{formatDate(assistance.created_at)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" /> Agendamento
              </h3>
              <p className="mt-1 text-base">{formatDateTime(assistance.scheduled_datetime)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-4 w-4" /> Urgência
              </h3>
              <p className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs ${getTypeBadgeClass(assistance.type)}`}>
                  {assistance.type}
                </span>
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="h-4 w-4" /> Descrição
            </h3>
            <p className="mt-1 text-base whitespace-pre-wrap">{assistance.description}</p>
          </div>
          
          {assistance.photo_path && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Foto Inicial</h3>
              <div className="mt-2 max-w-full overflow-hidden rounded-md border">
                <img 
                  src={assistance.photo_path} 
                  alt="Foto da assistência" 
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
          )}
          
          {assistance.completion_photo_url && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Foto de Conclusão</h3>
              <div className="mt-2 max-w-full overflow-hidden rounded-md border">
                <img 
                  src={assistance.completion_photo_url} 
                  alt="Foto de conclusão" 
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
          )}
          
          {/* Tokens Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Tokens de Interação</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Token de Aceitação:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-black/20 p-1 text-xs rounded">
                    {assistance.acceptance_token ? assistance.acceptance_token.substring(0, 10) + '...' : 'Não definido'}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetTokens('acceptance_token')}
                    disabled={isSubmitting}
                  >
                    Gerar Novo
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Token de Agendamento:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-black/20 p-1 text-xs rounded">
                    {assistance.scheduling_token ? assistance.scheduling_token.substring(0, 10) + '...' : 'Não definido'}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetTokens('scheduling_token')}
                    disabled={isSubmitting}
                  >
                    Gerar Novo
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Token de Validação:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-black/20 p-1 text-xs rounded">
                    {assistance.validation_token ? assistance.validation_token.substring(0, 10) + '...' : 'Não definido'}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetTokens('validation_token')}
                    disabled={isSubmitting}
                  >
                    Gerar Novo
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Notas Administrativas</h3>
            {isEditing ? (
              <Textarea
                className="mt-2"
                placeholder="Adicione notas administrativas aqui..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                disabled={isSubmitting}
              />
            ) : (
              <p className="mt-1 text-sm whitespace-pre-wrap">
                {assistance.admin_notes || 'Nenhuma nota administrativa.'}
              </p>
            )}
          </div>
          
          {assistance.rejection_reason && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Motivo da Recusa</h3>
              <p className="mt-1 text-sm whitespace-pre-wrap">{assistance.rejection_reason}</p>
            </div>
          )}
          
          {assistance.reschedule_reason && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Motivo do Reagendamento</h3>
              <p className="mt-1 text-sm whitespace-pre-wrap">{assistance.reschedule_reason}</p>
            </div>
          )}
          
          {/* Validation Reminders Section */}
          {(assistance.status === 'Pendente Validação' || 
            assistance.validation_reminder_count > 0) && (
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" /> Lembretes de Validação
              </h3>
              <p className="mt-1 text-sm">
                Último lembrete: {formatDateTime(assistance.validation_email_sent_at || '')}
              </p>
              <p className="mt-1 text-sm">
                Total de lembretes: {assistance.validation_reminder_count}
              </p>
            </div>
          )}
        </div>
        
        {/* Add the additionalContent here, before the footer */}
        {additionalContent}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
