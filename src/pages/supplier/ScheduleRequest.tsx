
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Building, Wrench, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import SupplierActionLayout from '@/components/supplier/SupplierActionLayout';
import SupplierMessages from '@/components/supplier/SupplierMessages';
import { submitSupplierAction, fetchAssistanceData, getTypeBadgeClass } from '@/utils/SupplierActionUtils';

export default function ScheduleRequest() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistance, setAssistance] = useState<any>(null);
  
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token de acesso não fornecido');
      setLoading(false);
      return;
    }
    
    const loadAssistance = async () => {
      const result = await fetchAssistanceData('schedule', token);
      
      if (!result.success) {
        setError(result.error || 'Erro ao carregar os detalhes da assistência');
      } else {
        setAssistance(result.data);
      }
      
      setLoading(false);
    };
    
    loadAssistance();
  }, [token]);

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Por favor, selecione data e hora');
      return;
    }
    
    setSubmitting(true);
    
    const datetime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    datetime.setHours(parseInt(hours), parseInt(minutes));
    
    const result = await submitSupplierAction('schedule', token!, {
      datetime: datetime.toISOString(),
      reason: rescheduleReason
    });
    
    if (result.success) {
      toast.success('Assistência agendada com sucesso!');
      navigate('/supplier/confirmation?action=scheduled');
    } else {
      setSubmitting(false);
    }
  };

  const statusBadge = assistance?.type ? (
    <span className={`px-3 py-1 rounded-full text-xs ${getTypeBadgeClass(assistance.type)}`}>
      {assistance.type}
    </span>
  ) : null;

  return (
    <SupplierActionLayout 
      title="Agendamento de Assistência" 
      description="Defina a data e hora para a intervenção"
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
            <div className="text-sm font-medium mb-2">Descrição</div>
            <div className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">
              {assistance.description}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Comunicação
            </h3>
            <SupplierMessages 
              assistanceId={assistance.id}
              supplierName={assistance.suppliers.name}
            />
          </div>

          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-4 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Definir Agendamento
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Data</label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border bg-white"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Hora</label>
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Observações (opcional)</label>
                  <Textarea
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    placeholder="Observações sobre o agendamento..."
                    className="bg-white"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t pt-4">
            <Button
              onClick={handleSchedule}
              disabled={submitting || !selectedDate || !selectedTime}
              className="flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              Confirmar Agendamento
            </Button>
          </div>
        </div>
      )}
    </SupplierActionLayout>
  );
}
