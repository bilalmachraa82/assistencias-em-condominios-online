
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Check, Wrench, Building, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import SupplierActionLayout from '@/components/supplier/SupplierActionLayout';
import SupplierPhotoUpload from '@/components/supplier/SupplierPhotoUpload';
import SupplierMessages from '@/components/supplier/SupplierMessages';
import { submitSupplierAction, fetchAssistanceData, getTypeBadgeClass } from '@/utils/SupplierActionUtils';

const PHOTO_CATEGORIES = [
  { id: "progresso", label: "Durante a Intervenção" },
  { id: "resultado", label: "Resultado Final" },
];

export default function CompleteRequest() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistance, setAssistance] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  useEffect(() => {
    if (!token) {
      setError('Token de acesso não fornecido');
      setLoading(false);
      return;
    }
    
    const loadAssistance = async () => {
      const result = await fetchAssistanceData('validate', token);
      
      if (!result.success) {
        setError(result.error || 'Erro ao carregar os detalhes da assistência');
      } else {
        setAssistance(result.data);
      }
      
      setLoading(false);
    };
    
    loadAssistance();
  }, [token]);

  const handleSubmit = async () => {
    setSubmitting(true);
    
    const result = await submitSupplierAction('complete', token!);
    
    if (result.success) {
      toast.success('Assistência marcada como concluída com sucesso!');
      navigate('/supplier/confirmation?action=completed');
    } else {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = () => {
    setRefreshTrigger(prev => prev + 1);
    toast.success('Fotos adicionadas com sucesso!');
  };

  const statusBadge = assistance?.type ? (
    <span className={`px-3 py-1 rounded-full text-xs ${getTypeBadgeClass(assistance.type)}`}>
      {assistance.type}
    </span>
  ) : null;

  return (
    <SupplierActionLayout 
      title="Conclusão de Serviço" 
      description="Adicione fotos e mensagens sobre a conclusão do serviço"
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
            <div className="text-sm font-medium mb-4">Fotos da Intervenção</div>
            <div className="grid gap-4">
              {PHOTO_CATEGORIES.map(category => (
                <SupplierPhotoUpload
                  key={`${category.id}-${refreshTrigger}`}
                  assistanceId={assistance.id}
                  category={category.id}
                  categoryLabel={category.label}
                  onUploadCompleted={handlePhotoUpload}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end border-t pt-4">
            <Button 
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Confirmar Conclusão
            </Button>
          </div>
        </div>
      )}
    </SupplierActionLayout>
  );
}
