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
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Ações Disponíveis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {canAccept && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-subtle border rounded-lg">
              <h4 className="font-medium mb-4 text-foreground">Resposta Inicial</h4>
              <div className="grid gap-4">
                <Button 
                  onClick={handleAccept}
                  disabled={submitting}
                  className="premium-button h-12 text-base font-medium"
                >
                  <Check className="h-5 w-5 mr-2" />
                  {submitting ? 'Processando...' : 'Aceitar Assistência'}
                </Button>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    Motivo da Rejeição (obrigatório para rejeitar)
                  </label>
                  <Textarea
                    placeholder="Descreva o motivo da rejeição da assistência..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="bg-background border-2 focus:border-primary transition-colors"
                  />
                  <Button 
                    variant="destructive"
                    onClick={handleReject}
                    disabled={submitting || !rejectionReason.trim()}
                    className="w-full h-12 text-base"
                  >
                    <X className="h-5 w-5 mr-2" />
                    {submitting ? 'Processando...' : 'Rejeitar Assistência'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {canSchedule && (
          <div className="p-4 bg-gradient-subtle border rounded-lg">
            <h4 className="font-medium mb-4 text-foreground">
              {status === 'Aceite' ? 'Agendar Intervenção' : 'Reagendar Intervenção'}
            </h4>
            
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Data da Intervenção</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-12 bg-background border-2 hover:border-primary transition-colors"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {scheduledDate ? format(scheduledDate, 'PPP', { locale: ptBR }) : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto bg-background border rounded-lg p-3"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Hora da Intervenção</label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="h-12 bg-background border-2 focus:border-primary transition-colors"
                />
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-foreground">
                Observações {status === 'Aceite' ? '(opcional)' : 'do Reagendamento (opcional)'}
              </label>
              <Textarea
                placeholder={status === 'Aceite' 
                  ? "Observações sobre o agendamento..." 
                  : "Motivo do reagendamento..."}
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                rows={3}
                className="bg-background border-2 focus:border-primary transition-colors"
              />
            </div>
            
            <Button 
              onClick={handleSchedule}
              disabled={submitting || !scheduledDate}
              className="w-full mt-4 h-12 premium-button text-base"
            >
              <Clock className="h-5 w-5 mr-2" />
              {submitting ? 'Processando...' : (status === 'Aceite' ? 'Confirmar Agendamento' : 'Confirmar Reagendamento')}
            </Button>
          </div>
        )}

        {canComplete && (
          <div className="p-4 bg-gradient-subtle border rounded-lg">
            <h4 className="font-medium mb-3 text-foreground">Finalizar Assistência</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Marque como concluída apenas após finalizar todos os trabalhos e enviar as fotos necessárias.
            </p>
            <Button 
              onClick={handleComplete}
              disabled={submitting}
              className="w-full h-12 bg-success hover:bg-success/90 text-success-foreground text-base"
            >
              <Check className="h-5 w-5 mr-2" />
              {submitting ? 'Processando...' : 'Marcar como Concluída'}
            </Button>
          </div>
        )}

        {!canAccept && !canSchedule && !canComplete && (
          <div className="p-6 text-center bg-gradient-subtle border rounded-lg">
            <Check className="h-8 w-8 text-success mx-auto mb-3" />
            <h4 className="font-medium text-foreground mb-2">Estado Atual</h4>
            <p className="text-sm text-muted-foreground">
              Nenhuma ação pendente no momento. O estado atual da assistência é "{assistance.status}".
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}