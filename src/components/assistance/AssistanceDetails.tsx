
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
import { ValidStatus } from "@/types/assistance";

import BasicInfoSection from "./sections/BasicInfoSection";
import DescriptionSection from "./sections/DescriptionSection";
import PhotosSection from "./sections/PhotosSection";
import TokensSection from "./sections/TokensSection";
import AdminNotesSection from "./sections/AdminNotesSection";
import { formatDate, formatDateTime } from "@/utils/DateTimeUtils";

interface AssistanceDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  assistance: any; // mantém any até ter modelo forte
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
  /* ────────────────────────────── guards ───────────────────────────── */
  if (!assistance) return null; // evita crash se modal abrir sem item

  /* ─────────────────────────── estado local ────────────────────────── */
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<string>(assistance.status);
  const [adminNotes, setAdminNotes] = useState(assistance.admin_notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ─────────────────────── estados válidos da BD ───────────────────── */
  const { statuses } = useValidStatuses(); // ValidStatus[]

  /* mapa string -> ValidStatus com tipagem explícita e segura */
  const statusMap = React.useMemo(() => {
    if (!statuses || !Array.isArray(statuses) || statuses.length === 0) {
      return {} as Record<string, ValidStatus>;
    }

    // Create a properly typed map using explicit type assertion
    const map = statuses.reduce((acc, status) => {
      if (status && status.status_value) {
        acc[status.status_value] = status;
      }
      return acc;
    }, {} as Record<string, ValidStatus>);
    
    return map;
  }, [statuses]);

  // Get badge color safely with proper null checking and fallback
  const badgeColor = React.useMemo((): string => {
    // Multiple safety checks to avoid runtime errors
    if (!assistance || !assistance.status) {
      return "#6b7280"; // Default gray fallback
    }
    
    const statusValue = assistance.status;
    
    // Check if statusMap exists and has the requested status
    if (!statusMap || !statusMap[statusValue]) {
      return "#6b7280"; // Default gray fallback
    }
    
    const currentStatus = statusMap[statusValue];
    
    // Check if hex_color exists and is a string
    if (!currentStatus || typeof currentStatus.hex_color !== 'string') {
      return "#6b7280"; // Default gray fallback
    }
    
    // Now TypeScript knows hex_color is definitely a string
    return currentStatus.hex_color as string;
  }, [assistance?.status, statusMap]);

  /* ─────────────────────────── handlers UI ─────────────────────────── */
  useEffect(() => {
    setStatus(assistance.status);
    setAdminNotes(assistance.admin_notes || "");
  }, [assistance]);

  const handleSaveChanges = async () => {
    try {
      setIsSubmitting(true);

      const { error } = await supabase.rpc("update_assistance_status", {
        p_assistance_id: assistance.id,
        p_new_status: status,
        p_scheduled_datetime: null,
      });
      if (error) throw error;

      const { error: notesError } = await supabase
        .from("assistances")
        .update({ admin_notes: adminNotes, updated_at: new Date().toISOString() })
        .eq("id", assistance.id);
      if (notesError) throw notesError;

      toast.success("Assistência atualizada com sucesso!");
      setIsEditing(false);
      await onAssistanceUpdate();
    } catch (err: any) {
      toast.error(`Erro ao atualizar: ${err.message}`);
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
      if (error) throw error;

      toast.success(`Token ${tokenType} atualizado!`);
      await onAssistanceUpdate();
    } catch (err: any) {
      toast.error(`Erro ao atualizar token: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ──────────────────────────── render UI ──────────────────────────── */
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
                    setStatus(assistance.status);
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
            badgeColor={badgeColor}
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
