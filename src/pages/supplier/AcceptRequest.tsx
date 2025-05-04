
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Building, Calendar, CalendarIcon, Clock, User, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import SupplierActionLayout from '@/components/supplier/SupplierActionLayout';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

export default function AcceptRequest() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistance, setAssistance] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Estado para o agendamento
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('10:00');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleStep, setScheduleStep] = useState(1);

  const timeOptions = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 8; // Start at 8 AM
    return `${hour}:00`;
  });

  useEffect(() => {
    if (!token) {
      setError('Token de acesso não fornecido');
      setLoading(false);
      return;
    }
    
    const fetchAssistance = async () => {
      try {
        console.log('Fetching assistance data with token:', token);
        const response = await fetch(
          `https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/supplier-route?action=accept&token=${token}`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        const result = await response.json();
        
        if (!response.ok) {
          setError(result.error || 'Erro ao carregar os detalhes da assistência');
          setLoading(false);
          return;
        }
        
        setAssistance(result.data);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar assistência:', err);
        setError('Erro ao carregar os detalhes da assistência. Por favor, tente novamente mais tarde.');
        setLoading(false);
      }
    };
    
    fetchAssistance();
  }, [token]);

  const handleAccept = async () => {
    setSubmitting(true);
    setShowScheduleForm(true);
    setSubmitting(false);
  };

  const handleScheduleSubmit = async () => {
    if (!selectedDate) {
      toast.error('Por favor, selecione uma data para o agendamento');
      return;
    }
    
    setSubmitting(true);
    
    // Combine date and time
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledDate = new Date(selectedDate);
    scheduledDate.setHours(hours, minutes);
    
    try {
      console.log('Submitting acceptance with scheduling token:', token);
      const response = await fetch(
        'https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/submit-supplier-action',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'accept',
            token,
            data: {
              datetime: scheduledDate.toISOString()
            }
          })
        }
      );
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        toast.error('Resposta inválida do servidor');
        setSubmitting(false);
        return;
      }
      
      if (!response.ok) {
        toast.error(result.error || 'Erro ao aceitar e agendar assistência');
        console.error('Error response:', result);
        setSubmitting(false);
        return;
      }
      
      toast.success('Assistência aceita e agendada com sucesso!');
      navigate('/supplier/confirmation?action=scheduled');
    } catch (err) {
      console.error('Erro ao aceitar assistência:', err);
      toast.error('Erro ao processar sua solicitação. Por favor, tente novamente.');
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Por favor, forneça um motivo para a recusa');
      return;
    }
    
    setSubmitting(true);
    try {
      console.log('Submitting rejection with token:', token);
      const response = await fetch(
        'https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/submit-supplier-action',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'reject',
            token,
            data: {
              reason: rejectionReason
            }
          })
        }
      );
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        toast.error('Resposta inválida do servidor');
        setSubmitting(false);
        return;
      }
      
      if (!response.ok) {
        toast.error(result.error || 'Erro ao recusar assistência');
        console.error('Error response:', result);
        setSubmitting(false);
        return;
      }
      
      toast.success('Assistência recusada com sucesso!');
      navigate('/supplier/confirmation?action=rejected');
    } catch (err) {
      console.error('Erro ao recusar assistência:', err);
      toast.error('Erro ao processar sua solicitação. Por favor, tente novamente.');
      setSubmitting(false);
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'Normal':
        return 'bg-green-500/20 text-green-300';
      case 'Urgente':
        return 'bg-orange-500/20 text-orange-300';
      case 'Emergência':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const statusBadge = assistance?.type ? (
    <span className={`px-3 py-1 rounded-full text-xs ${getTypeBadgeClass(assistance.type)}`}>
      {assistance.type}
    </span>
  ) : null;

  return (
    <SupplierActionLayout 
      title={showScheduleForm ? "Agendamento de Serviço" : "Solicitação de Assistência Técnica"} 
      description={showScheduleForm ? "Por favor, selecione a data e hora para a visita" : "Por favor, avalie e responda à solicitação abaixo"}
      loading={loading}
      error={error || undefined}
      statusBadge={statusBadge}
    >
      {assistance && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-start gap-2">
              <Building className="h-4 w-4 mt-1 text-gray-500" />
              <div>
                <div className="text-sm font-medium">Edifício</div>
                <div className="text-sm text-gray-600">{assistance.buildings.name}</div>
                <div className="text-xs text-gray-500">{assistance.buildings.address}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Wrench className="h-4 w-4 mt-1 text-gray-500" />
              <div>
                <div className="text-sm font-medium">Tipo de Intervenção</div>
                <div className="text-sm text-gray-600">{assistance.intervention_types.name}</div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-2">Descrição do Serviço</div>
            <div className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">
              {assistance.description}
            </div>
          </div>

          {showRejectForm ? (
            <div className="border-t pt-4">
              <div className="text-sm font-medium mb-2">Motivo da Recusa</div>
              <Textarea 
                placeholder="Por favor, explique por que não pode realizar este serviço..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="resize-none mb-4"
              />
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowRejectForm(false)}
                  disabled={submitting}
                >
                  Voltar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleReject}
                  disabled={submitting}
                >
                  {submitting ? 'Enviando...' : 'Confirmar Recusa'}
                </Button>
              </div>
            </div>
          ) : showScheduleForm ? (
            <div className="border-t pt-4">
              <div className="text-sm font-medium mb-4">Selecione a Data e Hora</div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm mb-2">Data</div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <div className="text-sm mb-2">Hora</div>
                  <select 
                    className="w-full border rounded-md h-10 px-3"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                  >
                    {timeOptions.map(time => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowScheduleForm(false)}
                  disabled={submitting}
                  className="mr-2"
                >
                  Voltar
                </Button>
                <Button 
                  onClick={handleScheduleSubmit}
                  disabled={submitting || !selectedDate}
                >
                  {submitting ? 'Enviando...' : 'Confirmar Aceitação e Agendamento'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end gap-4 border-t pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowRejectForm(true)}
                disabled={submitting}
              >
                Recusar Serviço
              </Button>
              <Button 
                onClick={handleAccept}
                disabled={submitting}
              >
                {submitting ? 'Enviando...' : 'Aceitar e Agendar Serviço'}
              </Button>
            </div>
          )}
        </div>
      )}
    </SupplierActionLayout>
  );
}
