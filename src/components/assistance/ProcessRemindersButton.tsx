
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { Bell, Loader2 } from 'lucide-react';

export default function ProcessRemindersButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastRunResults, setLastRunResults] = useState<any>(null);

  const handleProcessReminders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        'https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/process-reminders',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        toast.error(result.error || 'Erro ao processar lembretes');
        return;
      }
      
      setLastRunResults(result);
      toast.success(result.message || 'Lembretes processados com sucesso');
    } catch (err) {
      console.error('Erro ao processar lembretes:', err);
      toast.error('Erro ao processar lembretes. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleProcessReminders}
        disabled={isLoading}
        variant="outline"
        className="flex items-center gap-2"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
        <span>{isLoading ? 'Processando...' : 'Processar Lembretes'}</span>
      </Button>
      
      {lastRunResults && (
        <div className="mt-2 text-xs text-muted-foreground">
          <p>Último processamento: {lastRunResults.results.sameDayReminders} lembretes do dia, {lastRunResults.results.nextDayReminders} lembretes do dia seguinte.</p>
          {lastRunResults.results.errors.length > 0 && (
            <p className="text-destructive">Erros: {lastRunResults.results.errors.length}</p>
          )}
        </div>
      )}
    </div>
  );
}
