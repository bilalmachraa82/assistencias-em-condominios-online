import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, X, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { submitSupplierAction } from '@/utils/SupplierActionUtils';

interface AccessActionsProps {
  assistance: any;
  onUpdate: () => void;
}

export default function AccessActions({ assistance, onUpdate }: AccessActionsProps) {
  const [submitting, setSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [rescheduleReason, setRescheduleReason] = useState('');

  const handleAction = async (action: string, additionalData?: any) => {
    try {
      setSubmitting(true);
      
      const result = await submitSupplierAction(
        action as any,
        assistance.tokens.interaction,
        additionalData
      );
      
      if (result.success) {
        toast.success(`Ação "${action}" executada com sucesso`);
        onUpdate();
        // Reset forms
        setRejectionReason('');
        setScheduledDate(undefined);
        setScheduledTime('09:00');
        setRescheduleReason('');
      } else {
        toast.error(result.error || 'Erro ao executar ação');
      }
    } catch (error) {
      console.error('Error in handleAction:', error);
      toast.error('Erro ao executar ação');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = () => handleAction('accept');
  
  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Por favor, informe o motivo da rejeição');
      return;
    }
    handleAction('reject', { rejection_reason: rejectionReason });
  };
  
  const handleSchedule = () => {
    if (!scheduledDate) {
      toast.error('Por favor, selecione uma data');
      return;
    }
    
    const dateTime = new Date(scheduledDate);
    const [hours, minutes] = scheduledTime.split(':');
    dateTime.setHours(parseInt(hours), parseInt(minutes));
    
    handleAction('schedule', { 
      scheduled_datetime: dateTime.toISOString(),
      reschedule_reason: rescheduleReason || undefined
    });
  };
  
  const handleComplete = () => handleAction('complete');

  const status = assistance.status;
  const canAccept = status === 'Pendente Resposta Inicial';
  const canSchedule = status === 'Aceite' || status === 'Agendada';
  const canComplete = status === 'Agendada';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Disponíveis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canAccept && (
          <div className="flex gap-2">
            <Button 
              onClick={handleAccept}
              disabled={submitting}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              Aceitar
            </Button>
            
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Motivo da rejeição (obrigatório)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
              />
              <Button 
                variant="destructive"
                onClick={handleReject}
                disabled={submitting || !rejectionReason.trim()}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
            </div>
          </div>
        )}

        {canSchedule && (
          <div className="space-y-3 p-4 border rounded-lg">
            <h4 className="font-medium">Agendar Intervenção</h4>
            
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Data</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {scheduledDate ? format(scheduledDate, 'PPP', { locale: ptBR }) : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Hora</label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
            
            <Textarea
              placeholder="Motivo do reagendamento (opcional)"
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              rows={2}
            />
            
            <Button 
              onClick={handleSchedule}
              disabled={submitting || !scheduledDate}
              className="w-full"
            >
              <Clock className="h-4 w-4 mr-2" />
              {status === 'Aceite' ? 'Agendar' : 'Reagendar'}
            </Button>
          </div>
        )}

        {canComplete && (
          <Button 
            onClick={handleComplete}
            disabled={submitting}
            className="w-full"
            variant="outline"
          >
            <Check className="h-4 w-4 mr-2" />
            Marcar como Concluída
          </Button>
        )}
      </CardContent>
    </Card>
  );
}