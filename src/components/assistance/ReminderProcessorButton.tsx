
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { Bell, Loader2 } from 'lucide-react';

interface ReminderProcessorButtonProps {
  disabled?: boolean;
}

export default function ReminderProcessorButton({ disabled = false }: ReminderProcessorButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastRunResults, setLastRunResults] = useState<any>(null);

  const handleProcessReminders = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/scheduled-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar lembretes');
      }

      setLastRunResults({
        message: result.message,
        timestamp: new Date().toLocaleString('pt-BR')
      });
      
      toast.success('Lembretes processados com sucesso!', {
        description: result.message
      });
    } catch (error) {
      console.error('Erro ao processar lembretes:', error);
      toast.error('Erro ao processar lembretes', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button 
        variant="outline" 
        onClick={handleProcessReminders}
        disabled={disabled || isLoading}
        className="flex items-center gap-2"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
        <span>{isLoading ? 'Processando...' : 'Processar Lembretes'}</span>
      </Button>
      
      {lastRunResults && (
        <div className="mt-2 text-xs text-muted-foreground">
          <p>Último processamento: {lastRunResults.timestamp}</p>
          <p>{lastRunResults.message}</p>
        </div>
      )}
    </div>
  );
}
