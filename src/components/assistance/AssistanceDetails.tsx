
import React, { useState, useEffect } from 'react';
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
import { VALID_STATUS_VALUES } from '@/utils/StatusUtils';

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
  // Initialize all state hooks first - before any conditional code
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Get all valid statuses from the utility
  const statuses = VALID_STATUS_VALUES;

  // Reset states when assistance changes to prevent stale data
  useEffect(() => {
    if (assistance) {
      console.log('Setting initial status from assistance:', assistance.status);
      setStatus(assistance.status || '');
      setAdminNotes(assistance.admin_notes || '');
      setSaveError(null);
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [assistance]);

  const handleSaveChanges = async () => {
    if (!assistance) {
      toast.error('Não foi possível salvar: dados da assistência não disponíveis');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setSaveError(null);
      
      console.log('Saving changes with status:', status);
      
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
        setSaveError(`Erro ao atualizar assistência: ${error.message}`);
        toast.error(`Erro ao atualizar assistência: ${error.message}`);
        return;
      }
      
      // Log the activity with correct actor value (lowercase)
      const { error: logError } = await supabase
        .from('activity_log')
        .insert([{
          assistance_id: assistance.id,
          description: `Status atualizado para: ${status}`,
          actor: 'admin'
        }]);
        
      if (logError) {
        console.error('Erro ao registrar atividade:', logError);
        // Continue even if logging fails
      }
        
      toast.success('Assistência atualizada com sucesso!');
      setIsEditing(false);
      
      // Make sure to call the update function to refresh the data
      try {
        await onAssistanceUpdate();
      } catch (updateError) {
        console.error('Erro ao atualizar dados após salvar:', updateError);
        // Don't throw here, the save was successful
      }
    } catch (error: any) {
      console.error('Erro ao atualizar assistência:', error);
      setSaveError(`Ocorreu um erro ao atualizar a assistência: ${error.message}`);
      toast.error(`Ocorreu um erro ao atualizar a assistência: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetTokens = async (tokenType: string) => {
    if (!assistance) {
      toast.error('Não foi possível resetar token: dados da assistência não disponíveis');
      return;
    }
    
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
      
      // Make sure to call the update function to refresh the data
      try {
        await onAssistanceUpdate();
      } catch (updateError) {
        console.error(`Erro ao atualizar dados após resetar token ${tokenType}:`, updateError);
        // The token reset was successful, so we don't throw
      }
    } catch (error: any) {
      console.error(`Erro ao atualizar token ${tokenType}:`, error);
      toast.error(`Ocorreu um erro ao atualizar o token ${tokenType}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state when assistance data is not yet available
  if (!isLoaded) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) onClose();
      }}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Carregando detalhes da assistência...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        // When dialog is closed, reset editing state and call onClose
        setIsEditing(false);
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Detalhes da Assistência #{assistance?.id}</span>
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
                    setStatus(assistance?.status || '');
                    setAdminNotes(assistance?.admin_notes || '');
                    setSaveError(null);
                  }}
                  disabled={isSubmitting}
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
                  <Save className="h-4 w-4" /> {isSubmitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            Informações detalhadas da solicitação de assistência.
          </DialogDescription>
        </DialogHeader>
        
        {saveError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
            <p className="text-red-400 text-sm">{saveError}</p>
          </div>
        )}
        
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
          
          <DescriptionSection description={assistance?.description} />
          
          <PhotosSection 
            photoPath={assistance?.photo_path} 
            completionPhotoUrl={assistance?.completion_photo_url} 
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
          
          {assistance?.rejection_reason && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Motivo da Recusa</h3>
              <p className="mt-1 text-sm whitespace-pre-wrap">{assistance.rejection_reason}</p>
            </div>
          )}
          
          {assistance?.reschedule_reason && (
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
            disabled={isSubmitting}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
