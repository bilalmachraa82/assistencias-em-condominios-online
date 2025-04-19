import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, ArrowRight, X, Calendar, Send, Camera, Clock, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Status types for better type checking
type AssistanceStatus = 
  | 'Pendente Resposta Inicial'
  | 'Agendada'
  | 'Rejeitada Pelo Fornecedor'
  | 'Concluída'
  | 'Cancelada Pelo Admin';

interface Assistance {
  id: number;
  description: string;
  status: AssistanceStatus;
  type: string;
  scheduled_datetime?: string;
  building: {
    name: string;
    address?: string;
  };
  supplier: {
    name: string;
    email: string;
  };
  intervention_type: {
    name: string;
  };
}

const SupplierInteraction = () => {
  const { token } = useParams<{ token: string }>();
  const [assistance, setAssistance] = useState<Assistance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Form states
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Fetch assistance details
  useEffect(() => {
    async function fetchAssistance() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/handle-supplier-interaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'getAssistanceDetails',
            token: token
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch assistance details');
        }
        
        const data = await response.json();
        setAssistance(data.assistance);
      } catch (err: any) {
        console.error('Error fetching assistance:', err);
        setError(err.message || 'Failed to load assistance details. The link may be invalid or expired.');
      } finally {
        setLoading(false);
      }
    }
    
    if (token) {
      fetchAssistance();
    }
  }, [token]);
  
  // Handle file change for photo upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Schedule assistance
  const handleSchedule = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione uma data e hora para o agendamento.",
        variant: "destructive"
      });
      return;
    }
    
    // Combine date and time
    const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`;
    
    setSubmitting(true);
    try {
      const response = await fetch('https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/handle-supplier-interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'scheduleAssistance',
          token: token,
          data: {
            scheduledDateTime
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao agendar assistência');
      }
      
      const result = await response.json();
      
      // Update local state
      setAssistance(prevState => {
        if (!prevState) return null;
        return {
          ...prevState,
          status: 'Agendada',
          scheduled_datetime: scheduledDateTime
        };
      });
      
      toast({
        title: "Agendamento realizado",
        description: "A assistência foi agendada com sucesso.",
        variant: "default"
      });
    } catch (err: any) {
      console.error('Error scheduling assistance:', err);
      toast({
        title: "Erro no agendamento",
        description: err.message || "Não foi possível agendar a assistência.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Reject assistance
  const handleReject = async () => {
    setSubmitting(true);
    try {
      const response = await fetch('https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/handle-supplier-interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'rejectAssistance',
          token: token,
          data: {
            rejectionReason
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao rejeitar assistência');
      }
      
      const result = await response.json();
      
      // Update local state
      setAssistance(prevState => {
        if (!prevState) return null;
        return {
          ...prevState,
          status: 'Rejeitada Pelo Fornecedor'
        };
      });
      
      toast({
        title: "Pedido rejeitado",
        description: "O pedido de assistência foi rejeitado e o administrador será notificado.",
        variant: "default"
      });
    } catch (err: any) {
      console.error('Error rejecting assistance:', err);
      toast({
        title: "Erro na rejeição",
        description: err.message || "Não foi possível rejeitar o pedido.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Complete assistance with photo
  const handleComplete = async () => {
    if (!photoPreview) {
      toast({
        title: "Foto obrigatória",
        description: "Por favor, envie uma foto como comprovante da assistência.",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch('https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/handle-supplier-interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'completeAssistance',
          token: token,
          data: {
            photoBase64: photoPreview
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao concluir assistência');
      }
      
      const result = await response.json();
      
      // Update local state
      setAssistance(prevState => {
        if (!prevState) return null;
        return {
          ...prevState,
          status: 'Concluída'
        };
      });
      
      toast({
        title: "Assistência concluída",
        description: "A assistência foi marcada como concluída com sucesso.",
        variant: "default"
      });
    } catch (err: any) {
      console.error('Error completing assistance:', err);
      toast({
        title: "Erro na conclusão",
        description: err.message || "Não foi possível concluir a assistência.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Reschedule assistance
  const handleReschedule = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione uma nova data e hora para o reagendamento.",
        variant: "destructive"
      });
      return;
    }
    
    // Combine date and time
    const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`;
    
    setSubmitting(true);
    try {
      const response = await fetch('https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/handle-supplier-interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'rescheduleAssistance',
          token: token,
          data: {
            scheduledDateTime
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao reagendar assistência');
      }
      
      const result = await response.json();
      
      // Update local state
      setAssistance(prevState => {
        if (!prevState) return null;
        return {
          ...prevState,
          scheduled_datetime: scheduledDateTime
        };
      });
      
      toast({
        title: "Reagendamento realizado",
        description: "A assistência foi reagendada com sucesso.",
        variant: "default"
      });
    } catch (err: any) {
      console.error('Error rescheduling assistance:', err);
      toast({
        title: "Erro no reagendamento",
        description: err.message || "Não foi possível reagendar a assistência.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="text-lg">Carregando...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card className="border-red-200 shadow-lg">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-800 flex items-center">
              <X className="mr-2" />
              Erro ao carregar assistência
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
            <p className="mt-4 text-gray-600">
              O link que você está tentando acessar pode ser inválido ou expirado. 
              Por favor, entre em contato com o administrador para obter um novo link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If no assistance was found
  if (!assistance) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card className="border-yellow-200 shadow-lg">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="text-yellow-800">Assistência não encontrada</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p>
              Não foi possível encontrar os detalhes desta assistência. 
              Por favor, verifique o link ou entre em contato com o administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pendente Resposta Inicial':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente Resposta</Badge>;
      case 'Agendada':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Agendada</Badge>;
      case 'Rejeitada Pelo Fornecedor':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Rejeitada</Badge>;
      case 'Concluída':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Concluída</Badge>;
      case 'Cancelada Pelo Admin':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Helper to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não agendado';
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (err) {
      return 'Data inválida';
    }
  };
  
  // Helper to format type name
  const formatTypeName = (assistance: Assistance) => {
    return assistance.intervention_type?.name || assistance.type;
  };
  
  // Main content (Closed assistance)
  if (['Concluída', 'Rejeitada Pelo Fornecedor', 'Cancelada Pelo Admin'].includes(assistance.status)) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card className="border shadow-lg">
          <CardHeader className="bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Pedido de Assistência - {assistance.building.name}</CardTitle>
                <CardDescription>
                  {formatTypeName(assistance)}
                </CardDescription>
              </div>
              <div>
                {getStatusBadge(assistance.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">Detalhes do Pedido</h3>
                <p className="mt-1 text-gray-700">{assistance.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Condomínio</h4>
                  <p className="text-gray-900">{assistance.building.name}</p>
                  {assistance.building.address && (
                    <p className="text-sm text-gray-500">{assistance.building.address}</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Fornecedor</h4>
                  <p className="text-gray-900">{assistance.supplier.name}</p>
                  <p className="text-sm text-gray-500">{assistance.supplier.email}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="py-4 text-center">
                <div className="inline-flex items-center justify-center rounded-full bg-gray-100 p-3 mb-4">
                  <X className="h-6 w-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Pedido Fechado</h3>
                <p className="mt-1 text-gray-500">
                  {assistance.status === 'Concluída' && "Este pedido foi marcado como concluído."}
                  {assistance.status === 'Rejeitada Pelo Fornecedor' && "Este pedido foi rejeitado."}
                  {assistance.status === 'Cancelada Pelo Admin' && "Este pedido foi cancelado pelo administrador."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Main content for Pendente Resposta Inicial
  if (assistance.status === 'Pendente Resposta Inicial') {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card className="border shadow-lg">
          <CardHeader className="bg-blue-50">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Pedido de Assistência - {assistance.building.name}</CardTitle>
                <CardDescription>
                  {formatTypeName(assistance)}
                </CardDescription>
              </div>
              <div>
                {getStatusBadge(assistance.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">Detalhes do Pedido</h3>
                <p className="mt-1 text-gray-700">{assistance.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Condomínio</h4>
                  <p className="text-gray-900">{assistance.building.name}</p>
                  {assistance.building.address && (
                    <p className="text-sm text-gray-500">{assistance.building.address}</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Fornecedor</h4>
                  <p className="text-gray-900">{assistance.supplier.name}</p>
                  <p className="text-sm text-gray-500">{assistance.supplier.email}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="py-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Responder ao Pedido</h3>
                
                <Tabs defaultValue="schedule">
                  <TabsList className="w-full">
                    <TabsTrigger value="schedule" className="flex-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      Agendar
                    </TabsTrigger>
                    <TabsTrigger value="reject" className="flex-1">
                      <X className="h-4 w-4 mr-2" />
                      Rejeitar
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="schedule" className="pt-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="scheduledDate">Data</Label>
                          <Input 
                            id="scheduledDate" 
                            type="date" 
                            value={scheduledDate} 
                            onChange={(e) => setScheduledDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="scheduledTime">Hora</Label>
                          <Input 
                            id="scheduledTime" 
                            type="time" 
                            value={scheduledTime} 
                            onChange={(e) => setScheduledTime(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={handleSchedule}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                            Processando...
                          </>
                        ) : (
                          <>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            Agendar Assistência
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="reject" className="pt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="rejectionReason">Motivo da Rejeição (opcional)</Label>
                        <Textarea 
                          id="rejectionReason" 
                          placeholder="Explique o motivo pelo qual não pode atender este pedido..." 
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                        />
                      </div>
                      
                      <Button 
                        variant="destructive" 
                        className="w-full" 
                        onClick={handleReject}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                            Processando...
                          </>
                        ) : (
                          <>
                            <X className="mr-2 h-4 w-4" />
                            Rejeitar Pedido
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Main content for Agendada
  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Card className="border shadow-lg">
        <CardHeader className="bg-green-50">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Pedido de Assistência - {assistance.building.name}</CardTitle>
              <CardDescription>
                {formatTypeName(assistance)}
              </CardDescription>
            </div>
            <div>
              {getStatusBadge(assistance.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Detalhes do Pedido</h3>
              <p className="mt-1 text-gray-700">{assistance.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Condomínio</h4>
                <p className="text-gray-900">{assistance.building.name}</p>
                {assistance.building.address && (
                  <p className="text-sm text-gray-500">{assistance.building.address}</p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Agendado para</h4>
                <p className="text-gray-900 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1 text-blue-500" />
                  {formatDate(assistance.scheduled_datetime)}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="py-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Atualizar Assistência</h3>
              
              <Tabs defaultValue="complete">
                <TabsList className="w-full">
                  <TabsTrigger value="complete" className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Concluir
                  </TabsTrigger>
                  <TabsTrigger value="reschedule" className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reagendar
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="complete" className="pt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="photoUpload">Foto Comprobatória</Label>
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                        {photoPreview ? (
                          <div className="relative w-full">
                            <img 
                              src={photoPreview} 
                              alt="Preview" 
                              className="mx-auto max-h-64 rounded-lg object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setPhotoFile(null);
                                setPhotoPreview(null);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Camera className="h-12 w-12 text-gray-400 mb-2" />
                            <p className="text-gray-500 text-center mb-2">
                              Adicione uma foto como comprovante do serviço realizado
                            </p>
                            <Input 
                              id="photoUpload" 
                              type="file" 
                              accept="image/*" 
                              onChange={handleFileChange}
                              className="hidden"
                            />
                            <Label 
                              htmlFor="photoUpload" 
                              className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                            >
                              Selecionar Foto
                            </Label>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={handleComplete}
                      disabled={submitting || !photoPreview}
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                          Processando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Concluir Assistência
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="reschedule" className="pt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rescheduledDate">Nova Data</Label>
                        <Input 
                          id="rescheduledDate" 
                          type="date" 
                          value={scheduledDate} 
                          onChange={(e) => setScheduledDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rescheduledTime">Nova Hora</Label>
                        <Input 
                          id="rescheduledTime" 
                          type="time" 
                          value={scheduledTime} 
                          onChange={(e) => setScheduledTime(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={handleReschedule}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                          Processando...
                        </>
                      ) : (
                        <>
                          <Clock className="mr-2 h-4 w-4" />
                          Reagendar Assistência
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierInteraction;
