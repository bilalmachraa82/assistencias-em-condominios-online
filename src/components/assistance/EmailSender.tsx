
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { generateToken } from '@/utils/TokenUtils';
import { sendAssistanceEmail } from '@/utils/EmailUtils';

interface EmailSenderProps {
  assistanceId: number;
  assistanceStatus: string;
  disabled?: boolean;
}

export default function EmailSender({ assistanceId, assistanceStatus, disabled = false }: EmailSenderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [emailType, setEmailType] = useState<'acceptance' | 'scheduling' | 'validation'>('acceptance');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getAvailableEmailTypes = () => {
    // Determine which email types are available based on the current status
    switch(assistanceStatus) {
      case 'Pendente Resposta Inicial':
      case 'Pendente Aceitação':
        return [{ value: 'acceptance', label: 'Email de Aceitação' }];
      case 'Pendente Agendamento':
        return [{ value: 'scheduling', label: 'Email de Agendamento' }];
      case 'Agendado':
        return [{ value: 'validation', label: 'Email de Conclusão' }];
      default:
        // For other statuses, provide all options but let the backend validate
        return [
          { value: 'acceptance', label: 'Email de Aceitação' },
          { value: 'scheduling', label: 'Email de Agendamento' },
          { value: 'validation', label: 'Email de Conclusão' }
        ];
    }
  };

  const availableTypes = getAvailableEmailTypes();

  // Set default email type based on status
  React.useEffect(() => {
    const types = getAvailableEmailTypes();
    if (types.length > 0) {
      setEmailType(types[0].value as 'acceptance' | 'scheduling' | 'validation');
    }
  }, [assistanceStatus]);

  const handleSendEmail = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    console.log(`Attempting to send ${emailType} email for assistance ID: ${assistanceId}`);
    
    const { success, error } = await sendAssistanceEmail(assistanceId, emailType);

    if (success) {
      toast.success('Email enviado com sucesso!');
      setIsDialogOpen(false);
    } else {
      const errorMessage = error || "Ocorreu um erro ao tentar enviar o email.";
      setErrorMessage(errorMessage);
      toast.error(errorMessage);
    }

    setIsLoading(false);
  };
  
  // Function to regenerate token if missing
  const regenerateToken = async (assistanceId: number, tokenField: string): Promise<string | null> => {
    try {
      // Generate a new token using the centralized utility function
      const token = generateToken();
      
      // Update the assistance with the new token
      const { data, error } = await supabase
        .from('assistances')
        .update({ [tokenField]: token })
        .eq('id', assistanceId)
        .select();
      
      if (error) {
        console.error(`Erro ao atualizar ${tokenField}:`, error);
        return null;
      }
      
      return token;
    } catch (err) {
      console.error('Erro ao gerar novo token:', err);
      return null;
    }
  };

  return (
    <>
      <Button 
        variant="outline"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        disabled={disabled || isLoading}
        className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        <Mail className="h-4 w-4" />
        <span>Enviar Email</span>
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Email ao Fornecedor</DialogTitle>
            <DialogDescription>
              Selecione o tipo de email que deseja enviar ao fornecedor.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}
            
            <RadioGroup 
              value={emailType} 
              onValueChange={(value) => setEmailType(value as 'acceptance' | 'scheduling' | 'validation')}
              className="space-y-3"
            >
              {availableTypes.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={type.value} id={type.value} />
                  <Label htmlFor={type.value}>{type.label}</Label>
                </div>
              ))}
            </RadioGroup>
            
            <div className="mt-4 text-sm text-muted-foreground">
              {emailType === 'acceptance' && (
                <p>Envie um email com o link para que o fornecedor possa aceitar ou recusar a solicitação.</p>
              )}
              {emailType === 'scheduling' && (
                <p>Envie um email para que o fornecedor possa agendar a data e hora da assistência.</p>
              )}
              {emailType === 'validation' && (
                <p>Envie um email para que o fornecedor confirme a conclusão da assistência com uma foto.</p>
              )}
            </div>
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Enviar Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
