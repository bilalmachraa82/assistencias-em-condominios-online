
import React from 'react';
import { Button } from "@/components/ui/button";

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
  return (
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
  );
}
