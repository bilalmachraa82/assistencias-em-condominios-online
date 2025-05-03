
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Building, Calendar, User, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import SupplierActionLayout from '@/components/supplier/SupplierActionLayout';

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

  useEffect(() => {
    if (!token) {
      setError('Token de acesso não fornecido');
      setLoading(false);
      return;
    }
    
    const fetchAssistance = async () => {
      try {
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
    try {
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
            data: {}
          })
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        toast.error(result.error || 'Erro ao aceitar assistência');
        setSubmitting(false);
        return;
      }
      
      toast.success('Assistência aceita com sucesso!');
      // Redirect to scheduling page
      navigate(`/supplier/schedule?token=${token}`);
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
      
      const result = await response.json();
      
      if (!response.ok) {
        toast.error(result.error || 'Erro ao recusar assistência');
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
      title="Solicitação de Assistência Técnica" 
      description="Por favor, avalie e responda à solicitação abaixo"
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
                  Confirmar Recusa
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
                Aceitar Serviço
              </Button>
            </div>
          )}
        </div>
      )}
    </SupplierActionLayout>
  );
}
