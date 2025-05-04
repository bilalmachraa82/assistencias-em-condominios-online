
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Camera, Check, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import SupplierActionLayout from '@/components/supplier/SupplierActionLayout';
import { submitSupplierAction, fetchAssistanceData, getTypeBadgeClass } from '@/utils/SupplierActionUtils';
import { Building } from 'lucide-react';

export default function CompleteRequest() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistance, setAssistance] = useState<any>(null);
  
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPhoto(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleCaptureClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async () => {
    if (!photo) {
      toast.error('Por favor, adicione uma foto do serviço concluído');
      return;
    }
    
    setSubmitting(true);
    
    const result = await submitSupplierAction('complete', token!, {
      photoBase64: photo
    });
    
    if (result.success) {
      toast.success('Assistência marcada como concluída com sucesso!');
      navigate('/supplier/confirmation?action=completed');
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
      title="Conclusão de Serviço" 
      description="Por favor, confirme a conclusão do serviço com uma foto"
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
            <div className="text-sm font-medium mb-4">Adicionar Foto de Conclusão</div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              capture="environment"
            />

            {photo ? (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden border">
                  <img 
                    src={photo} 
                    alt="Foto de conclusão" 
                    className="w-full h-auto object-contain max-h-64" 
                  />
                </div>
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={handleCaptureClick}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Trocar Foto
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={handleCaptureClick}
              >
                <Camera className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Clique para adicionar uma foto da conclusão do serviço</p>
              </div>
            )}
          </div>

          <div className="flex justify-end border-t pt-4">
            <Button 
              onClick={handleSubmit}
              disabled={submitting || !photo}
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
