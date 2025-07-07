import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/logo';
import SupplierMessages from '@/components/supplier/SupplierMessages';
import SupplierPhotoUpload from '@/components/supplier/SupplierPhotoUpload';
import PortalActions from '@/components/supplier/PortalActions';
import { fetchAssistanceData, getTypeBadgeClass } from '@/utils/SupplierActionUtils';
import { useAssistancePhotos } from '@/hooks/useAssistancePhotos';
import { useAssistanceMessages } from '@/hooks/useAssistanceMessages';
import { PHOTO_CATEGORIES } from '@/config/photoCategories';

export default function Portal() {
  const { token } = useParams<{ token: string }>();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assistance, setAssistance] = useState<any>(null);

  const { data: photos = [], refetch: refetchPhotos } = useAssistancePhotos(assistance?.id);
  const { data: messages = [] } = useAssistanceMessages(assistance?.id);

  useEffect(() => {
    if (!token) {
      setError('Token de acesso não fornecido');
      setLoading(false);
      return;
    }
    
    const loadAssistance = async () => {
      // Try different token types to find the assistance
      const actions: ('accept' | 'schedule' | 'validate')[] = ['accept', 'schedule', 'validate'];
      let result = null;
      
      for (const action of actions) {
        result = await fetchAssistanceData(action, token);
        if (result.success) break;
      }
      
      if (!result?.success) {
        setError('Token inválido ou assistência não encontrada');
      } else {
        setAssistance(result.data);
      }
      
      setLoading(false);
    };
    
    loadAssistance();
  }, [token]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-500 to-blue-700 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando portal...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-500 to-blue-700 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <Logo size="lg" className="mx-auto mb-4" />
            <CardTitle className="text-center text-red-600">Erro de Acesso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">{error}</p>
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
                <Badge className={`flex items-center gap-2 ${getStatusColor(assistance?.status || '')}`}>
                  {getStatusIcon(assistance?.status || '')}
                  {assistance?.status}
                </Badge>
                <Badge className={`${getTypeBadgeClass(assistance?.type || '')}`}>
                  {assistance?.type}
                </Badge>
              </div>
            </div>
            <div className="mt-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Portal do Fornecedor - Assistência #{assistance?.id}
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
                    <p className="font-medium text-gray-900">{assistance?.buildings?.name}</p>
                    <p className="text-sm text-gray-600">{assistance?.buildings?.address}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 mt-1 text-gray-500" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Fornecedor</p>
                    <p className="text-sm text-gray-600">{assistance?.suppliers?.name}</p>
                    <p className="text-sm text-gray-600">{assistance?.suppliers?.email}</p>
                  </div>
                </div>

                {assistance?.intervention_types && (
                  <div className="flex items-start gap-3">
                    <Wrench className="h-5 w-5 mt-1 text-gray-500" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Tipo de Intervenção</p>
                      <p className="text-sm text-gray-600">{assistance.intervention_types.name}</p>
                    </div>
                  </div>
                )}

                {assistance?.scheduled_datetime && (
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
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="actions">Ações</TabsTrigger>
                    <TabsTrigger value="messages">Mensagens</TabsTrigger>
                    <TabsTrigger value="photos">Fotos</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Descrição do Trabalho</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <p className="text-gray-800 whitespace-pre-wrap">
                            {assistance?.description || 'Nenhuma descrição disponível'}
                          </p>
                        </div>
                      </div>

                      {assistance?.admin_notes && (
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
                        <h4 className="font-medium text-cyan-800 mb-2">💡 Dica Profissional</h4>
                        <p className="text-cyan-700 text-sm">
                          Use as abas acima para navegar entre as diferentes secções do portal. 
                          Mantenha-se sempre em contacto através das mensagens e documente 
                          o progresso com fotos.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="actions" className="p-6">
                    {assistance && token && (
                      <PortalActions 
                        assistance={assistance}
                        token={token}
                        onActionCompleted={() => {
                          // Reload page to get updated assistance data
                          window.location.reload();
                        }}
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="messages" className="p-6">
                    {assistance && (
                      <SupplierMessages 
                        assistanceId={assistance.id}
                        supplierName={assistance.suppliers?.name || 'Fornecedor'}
                      />
                    )}
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
                            assistanceId={assistance?.id}
                            category="diagnostico"
                            onUploadCompleted={refetchPhotos}
                          />
                          <SupplierPhotoUpload
                            assistanceId={assistance?.id}
                            category="progresso"
                            onUploadCompleted={refetchPhotos}
                          />
                          <SupplierPhotoUpload
                            assistanceId={assistance?.id}
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
                                  className="w-full h-32 object-cover rounded-lg border shadow-sm"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg">
                                  <div className="absolute bottom-2 left-2 right-2">
                                    <Badge className="text-xs bg-white text-gray-800">
                                      {PHOTO_CATEGORIES[photo.category as keyof typeof PHOTO_CATEGORIES]}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="timeline" className="p-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Timeline da Assistência</h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="font-medium">Assistência criada</p>
                            <p className="text-sm text-gray-600">
                              {assistance?.created_at ? 
                                new Date(assistance.created_at).toLocaleString('pt-PT') : 
                                'Data não disponível'
                              }
                            </p>
                          </div>
                        </div>
                        
                        {assistance?.scheduled_datetime && (
                          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                            <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="font-medium">Agendamento realizado</p>
                              <p className="text-sm text-gray-600">
                                {new Date(assistance.scheduled_datetime).toLocaleString('pt-PT')}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="font-medium">Status atual</p>
                            <p className="text-sm text-gray-600">{assistance?.status}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Última atualização: {assistance?.updated_at ? 
                                new Date(assistance.updated_at).toLocaleString('pt-PT') : 
                                'Data não disponível'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
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