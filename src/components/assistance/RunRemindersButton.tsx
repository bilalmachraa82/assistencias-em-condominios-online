
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { Bell } from 'lucide-react';

interface RunRemindersButtonProps {
  disabled?: boolean;
}

export default function RunRemindersButton({ disabled = false }: RunRemindersButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRunReminders = async () => {
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
    <Button 
      variant="outline" 
      onClick={handleRunReminders}
      disabled={disabled || isLoading}
      className="flex items-center gap-2"
    >
      <Bell className="h-4 w-4" />
      <span>{isLoading ? 'Processando...' : 'Processar Lembretes'}</span>
    </Button>
  );
}
