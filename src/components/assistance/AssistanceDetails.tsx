
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
import { Pencil, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Import components
import BasicInfoSection from './sections/BasicInfoSection';
import DescriptionSection from './sections/DescriptionSection';
import PhotosSection from './sections/PhotosSection';
import TokensSection from './sections/TokensSection';
import AdminNotesSection from './sections/AdminNotesSection';
import { formatDate, formatDateTime } from '@/utils/DateTimeUtils';

interface AssistanceDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  assistance: any;
  onAssistanceUpdate: () => Promise<void>;
  additionalContent?: React.ReactNode;
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
          <BasicInfoSection 
            assistance={assistance}
            isEditing={isEditing}
            status={status}
            setStatus={setStatus}
            statuses={statuses}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            isSubmitting={isSubmitting}
          />
          
          <DescriptionSection description={assistance.description} />
          
          <PhotosSection 
            photoPath={assistance.photo_path} 
            completionPhotoUrl={assistance.completion_photo_url} 
          />
          
          <TokensSection 
            assistance={assistance} 
            handleResetTokens={handleResetTokens} 
            isSubmitting={isSubmitting} 
          />
          
          <AdminNotesSection 
            isEditing={isEditing} 
            adminNotes={adminNotes} 
            setAdminNotes={setAdminNotes} 
            isSubmitting={isSubmitting} 
          />
          
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
        </div>
        
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
