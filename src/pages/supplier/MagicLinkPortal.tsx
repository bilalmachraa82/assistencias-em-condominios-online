import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Building, 
  Wrench, 
  Clock, 
  MessageCircle, 
  Camera, 
  User,
  CheckCircle,
  AlertCircle,
  Calendar,
  KeyRound,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/logo';
import { supabase } from '@/integrations/supabase/client';
import SupplierMessages from '@/components/supplier/SupplierMessages';
import SupplierPhotoUpload from '@/components/supplier/SupplierPhotoUpload';
import PortalActions from '@/components/supplier/PortalActions';
import { useAssistancePhotos } from '@/hooks/useAssistancePhotos';
import { useAssistanceMessages } from '@/hooks/useAssistanceMessages';

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
    acceptance: string;
    scheduling: string;
    validation: string;
  };
}

export default function MagicLinkPortal() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assistance, setAssistance] = useState<AssistanceData | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Detecta magic code da URL ou modo manual
  const magicCode = searchParams.get('magic');

  const { data: photos = [], refetch: refetchPhotos } = useAssistancePhotos(assistance?.id);
  const { data: messages = [] } = useAssistanceMessages(assistance?.id);

  const validateMagicCode = async (code: string) => {
    console.log('🔑 Validating magic code:', code);
    
    try {
      const { data, error } = await supabase.rpc('validate_magic_code', {
        input_code: code.toUpperCase()
      });

      if (error) {
        console.error('❌ Database error:', error);
        throw new Error('Erro de conexão com a base de dados');
      }

      const result = data as any;
      
      if (!result.success) {
        console.error('❌ Invalid magic code:', result.error);
        setError(result.error);
        return false;
      }

      console.log('✅ Magic code validated successfully:', result.data);
      setAssistance(result.data);
      setError(null);
      return true;
    } catch (error: any) {
      console.error('❌ Error validating magic code:', error);
      setError('Erro ao validar código de acesso');
      return false;
    }
  };

  useEffect(() => {
    const loadPortal = async () => {
      console.log('🚀 NOVO PORTAL MAGIC LINK:');
      console.log('📧 URL completa:', window.location.href);
      console.log('🔑 Magic code da URL:', magicCode || 'NENHUM');

      if (magicCode) {
        // Auto-login com magic code da URL
        const success = await validateMagicCode(magicCode);
        if (!success) {
          setShowManualEntry(true);
        }
      } else {
        // Sem magic code - mostrar entrada manual
        setShowManualEntry(true);
        setError('Por favor, insira o seu código de acesso recebido por email');
      }
      
      setLoading(false);
    };

    loadPortal();
  }, [magicCode]);

  const handleManualCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode || manualCode.length !== 6) {
      toast.error('Por favor, insira um código de 6 caracteres');
      return;
    }

    setLoading(true);
    const success = await validateMagicCode(manualCode);
    if (success) {
      setShowManualEntry(false);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendente resposta inicial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'aceite':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'agendado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'em progresso':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'concluído':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'recusado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendente resposta inicial':
        return <Clock className="h-4 w-4" />;
      case 'aceite':
      case 'concluído':
        return <CheckCircle className="h-4 w-4" />;
      case 'agendado':
        return <Calendar className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-500 to-blue-700 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando portal...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Manual code entry state
  if (showManualEntry || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-500 to-blue-700 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Logo size="lg" className="mx-auto mb-4" />
            <CardTitle className="flex items-center justify-center gap-2">
              <KeyRound className="h-5 w-5" />
              Portal do Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Como aceder?</h4>
                  <p className="text-blue-700 text-sm">
                    Introduza o código de 6 caracteres que recebeu por email ou clique 
                    diretamente no link do email.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleManualCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Acesso
                </label>
                <Input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="ex: ABC123"
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-wider"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Código de 6 caracteres (letras e números)
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={manualCode.length !== 6}>
                <KeyRound className="h-4 w-4 mr-2" />
                Aceder ao Portal
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main portal interface (after successful authentication)
  if (!assistance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-500 to-blue-700 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Erro ao carregar dados da assistência</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 to-blue-700 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <Logo size="lg" />
              <div className="flex items-center gap-3">
                <Badge className={`flex items-center gap-2 ${getStatusColor(assistance.status)}`}>
                  {getStatusIcon(assistance.status)}
                  {assistance.status}
                </Badge>
                <Badge variant="outline">
                  {assistance.type}
                </Badge>
              </div>
            </div>
            <div className="mt-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Portal do Fornecedor - Assistência #{assistance.id}
              </h1>
              <p className="text-gray-600 mt-1">
                Acompanhe e gerencie sua assistência em tempo real
              </p>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Assistance Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Detalhes da Assistência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 mt-1 text-gray-500" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{assistance.building.name}</p>
                    <p className="text-sm text-gray-600">{assistance.building.address}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 mt-1 text-gray-500" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Fornecedor</p>
                    <p className="text-sm text-gray-600">{assistance.supplier.name}</p>
                    <p className="text-sm text-gray-600">{assistance.supplier.email}</p>
                  </div>
                </div>

                {assistance.intervention_type && (
                  <div className="flex items-start gap-3">
                    <Wrench className="h-5 w-5 mt-1 text-gray-500" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Tipo de Intervenção</p>
                      <p className="text-sm text-gray-600">{assistance.intervention_type.name}</p>
                    </div>
                  </div>
                )}

                {assistance.scheduled_datetime && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 mt-1 text-gray-500" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Data Agendada</p>
                      <p className="text-sm text-gray-600">
                        {new Date(assistance.scheduled_datetime).toLocaleString('pt-PT')}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <MessageCircle className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{messages.length}</p>
                    <p className="text-sm text-gray-600">Mensagens</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <Camera className="h-6 w-6 mx-auto text-green-600 mb-2" />
                    <p className="text-2xl font-bold text-green-600">{photos.length}</p>
                    <p className="text-sm text-gray-600">Fotos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Interactive Content */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="p-0">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="actions">Ações</TabsTrigger>
                    <TabsTrigger value="messages">Mensagens</TabsTrigger>
                    <TabsTrigger value="photos">Fotos</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Descrição do Trabalho</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <p className="text-gray-800 whitespace-pre-wrap">
                            {assistance.description || 'Nenhuma descrição disponível'}
                          </p>
                        </div>
                      </div>

                      {assistance.admin_notes && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Notas do Administrador</h3>
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-blue-800 whitespace-pre-wrap">
                              {assistance.admin_notes}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                        <h4 className="font-medium text-cyan-800 mb-2">✨ Sistema Novo</h4>
                        <p className="text-cyan-700 text-sm">
                          Este portal usa o novo sistema Magic Link, similar ao usado 
                          pelas principais empresas do setor. Simples, seguro e eficiente!
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="actions" className="p-6">
                    <PortalActions 
                      assistance={{
                        id: assistance.id,
                        status: assistance.status,
                        type: assistance.type,
                        scheduled_datetime: assistance.scheduled_datetime,
                        interaction_token: assistance.tokens.interaction,
                        acceptance_token: assistance.tokens.acceptance,
                        scheduling_token: assistance.tokens.scheduling,
                        validation_token: assistance.tokens.validation
                      }}
                      token={assistance.tokens.interaction}
                      onActionCompleted={() => window.location.reload()}
                    />
                  </TabsContent>
                  
                  <TabsContent value="messages" className="p-6">
                    <SupplierMessages 
                      assistanceId={assistance.id}
                      supplierName={assistance.supplier.name}
                    />
                  </TabsContent>
                  
                  <TabsContent value="photos" className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Upload de Fotos</h3>
                        <p className="text-gray-600 mb-6">
                          Documente o progresso do trabalho com fotos organizadas por categoria.
                        </p>
                        
                        <div className="grid gap-6 md:grid-cols-2">
                          <SupplierPhotoUpload
                            assistanceId={assistance.id}
                            category="diagnostico"
                            onUploadCompleted={refetchPhotos}
                          />
                          <SupplierPhotoUpload
                            assistanceId={assistance.id}
                            category="progresso"
                            onUploadCompleted={refetchPhotos}
                          />
                          <SupplierPhotoUpload
                            assistanceId={assistance.id}
                            category="resultado"
                            onUploadCompleted={refetchPhotos}
                          />
                        </div>
                      </div>

                      {photos.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Fotos Enviadas</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {photos.map((photo) => (
                              <div key={photo.id} className="relative group">
                                <img
                                  src={photo.photo_url}
                                  alt={`Foto ${photo.category}`}
                                  className="w-full h-32 object-cover rounded-lg border"
                                />
                                <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                                  {photo.category}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}