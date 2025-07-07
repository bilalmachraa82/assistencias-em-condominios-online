import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  X, 
  Clock, 
  Calendar as CalendarIcon,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { submitSupplierAction } from '@/utils/SupplierActionUtils';

interface PortalActionsProps {
  assistance: any;
  token: string;
  onActionCompleted?: () => void;
}

export default function PortalActions({ assistance, token, onActionCompleted }: PortalActionsProps) {
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  
  // Accept/Reject state
  const [acceptWithSchedule, setAcceptWithSchedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Schedule/Reschedule state
  const [rescheduleReason, setRescheduleReason] = useState('');

  const getAvailableActions = () => {
    const status = assistance?.status?.toLowerCase() || '';
    const actions = [];

    if (status === 'pendente resposta inicial') {
      actions.push('accept', 'reject');
    }
    if (status === 'aceite' || status === 'agendado') {
      actions.push('schedule', 'reschedule');
    }
    if (status === 'em progresso' || status === 'agendado') {
      actions.push('complete');
    }

    return actions;
  };

  const handleAccept = async () => {
    if (acceptWithSchedule && (!selectedDate || !selectedTime)) {
      toast.error('Por favor, selecione uma data e hora para o agendamento');
      return;
    }
    
    setLoading(true);
    
    let data = undefined;
    if (acceptWithSchedule && selectedDate && selectedTime) {
      const datetime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      datetime.setHours(parseInt(hours), parseInt(minutes));
      data = { datetime: datetime.toISOString() };
    }
    
    const result = await submitSupplierAction('accept', token, data);
    
    if (result.success) {
      const message = acceptWithSchedule 
        ? 'Assistência aceite e agendada com sucesso!'
        : 'Assistência aceite com sucesso!';
      toast.success(message);
      setActiveAction(null);
      onActionCompleted?.();
    } else {
      toast.error(result.error || 'Erro ao aceitar assistência');
    }
    
    setLoading(false);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Por favor, indique o motivo da recusa');
      return;
    }
    
    setLoading(true);
    
    const result = await submitSupplierAction('reject', token, {
      reason: rejectionReason
    });
    
    if (result.success) {
      toast.success('Assistência recusada');
      setActiveAction(null);
      onActionCompleted?.();
    } else {
      toast.error(result.error || 'Erro ao recusar assistência');
    }
    
    setLoading(false);
  };

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Por favor, selecione uma data e hora');
      return;
    }
    
    setLoading(true);
    
    const datetime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    datetime.setHours(parseInt(hours), parseInt(minutes));
    
    const result = await submitSupplierAction('schedule', token, {
      datetime: datetime.toISOString(),
      reason: rescheduleReason || undefined
    });
    
    if (result.success) {
      toast.success('Assistência agendada com sucesso!');
      setActiveAction(null);
      onActionCompleted?.();
    } else {
      toast.error(result.error || 'Erro ao agendar assistência');
    }
    
    setLoading(false);
  };

  const handleComplete = async () => {
    setLoading(true);
    
    const result = await submitSupplierAction('complete', token);
    
    if (result.success) {
      toast.success('Assistência marcada como concluída!');
      setActiveAction(null);
      onActionCompleted?.();
    } else {
      toast.error(result.error || 'Erro ao completar assistência');
    }
    
    setLoading(false);
  };

  const availableActions = getAvailableActions();

  if (availableActions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Estado Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-100 text-blue-800">
              {assistance?.status}
            </Badge>
            <p className="text-sm text-gray-600">
              Nenhuma ação pendente no momento.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Ações Disponíveis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {availableActions.includes('accept') && (
            <Button
              onClick={() => setActiveAction(activeAction === 'accept' ? null : 'accept')}
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              <Check className="h-4 w-4 mr-2" />
              Aceitar
            </Button>
          )}
          
          {availableActions.includes('reject') && (
            <Button
              variant="destructive"
              onClick={() => setActiveAction(activeAction === 'reject' ? null : 'reject')}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Recusar
            </Button>
          )}
          
          {availableActions.includes('schedule') && (
            <Button
              onClick={() => setActiveAction(activeAction === 'schedule' ? null : 'schedule')}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Agendar
            </Button>
          )}
          
          {availableActions.includes('reschedule') && (
            <Button
              variant="outline"
              onClick={() => setActiveAction(activeAction === 'reschedule' ? null : 'reschedule')}
              disabled={loading}
            >
              <Clock className="h-4 w-4 mr-2" />
              Reagendar
            </Button>
          )}
          
          {availableActions.includes('complete') && (
            <Button
              onClick={() => setActiveAction(activeAction === 'complete' ? null : 'complete')}
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Completar
            </Button>
          )}
        </div>

        {/* Accept Action */}
        {activeAction === 'accept' && (
          <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="schedule"
                checked={acceptWithSchedule}
                onChange={(e) => setAcceptWithSchedule(e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <label htmlFor="schedule" className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Aceitar e agendar imediatamente
              </label>
            </div>

            {acceptWithSchedule && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Data</label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="w-full bg-white rounded-lg shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Hora</label>
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleAccept}
              disabled={loading || (acceptWithSchedule && (!selectedDate || !selectedTime))}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {acceptWithSchedule ? 'Aceitar e Agendar' : 'Aceitar Assistência'}
            </Button>
          </div>
        )}

        {/* Reject Action */}
        {activeAction === 'reject' && (
          <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <label className="text-sm font-medium mb-2 block">Motivo da Recusa</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Por favor, indique o motivo da recusa..."
                className="bg-white"
                rows={3}
              />
            </div>

            <Button
              onClick={handleReject}
              disabled={loading || !rejectionReason.trim()}
              variant="destructive"
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Recusa
            </Button>
          </div>
        )}

        {/* Schedule/Reschedule Action */}
        {(activeAction === 'schedule' || activeAction === 'reschedule') && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Data</label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="w-full bg-white rounded-lg shadow-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Hora</label>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>

            {activeAction === 'reschedule' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Motivo do Reagendamento (opcional)</label>
                <Textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Indique o motivo do reagendamento..."
                  className="bg-white"
                  rows={2}
                />
              </div>
            )}

            <Button
              onClick={handleSchedule}
              disabled={loading || !selectedDate || !selectedTime}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {activeAction === 'reschedule' ? 'Reagendar Assistência' : 'Agendar Assistência'}
            </Button>
          </div>
        )}

        {/* Complete Action */}
        {activeAction === 'complete' && (
          <div className="space-y-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="text-sm text-emerald-800">
              <p className="font-medium mb-2">Ao marcar como concluída:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>A assistência será finalizada</li>
                <li>O administrador será notificado</li>
                <li>Certifique-se de ter enviado todas as fotos necessárias</li>
              </ul>
            </div>

            <Button
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Marcar como Concluída
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}