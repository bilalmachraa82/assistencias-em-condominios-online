
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import useValidStatuses from "@/hooks/useValidStatuses";
import { AssistanceStatusValue } from "@/types/assistance";

import BasicInfoSection from "./sections/BasicInfoSection";
import DescriptionSection from "./sections/DescriptionSection";
import PhotosSection from "./sections/PhotosSection";
import TokensSection from "./sections/TokensSection";
import AdminNotesSection from "./sections/AdminNotesSection";
import { formatDate, formatDateTime } from "@/utils/DateTimeUtils";

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
  additionalContent,
}: AssistanceDetailsProps) {
  if (!assistance) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<AssistanceStatusValue>(
    (assistance.status as AssistanceStatusValue) ?? "Pendente Resposta Inicial"
  );
  const [adminNotes, setAdminNotes] = useState(assistance.admin_notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { statuses } = useValidStatuses();

  useEffect(() => {
    setStatus((assistance.status as AssistanceStatusValue) ?? "Pendente Resposta Inicial");
    setAdminNotes(assistance.admin_notes || "");
  }, [assistance]);

  const handleSaveChanges = async () => {
    try {
      setIsSubmitting(true);

      // Validate status before sending to database
      if (!status) {
        toast.error("Status é obrigatório");
        return;
      }

      // Now the function exists, no need for explicit typing
      const { error } = await supabase.rpc("update_assistance_status", {
        p_assistance_id: assistance.id,
        p_new_status: status,
        p_scheduled_datetime: null,
      });
      
      if (error) {
        console.error("Error updating assistance status:", error);
        throw error;
      }

      const { error: notesError } = await supabase
        .from("assistances")
        .update({ 
          admin_notes: adminNotes, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", assistance.id);
        
      if (notesError) {
        console.error("Error updating admin notes:", notesError);
        throw notesError;
      }

      toast.success("Assistência atualizada com sucesso!");
      setIsEditing(false);
      await onAssistanceUpdate();
    } catch (err: any) {
      console.error("Error in handleSaveChanges:", err);
      toast.error(`Erro ao atualizar: ${err.message || "Erro desconhecido"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetTokens = async (tokenType: string) => {
    try {
      setIsSubmitting(true);
      const newToken =
        Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

      const { error } = await supabase
        .from("assistances")
        .update({ [tokenType]: newToken })
        .eq("id", assistance.id);
        
      if (error) {
        console.error("Error resetting token:", error);
        throw error;
      }

      toast.success(`Token ${tokenType} atualizado!`);
      await onAssistanceUpdate();
    } catch (err: any) {
      console.error("Error in handleResetTokens:", err);
      toast.error(`Erro ao atualizar token: ${err.message || "Erro desconhecido"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-[#192133] border-[#2A3349] text-white">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Assistência #{assistance.id}</span>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                className="flex gap-1 items-center bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-4 w-4" /> Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex gap-1 items-center text-red-400 bg-red-500/10 border-red-500/20 hover:bg-red-500/20"
                  onClick={() => {
                    setIsEditing(false);
                    setStatus((assistance.status as AssistanceStatusValue) ?? "Pendente Resposta Inicial");
                    setAdminNotes(assistance.admin_notes || "");
                  }}
                >
                  <X className="h-4 w-4" /> Cancelar
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex gap-1 items-center gradient-btn"
                  onClick={handleSaveChanges}
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4" /> Salvar
                </Button>
              </div>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
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
              <h3 className="text-sm font-medium text-gray-300">
                Motivo da Recusa
              </h3>
              <p className="mt-1 text-sm whitespace-pre-wrap">
                {assistance.rejection_reason}
              </p>
            </div>
          )}

          {assistance.reschedule_reason && (
            <div>
              <h3 className="text-sm font-medium text-gray-300">
                Motivo do Reagendamento
              </h3>
              <p className="mt-1 text-sm whitespace-pre-wrap">
                {assistance.reschedule_reason}
              </p>
            </div>
          )}
        </div>

        {additionalContent}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
