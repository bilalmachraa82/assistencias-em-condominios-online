
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

interface EmailSenderProps {
  assistanceId: number;
  assistanceStatus: string;
  disabled?: boolean;
}

export default function EmailSender({ assistanceId, assistanceStatus, disabled = false }: EmailSenderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [emailType, setEmailType] = useState<'acceptance' | 'scheduling' | 'validation'>('acceptance');
  const [isLoading, setIsLoading] = useState(false);

  const getAvailableEmailTypes = () => {
    // Determine which email types are available based on the current status
    switch(assistanceStatus) {
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

  const handleSendEmail = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/send-supplier-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistanceId,
          emailType
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar email');
      }

      toast.success('Email enviado com sucesso!');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsDialogOpen(true)}
        disabled={disabled || isLoading}
        className="flex items-center gap-2"
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
