
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Check, X, Clock, Building, Wrench, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import SupplierActionLayout from '@/components/supplier/SupplierActionLayout';
import SupplierMessages from '@/components/supplier/SupplierMessages';
import { submitSupplierAction, fetchAssistanceData, getTypeBadgeClass } from '@/utils/SupplierActionUtils';

export default function AcceptRequest() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistance, setAssistance] = useState<any>(null);
  
  const [acceptWithSchedule, setAcceptWithSchedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token de acesso não fornecido');
      setLoading(false);
      return;
    }
    
    const loadAssistance = async () => {
      const result = await fetchAssistanceData('accept', token);
      
      if (!result.success) {
        setError(result.error || 'Erro ao carregar os detalhes da assistência');
      } else {
        setAssistance(result.data);
      }
      
      setLoading(false);
    };
    
    loadAssistance();
  }, [token]);

  const handleAccept = async () => {
    setSubmitting(true);
    
    let data = undefined;
    if (acceptWithSchedule && selectedDate && selectedTime) {
      const datetime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      datetime.setHours(parseInt(hours), parseInt(minutes));
      data = { datetime: datetime.toISOString() };
    }
    
    const result = await submitSupplierAction('accept', token!, data);
    
    if (result.success) {
      const message = acceptWithSchedule 
        ? 'Assistência aceite e agendada com sucesso!'
        : 'Assistência aceite com sucesso!';
      toast.success(message);
      navigate('/supplier/confirmation?action=accepted');
    } else {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Por favor, indique o motivo da recusa');
      return;
    }
    
    setSubmitting(true);
    
    const result = await submitSupplierAction('reject', token!, {
      reason: rejectionReason
    });
    
    if (result.success) {
      toast.success('Assistência recusada');
      navigate('/supplier/confirmation?action=rejected');
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
      title="Solicitação de Assistência" 
      description="Revise os detalhes e decida sobre a solicitação"
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

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="schedule"
                checked={acceptWithSchedule}
                onChange={(e) => setAcceptWithSchedule(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="schedule" className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Aceitar e agendar imediatamente
              </label>
            </div>

            {acceptWithSchedule && (
              <div className="grid gap-4 md:grid-cols-2 p-4 bg-gray-50 rounded">
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
          </div>

          <div className="border-t pt-4">
            <label className="text-sm font-medium mb-2 block">Motivo da Recusa (opcional)</label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Se pretende recusar, indique o motivo..."
              className="bg-white"
              rows={3}
            />
          </div>

          <div className="flex gap-3 border-t pt-4">
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={submitting}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Recusar
            </Button>
            
            <Button
              onClick={handleAccept}
              disabled={submitting || (acceptWithSchedule && (!selectedDate || !selectedTime))}
              className="flex items-center gap-2 flex-1"
            >
              <Check className="h-4 w-4" />
              {acceptWithSchedule ? 'Aceitar e Agendar' : 'Aceitar'}
            </Button>
          </div>
        </div>
      )}
    </SupplierActionLayout>
  );
}
