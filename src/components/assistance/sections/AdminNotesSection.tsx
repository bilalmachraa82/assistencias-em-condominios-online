
import React from 'react';
import { Textarea } from "@/components/ui/textarea";

interface AdminNotesSectionProps {
  isEditing: boolean;
  adminNotes: string;
  setAdminNotes: (value: string) => void;
  isSubmitting: boolean;
}

export default function AdminNotesSection({ 
  isEditing, 
  adminNotes, 
  setAdminNotes, 
  isSubmitting 
}: AdminNotesSectionProps) {
  return (
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
          {adminNotes || 'Nenhuma nota administrativa.'}
        </p>
      )}
    </div>
  );
}
