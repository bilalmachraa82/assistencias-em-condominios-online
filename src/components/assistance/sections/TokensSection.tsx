
import React from 'react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { Copy } from 'lucide-react';

interface TokensSectionProps {
  assistance: any;
  handleResetTokens: (tokenType: string) => Promise<void>;
  isSubmitting: boolean;
}

export default function TokensSection({ 
  assistance, 
  handleResetTokens, 
  isSubmitting 
}: TokensSectionProps) {
  const handleCopyToken = (token: string, tokenType: string) => {
    if (!token) {
      toast.error(`Token de ${tokenType} não encontrado`);
      return;
    }
    
    navigator.clipboard.writeText(token)
      .then(() => toast.success(`Token de ${tokenType} copiado para a área de transferência`))
      .catch(() => toast.error('Erro ao copiar token'));
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">Tokens de Interação</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Token de Aceitação:</span>
          <div className="flex items-center gap-2">
            <code className="bg-black/20 p-1 text-xs rounded">
              {assistance?.acceptance_token ? assistance.acceptance_token.substring(0, 10) + '...' : 'Não definido'}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => assistance?.acceptance_token && handleCopyToken(assistance.acceptance_token, 'aceitação')}
              title="Copiar token"
              className="h-8 w-8"
            >
              <Copy className="h-4 w-4" />
            </Button>
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
              {assistance?.scheduling_token ? assistance.scheduling_token.substring(0, 10) + '...' : 'Não definido'}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => assistance?.scheduling_token && handleCopyToken(assistance.scheduling_token, 'agendamento')}
              title="Copiar token"
              className="h-8 w-8"
            >
              <Copy className="h-4 w-4" />
            </Button>
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
              {assistance?.validation_token ? assistance.validation_token.substring(0, 10) + '...' : 'Não definido'}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => assistance?.validation_token && handleCopyToken(assistance.validation_token, 'validação')}
              title="Copiar token"
              className="h-8 w-8"
            >
              <Copy className="h-4 w-4" />
            </Button>
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
  );
}
