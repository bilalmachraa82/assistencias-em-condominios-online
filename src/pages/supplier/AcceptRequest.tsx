
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Check, X, Clock, Building, Wrench, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import SupplierActionLayout from '@/components/supplier/SupplierActionLayout';
import SupplierMessages from '@/components/supplier/SupplierMessages';
import { submitSupplierAction, fetchAssistanceData, getTypeBadgeClass } from '@/utils/SupplierActionUtils';
import { verifyHash } from '@/utils/HashUtils';

export default function AcceptRequest() {
  const [searchParams] = useSearchParams();
  const { token: paramToken } = useParams();
  const navigate = useNavigate();
  
  // Support both old (query param) and new (URL param + hash) systems
  const assistanceId = searchParams.get('id') || paramToken;
  const verifyParam = searchParams.get('verify');
  const token = searchParams.get('token') || paramToken;
  const usingNewSystem = verifyParam && assistanceId && !isNaN(Number(assistanceId));
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistance, setAssistance] = useState<any>(null);
  
  const [acceptWithSchedule, setAcceptWithSchedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!assistanceId && !token) {
      setError('Token ou ID de acesso não fornecido');
      setLoading(false);
      return;
    }
    
    const loadAssistance = async () => {
      if (usingNewSystem) {
        // New system: validate hash first
        const idNum = Number(assistanceId);
        if (!verifyHash(idNum, verifyParam)) {
          setError('Link de acesso inválido');
          setLoading(false);
          return;
        }
        
        try {
          console.log('🔄 Loading assistance data with new system - ID:', idNum);
          const response = await fetch(
            `https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/supplier-route?action=accept&id=${idNum}&verify=${verifyParam}`
          );
          
          if (!response.ok) {
            const errorData = await response.json();
            setError(errorData.error || 'Erro ao carregar assistência');
            setLoading(false);
            return;
          }
          
          const result = await response.json();
          console.log('✅ Assistance loaded successfully:', result.data);
          setAssistance(result.data);
        } catch (error) {
          console.error('❌ Network error:', error);
          setError('Erro de conexão');
        }
      } else {
        // Old system
        console.log('🔄 Loading assistance data with old system - token:', token);
        const result = await fetchAssistanceData('accept', token);
        
        if (!result.success) {
          console.error('❌ Failed to load assistance:', result.error);
          setError(result.error || 'Erro ao carregar os detalhes da assistência');
        } else {
          console.log('✅ Assistance loaded successfully:', result.data);
          setAssistance(result.data);
        }
      }
      
      setLoading(false);
    };
    
    loadAssistance();
  }, [token, assistanceId, verifyParam, usingNewSystem]);

  const handleAccept = async () => {
    console.log('🔄 Starting acceptance process...');
    console.log('Accept with schedule:', acceptWithSchedule);
    console.log('Selected date:', selectedDate);
    console.log('Selected time:', selectedTime);
    
    const credentials = usingNewSystem ? `${assistanceId}?verify=${verifyParam}` : token;
    if (!credentials) {
      toast.error('Credenciais de acesso inválidas');
      return;
    }
    
    // Validation
    if (acceptWithSchedule && (!selectedDate || !selectedTime)) {
      toast.error('Por favor, selecione uma data e hora para o agendamento');
      return;
    }
    
    setSubmitting(true);
    
    let data = undefined;
    if (acceptWithSchedule && selectedDate && selectedTime) {
      const datetime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      datetime.setHours(parseInt(hours), parseInt(minutes));
      data = { datetime: datetime.toISOString() };
      console.log('📅 Scheduling data:', data);
    }
    
    console.log('📤 Submitting acceptance...');
    const result = await submitSupplierAction('accept', credentials, data);
    
    if (result.success) {
      const message = acceptWithSchedule 
        ? 'Assistência aceite e agendada com sucesso!'
        : 'Assistência aceite com sucesso!';
      console.log('✅ Acceptance successful:', message);
      toast.success(message);
      navigate('/supplier/confirmation?action=accepted');
    } else {
      console.error('❌ Acceptance failed:', result.error);
      toast.error(result.error || 'Erro ao aceitar assistência');
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Por favor, indique o motivo da recusa');
      return;
    }
    
    const credentials = usingNewSystem ? `${assistanceId}?verify=${verifyParam}` : token;
    if (!credentials) {
      toast.error('Credenciais de acesso inválidas');
      return;
    }
    
    setSubmitting(true);
    
    console.log('📤 Submitting rejection...');
    const result = await submitSupplierAction('reject', credentials, {
      reason: rejectionReason
    });
    
    if (result.success) {
      console.log('✅ Rejection successful');
      toast.success('Assistência recusada');
      navigate('/supplier/confirmation?action=rejected');
    } else {
      console.error('❌ Rejection failed:', result.error);
      toast.error(result.error || 'Erro ao recusar assistência');
      setSubmitting(false);
    }
  };

  const statusBadge = assistance?.type ? (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeBadgeClass(assistance.type)}`}>
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
                <div className="text-sm font-medium text-gray-900">Edifício</div>
                <div className="text-sm text-gray-700">{assistance.buildings?.name || 'N/A'}</div>
                <div className="text-xs text-gray-500">{assistance.buildings?.address || 'N/A'}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Wrench className="h-4 w-4 mt-1 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-900">Tipo de Intervenção</div>
                <div className="text-sm text-gray-700">{assistance.intervention_types?.name || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-2 text-gray-900">Descrição</div>
            <div className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded border text-gray-800">
              {assistance.description}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2 text-gray-900">
              <MessageCircle className="h-4 w-4" />
              Comunicação
            </h3>
            <SupplierMessages 
              assistanceId={assistance.id}
              supplierName={assistance.suppliers?.name || 'Fornecedor'}
            />
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="schedule"
                checked={acceptWithSchedule}
                onChange={(e) => setAcceptWithSchedule(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <label htmlFor="schedule" className="text-sm font-medium flex items-center gap-1 text-gray-900">
                <Clock className="h-4 w-4" />
                Aceitar e agendar imediatamente
              </label>
            </div>

            {acceptWithSchedule && (
              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <label className="text-base font-semibold mb-3 block text-gray-900">Selecionar Data</label>
                    <div className="w-full">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        className="w-full max-w-none bg-white rounded-lg shadow-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-base font-semibold mb-3 block text-gray-900">Selecionar Hora</label>
                    <div className="space-y-3">
                      <Input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="bg-white border-gray-300 text-gray-900 text-lg p-4 h-14 text-center font-mono"
                        style={{ fontSize: '18px' }}
                      />
                      <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                        <strong>Hora selecionada:</strong> {selectedTime || 'Nenhuma hora selecionada'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <label className="text-sm font-medium mb-2 block text-gray-900">Motivo da Recusa (opcional)</label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Se pretende recusar, indique o motivo..."
              className="bg-white border-gray-300 text-gray-900 placeholder-gray-500"
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
              className="flex items-center gap-2 flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check className="h-4 w-4" />
              {submitting ? 'Processando...' : (acceptWithSchedule ? 'Aceitar e Agendar' : 'Aceitar')}
            </Button>
          </div>
        </div>
      )}
    </SupplierActionLayout>
  );
}
