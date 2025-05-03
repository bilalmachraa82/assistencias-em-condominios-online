
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Building, CalendarIcon, Clock, Wrench } from 'lucide-react';
import { format, addDays, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import SupplierActionLayout from '@/components/supplier/SupplierActionLayout';

export default function ScheduleRequest() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistance, setAssistance] = useState<any>(null);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('10:00');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isReschedule, setIsReschedule] = useState(false);

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
        const response = await fetch(
          `https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/supplier-route?action=schedule&token=${token}`,
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
        
        // If there's already a scheduled date, select it
        if (result.data.scheduled_datetime) {
          const date = new Date(result.data.scheduled_datetime);
          setSelectedDate(date);
          setSelectedTime(format(date, 'HH:mm'));
          setIsReschedule(true);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar assistência:', err);
        setError('Erro ao carregar os detalhes da assistência. Por favor, tente novamente mais tarde.');
        setLoading(false);
      }
    };
    
    fetchAssistance();
  }, [token]);

  const handleSchedule = async () => {
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
      const response = await fetch(
        'https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/submit-supplier-action',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: isReschedule ? 'reschedule' : 'schedule',
            token,
            data: {
              datetime: scheduledDate.toISOString(),
              reason: rescheduleReason
            }
          })
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        toast.error(result.error || 'Erro ao agendar assistência');
        setSubmitting(false);
        return;
      }
      
      toast.success(`Assistência ${isReschedule ? 'reagendada' : 'agendada'} com sucesso!`);
      navigate(`/supplier/confirmation?action=${isReschedule ? 'rescheduled' : 'scheduled'}`);
    } catch (err) {
      console.error('Erro ao agendar assistência:', err);
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
      title={isReschedule ? "Reagendamento de Serviço" : "Agendamento de Serviço"} 
      description="Por favor, selecione a data e hora para a visita"
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
                    <Calendar
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
          </div>

          {isReschedule && (
            <div className="border-t pt-4">
              <div className="text-sm font-medium mb-2">Motivo do Reagendamento</div>
              <Textarea 
                placeholder="Por favor, explique o motivo do reagendamento..."
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          )}

          <div className="flex justify-end border-t pt-4">
            <Button 
              onClick={handleSchedule}
              disabled={submitting || !selectedDate}
            >
              {isReschedule ? 'Confirmar Reagendamento' : 'Confirmar Agendamento'}
            </Button>
          </div>
        </div>
      )}
    </SupplierActionLayout>
  );
}
