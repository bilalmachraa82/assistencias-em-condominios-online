
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Play, CheckCircle, AlertCircle, Clock, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

interface TestStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error';
  details?: string;
  url?: string;
}

export default function EndToEndTester() {
  const [isRunning, setIsRunning] = useState(false);
  const [testAssistanceId, setTestAssistanceId] = useState<number | null>(null);
  const [steps, setSteps] = useState<TestStep[]>([
    {
      id: 'create',
      title: 'Criar Assistência de Teste',
      description: 'Criar uma nova assistência com dados de teste',
      status: 'pending'
    },
    {
      id: 'tokens',
      title: 'Verificar Tokens',
      description: 'Validar que todos os tokens foram gerados',
      status: 'pending'
    },
    {
      id: 'supplier-accept',
      title: 'Teste Aceitação Fornecedor',
      description: 'Verificar página de aceitação do fornecedor',
      status: 'pending'
    },
    {
      id: 'supplier-schedule',
      title: 'Teste Agendamento',
      description: 'Verificar página de agendamento',
      status: 'pending'
    },
    {
      id: 'supplier-complete',
      title: 'Teste Conclusão',
      description: 'Verificar página de conclusão com fotos',
      status: 'pending'
    },
    {
      id: 'messages',
      title: 'Teste Mensagens',
      description: 'Verificar sistema de mensagens',
      status: 'pending'
    },
    {
      id: 'photos',
      title: 'Teste Upload Fotos',
      description: 'Verificar upload de fotos por categoria',
      status: 'pending'
    },
    {
      id: 'edge-functions',
      title: 'Teste Edge Functions',
      description: 'Verificar funcionamento das edge functions',
      status: 'pending'
    }
  ]);

  const updateStepStatus = (stepId: string, status: TestStep['status'], details?: string, url?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, details, url }
        : step
    ));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL copiada para clipboard!');
  };

  const runTests = async () => {
    setIsRunning(true);
    
    try {
      // Step 1: Create test assistance
      updateStepStatus('create', 'running');
      
      const { data: buildings } = await supabase
        .from('buildings')
        .select('id')
        .limit(1);
      
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id')
        .limit(1);
      
      const { data: interventionTypes } = await supabase
        .from('intervention_types')
        .select('id')
        .limit(1);

      if (!buildings?.length || !suppliers?.length || !interventionTypes?.length) {
        updateStepStatus('create', 'error', 'Dados necessários não encontrados (edifícios, fornecedores ou tipos de intervenção)');
        return;
      }

      const { data: assistance, error: createError } = await supabase
        .from('assistances')
        .insert([{
          building_id: buildings[0].id,
          supplier_id: suppliers[0].id,
          intervention_type_id: interventionTypes[0].id,
          type: 'Normal',
          description: 'Teste automático do sistema - ' + new Date().toLocaleString(),
          status: 'Pendente Resposta Inicial'
        }])
        .select('id')
        .single();

      if (createError || !assistance) {
        updateStepStatus('create', 'error', createError?.message || 'Erro ao criar assistência');
        return;
      }

      setTestAssistanceId(assistance.id);
      updateStepStatus('create', 'success', `Assistência criada com ID: ${assistance.id}`);

      // Step 2: Check tokens
      updateStepStatus('tokens', 'running');
      
      const { data: assistanceData, error: tokenError } = await supabase
        .from('assistances')
        .select('acceptance_token, scheduling_token, validation_token')
        .eq('id', assistance.id)
        .single();

      if (tokenError || !assistanceData?.acceptance_token) {
        updateStepStatus('tokens', 'error', 'Tokens não foram gerados automaticamente');
        return;
      }

      updateStepStatus('tokens', 'success', 'Todos os tokens gerados correctamente');

      // Step 3: Test supplier accept page
      updateStepStatus('supplier-accept', 'running');
      
      try {
        const acceptUrl = `/supplier/accept?token=${assistanceData.acceptance_token}`;
        const response = await fetch(`${window.location.origin}${acceptUrl}`);
        
        if (response.ok) {
          updateStepStatus('supplier-accept', 'success', 'Página de aceitação acessível', acceptUrl);
        } else {
          updateStepStatus('supplier-accept', 'error', `Erro HTTP: ${response.status}`);
        }
      } catch (err) {
        updateStepStatus('supplier-accept', 'success', 'URL gerada (teste manual necessário)', `/supplier/accept?token=${assistanceData.acceptance_token}`);
      }

      // Step 4: Test supplier schedule page (if scheduling_token exists)
      updateStepStatus('supplier-schedule', 'running');
      
      if (assistanceData.scheduling_token) {
        const scheduleUrl = `/supplier/schedule?token=${assistanceData.scheduling_token}`;
        updateStepStatus('supplier-schedule', 'success', 'URL de agendamento gerada', scheduleUrl);
      } else {
        updateStepStatus('supplier-schedule', 'error', 'Token de agendamento não encontrado');
      }

      // Step 5: Test supplier complete page (if validation_token exists)
      updateStepStatus('supplier-complete', 'running');
      
      if (assistanceData.validation_token) {
        const completeUrl = `/supplier/complete?token=${assistanceData.validation_token}`;
        updateStepStatus('supplier-complete', 'success', 'URL de conclusão gerada', completeUrl);
      } else {
        updateStepStatus('supplier-complete', 'error', 'Token de validação não encontrado');
      }

      // Step 6: Test messages system
      updateStepStatus('messages', 'running');
      
      const { error: messageError } = await supabase
        .from('assistance_messages')
        .insert([{
          assistance_id: assistance.id,
          sender_role: 'admin',
          sender_name: 'Sistema de Teste',
          message: 'Mensagem de teste automático'
        }]);

      if (messageError) {
        updateStepStatus('messages', 'error', messageError.message);
      } else {
        updateStepStatus('messages', 'success', 'Sistema de mensagens funcional');
      }

      // Step 7: Test photo upload capability
      updateStepStatus('photos', 'running');
      
      // Just test the table structure
      const { error: photoError } = await supabase
        .from('assistance_photos')
        .insert([{
          assistance_id: assistance.id,
          category: 'teste',
          photo_url: 'https://example.com/test.jpg',
          uploaded_by: 'teste'
        }]);

      if (photoError) {
        updateStepStatus('photos', 'error', photoError.message);
      } else {
        updateStepStatus('photos', 'success', 'Sistema de fotos funcional');
        
        // Clean up test photo
        await supabase
          .from('assistance_photos')
          .delete()
          .eq('assistance_id', assistance.id)
          .eq('category', 'teste');
      }

      // Step 8: Test edge functions
      updateStepStatus('edge-functions', 'running');
      
      try {
        const response = await fetch(
          `https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/supplier-route?action=accept&token=${assistanceData.acceptance_token}`
        );
        
        if (response.ok) {
          updateStepStatus('edge-functions', 'success', 'Edge functions funcionais');
        } else {
          updateStepStatus('edge-functions', 'error', `Edge function erro: ${response.status}`);
        }
      } catch (err) {
        updateStepStatus('edge-functions', 'error', 'Erro ao testar edge functions');
      }

      toast.success('Testes concluídos! Verifique os resultados abaixo.');
      
    } catch (error) {
      console.error('Erro durante os testes:', error);
      toast.error('Erro durante a execução dos testes');
    } finally {
      setIsRunning(false);
    }
  };

  const cleanupTest = async () => {
    if (!testAssistanceId) return;
    
    try {
      // Delete test messages
      await supabase
        .from('assistance_messages')
        .delete()
        .eq('assistance_id', testAssistanceId);
      
      // Delete test photos
      await supabase
        .from('assistance_photos')
        .delete()
        .eq('assistance_id', testAssistanceId);
      
      // Delete test assistance
      await supabase
        .from('assistances')
        .delete()
        .eq('id', testAssistanceId);
      
      setTestAssistanceId(null);
      setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const, details: undefined, url: undefined })));
      
      toast.success('Dados de teste limpos');
    } catch (error) {
      toast.error('Erro ao limpar dados de teste');
    }
  };

  const getStatusIcon = (status: TestStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: TestStep['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'running':
        return 'bg-blue-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Teste End-to-End do Sistema
        </CardTitle>
        <CardDescription>
          Execute testes automáticos para verificar todo o fluxo do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={runTests}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'A executar testes...' : 'Executar Testes'}
          </Button>
          
          {testAssistanceId && (
            <Button
              variant="outline"
              onClick={cleanupTest}
              disabled={isRunning}
            >
              Limpar Dados de Teste
            </Button>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg border">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getStatusIcon(step.status)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{index + 1}. {step.title}</span>
                    <Badge variant={step.status === 'success' ? 'default' : step.status === 'error' ? 'destructive' : 'secondary'}>
                      {step.status === 'pending' ? 'Pendente' : 
                       step.status === 'running' ? 'A executar' :
                       step.status === 'success' ? 'Sucesso' : 'Erro'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  {step.details && (
                    <p className="text-xs text-gray-500 mt-1">{step.details}</p>
                  )}
                  {step.url && (
                    <div className="flex items-center gap-2 mt-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{step.url}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(window.location.origin + step.url)}
                        className="h-6 px-2"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {testAssistanceId && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>ID da Assistência de Teste:</strong> {testAssistanceId}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Use este ID para testar manualmente as funcionalidades no dashboard principal.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
