
import React from 'react';
import AssistanceDetails from './AssistanceDetails';
import { Button } from "@/components/ui/button";
import { Mail } from 'lucide-react';
import EmailSender from './EmailSender';

// This component extends the original AssistanceDetails to add email functionality
interface AssistanceDetailsWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  assistance: any;
  onAssistanceUpdate: () => Promise<void>;
  additionalContent?: React.ReactNode; // Add this prop to support additional content
}

export default function AssistanceDetailsWrapper({
  isOpen,
  onClose,
  assistance,
  onAssistanceUpdate,
  additionalContent
}: AssistanceDetailsWrapperProps) {
  // Add Email button to the inner content of the AssistanceDetails
  const renderEmailButton = () => {
    if (!assistance) return null;
    
    return (
      <div className="mt-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Comunicação com o Fornecedor</h3>
            <p className="text-xs text-muted-foreground">Envie emails com links de ação para o fornecedor</p>
          </div>
          <EmailSender 
            assistanceId={assistance.id} 
            assistanceStatus={assistance.status}
          />
        </div>
      </div>
    );
  };

  return (
    <AssistanceDetails
      isOpen={isOpen}
      onClose={onClose}
      assistance={assistance}
      onAssistanceUpdate={onAssistanceUpdate}
      additionalContent={additionalContent || renderEmailButton()}
    />
  );
}
