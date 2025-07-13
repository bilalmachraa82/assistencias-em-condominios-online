import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Check, Clock, Building, User, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import AccessActions from '@/components/access/AccessActions';
import AccessMessages from '@/components/access/AccessMessages';
import AccessPhotos from '@/components/access/AccessPhotos';

interface AssistanceData {
  id: number;
  type: string;
  description: string;
  status: string;
  admin_notes?: string;
  scheduled_datetime?: string;
  created_at: string;
  building: {
    name: string;
    address: string;
  };
  supplier: {
    name: string;
    email: string;
  };
  intervention_type?: {
    name: string;
  };
  tokens: {
    interaction: string;
    acceptance?: string;
    scheduling?: string;
    validation?: string;
  };
}

export default function AccessPortal() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assistance, setAssistance] = useState<AssistanceData | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  console.log('🎯 AccessPortal mounted with code:', code);

  useEffect(() => {
    if (!code) {
      setError('Código de acesso não fornecido na URL');
      setLoading(false);
      return;
    }

    validateMagicCode();
  }, [code, refreshTrigger]);

  const validateMagicCode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Validating magic code:', code);
      
      const { data, error } = await supabase
        .rpc('validate_magic_code', { input_code: code });
      
      if (error) {
        console.error('❌ Error validating code:', error);
        throw error;
      }
      
      console.log('✅ Magic code validation result:', data);
      
      // Type-safe parsing of JSON response
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (!result.success) {
        setError(result.error || 'Código de acesso inválido');
        return;
      }
      
      setAssistance(result.data);
      toast.success('Acesso autorizado');
      
    } catch (err) {
      console.error('❌ Error in validateMagicCode:', err);
      setError('Erro ao validar código de acesso');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Validando acesso...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive mb-4">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Acesso Negado</span>
            </div>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assistance) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Nenhuma assistência encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Assistência #{assistance.id}
              </CardTitle>
              <Badge variant={assistance.status === 'Pendente Resposta Inicial' ? 'destructive' : 'default'}>
                {assistance.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Prédio</h3>
                <p className="text-sm text-muted-foreground">{assistance.building.name}</p>
                <p className="text-sm text-muted-foreground">{assistance.building.address}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Fornecedor</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  {assistance.supplier.name}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {assistance.supplier.email}
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Descrição</h3>
              <p className="text-sm">{assistance.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid gap-6">
          <AccessActions 
            assistance={assistance} 
            onUpdate={refreshData}
          />
          
          <div className="grid md:grid-cols-2 gap-6">
            <AccessMessages 
              assistanceId={assistance.id}
              onUpdate={refreshData}
            />
            
            <AccessPhotos 
              assistanceId={assistance.id}
              onUpdate={refreshData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}