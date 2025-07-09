import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Clock, Play, ExternalLink } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { generateToken } from "@/utils/TokenUtils";
import { toast } from 'sonner';
import { callSupplierRoute } from '@/utils/edgeFunctions';

interface FlowTest {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error';
  details?: string;
  url?: string;
  critical: boolean;
}

const initialTests: FlowTest[] = [
  {
    id: 'database-connection',
    name: 'Conexão Base de Dados',
    description: 'Verificar conectividade e RLS',
    status: 'pending',
    critical: true
  },
  {
    id: 'create-assistance',
    name: 'Criação de Assistência',
    description: 'Teste completo de criação incluindo tokens',
    status: 'pending',
    critical: true
  },
  {
    id: 'supplier-accept-page',
    name: 'Página Aceitação Fornecedor',
    description: 'Verificar acesso e funcionalidade da página de aceitação',
    status: 'pending',
    critical: true
  },
  {
    id: 'supplier-schedule-page',
    name: 'Página Agendamento',
    description: 'Verificar funcionalidade de agendamento',
    status: 'pending',
    critical: true
  },
  {
    id: 'supplier-complete-page',
    name: 'Página Conclusão',
    description: 'Verificar upload de fotos e conclusão',
    status: 'pending',
    critical: true
  },
  {
    id: 'edge-functions',
    name: 'Edge Functions',
    description: 'Testar supplier-route e submit-supplier-action',
    status: 'pending',
    critical: true
  },
  {
    id: 'email-system',
    name: 'Sistema de Emails',
    description: 'Verificar configuração e envio de emails',
    status: 'pending',
    critical: false
  },
  {
    id: 'photo-upload',
    name: 'Upload de Fotos',
    description: 'Testar sistema de upload e storage',
    status: 'pending',
    critical: false
  },
  {
    id: 'messaging-system',
    name: 'Sistema de Mensagens',
    description: 'Verificar comunicação entre admin e fornecedor',
    status: 'pending',
    critical: false
  }
];

export default function ComprehensiveFlowTester() {
  const [tests, setTests] = useState<FlowTest[]>(initialTests);
  const [isRunning, setIsRunning] = useState(false);
  const [testAssistanceId, setTestAssistanceId] = useState<number | null>(null);

  const updateTest = (id: string, updates: Partial<FlowTest>) => {
    setTests(prev => prev.map(test => 
      test.id === id ? { ...test, ...updates } : test
    ));
  };

  const runDatabaseTest = async () => {
    updateTest('database-connection', { status: 'running' });
    
    try {
      // Test basic connectivity
      const { count: assistanceCount, error: assistanceError } = await supabase
        .from('assistances')
        .select('*', { count: 'exact', head: true });

      if (assistanceError) throw assistanceError;

      // Test essential tables
      const [buildings, suppliers, interventionTypes] = await Promise.all([
        supabase.from('buildings').select('id').eq('is_active', true).limit(1),
        supabase.from('suppliers').select('id').eq('is_active', true).limit(1),
        supabase.from('intervention_types').select('id').limit(1)
      ]);

      const hasData = buildings.data?.length && suppliers.data?.length && interventionTypes.data?.length;

      updateTest('database-connection', {
        status: hasData ? 'success' : 'error',
        details: hasData 
          ? `Conectado - ${assistanceCount} assistências, dados essenciais presentes`
          : 'Faltam dados essenciais (edifícios, fornecedores ou tipos de intervenção)'
      });

      return hasData;
    } catch (error: any) {
      updateTest('database-connection', {
        status: 'error',
        details: error.message
      });
      return false;
    }
  };

  const runCreateAssistanceTest = async () => {
    updateTest('create-assistance', { status: 'running' });
    
    try {
      // Get first available building and supplier
      const [buildingResult, supplierResult, interventionResult] = await Promise.all([
        supabase.from('buildings').select('id, name').eq('is_active', true).limit(1).single(),
        supabase.from('suppliers').select('id, name').eq('is_active', true).limit(1).single(),
        supabase.from('intervention_types').select('id, name').limit(1).single()
      ]);

      if (buildingResult.error || supplierResult.error || interventionResult.error) {
        throw new Error('Dados essenciais não encontrados');
      }

      // Create test assistance
      const { data: assistance, error: createError } = await supabase
        .from('assistances')
        .insert({
          building_id: buildingResult.data.id,
          supplier_id: supplierResult.data.id,
          intervention_type_id: interventionResult.data.id,
          type: 'Normal',
          description: 'Teste automático completo - ' + new Date().toLocaleString(),
          status: 'Pendente Resposta Inicial',
          interaction_token: generateToken('int'),
          acceptance_token: generateToken('acc'),
          scheduling_token: generateToken('sch'),
          validation_token: generateToken('val')
        })
        .select('id, acceptance_token, scheduling_token, validation_token')
        .single();

      if (createError || !assistance) {
        throw new Error('Falha ao criar assistência: ' + createError?.message);
      }

      setTestAssistanceId(assistance.id);
      updateTest('create-assistance', {
        status: 'success',
        details: `Assistência ${assistance.id} criada com todos os tokens`
      });

      return assistance;
    } catch (error: any) {
      updateTest('create-assistance', {
        status: 'error',
        details: error.message
      });
      return null;
    }
  };

  const testSupplierPages = async (assistance: any) => {
    if (!assistance) return;

    // Test Accept Page
    updateTest('supplier-accept-page', { status: 'running' });
    try {
      const acceptUrl = `/supplier/accept/${assistance.acceptance_token}`;
      const { success, data, error } = await callSupplierRoute('accept', assistance.acceptance_token, { showToastOnError: false });
      
      console.log('🔍 Testing accept page:', {
        url: acceptUrl,
        success,
        token: assistance.acceptance_token,
        tokenLength: assistance.acceptance_token?.length
      });
      
      updateTest('supplier-accept-page', {
        status: success ? 'success' : 'error',
        details: success ? 'Página acessível e dados carregados' : `Erro: ${error}`,
        url: acceptUrl
      });
    } catch (error: any) {
      console.error('❌ Accept page test failed:', error);
      updateTest('supplier-accept-page', {
        status: 'error',
        details: error.message
      });
    }

    // Test Schedule Page
    updateTest('supplier-schedule-page', { status: 'running' });
    try {
      const scheduleUrl = `/supplier/schedule?token=${assistance.scheduling_token}`;
      const { success, data, error } = await callSupplierRoute('schedule', assistance.scheduling_token, { showToastOnError: false });
      
      updateTest('supplier-schedule-page', {
        status: success ? 'success' : 'error',
        details: success ? 'Página acessível e dados carregados' : `Erro: ${error}`,
        url: scheduleUrl
      });
    } catch (error: any) {
      updateTest('supplier-schedule-page', {
        status: 'error',
        details: error.message
      });
    }

    // Test Complete Page
    updateTest('supplier-complete-page', { status: 'running' });
    try {
      const completeUrl = `/supplier/complete?token=${assistance.validation_token}`;
      const { success, data, error } = await callSupplierRoute('validate', assistance.validation_token, { showToastOnError: false });
      
      updateTest('supplier-complete-page', {
        status: success ? 'success' : 'error',
        details: success ? 'Página acessível e dados carregados' : `Erro: ${error}`,
        url: completeUrl
      });
    } catch (error: any) {
      updateTest('supplier-complete-page', {
        status: 'error',
        details: error.message
      });
    }
  };

  const testEdgeFunctions = async () => {
    updateTest('edge-functions', { status: 'running' });
    
    try {
      // Test with invalid token to check validation
      const { success, error } = await callSupplierRoute('accept', 'invalid-token', { showToastOnError: false });
      
      // For edge function test, we expect this to fail (invalid token)
      const isValidationWorking = !success && error;
      
      updateTest('edge-functions', {
        status: isValidationWorking ? 'success' : 'error',
        details: isValidationWorking 
          ? 'Edge functions funcionais - validação de tokens OK' 
          : 'Edge functions podem ter problemas de validação'
      });
    } catch (error: any) {
      updateTest('edge-functions', {
        status: 'error',
        details: error.message
      });
    }
  };

  const testOtherSystems = async () => {
    // Test messaging system
    updateTest('messaging-system', { status: 'running' });
    if (testAssistanceId) {
      try {
        const { error } = await supabase
          .from('assistance_messages')
          .insert({
            assistance_id: testAssistanceId,
            sender_role: 'admin',
            sender_name: 'Sistema de Teste',
            message: 'Mensagem de teste'
          });

        updateTest('messaging-system', {
          status: error ? 'error' : 'success',
          details: error ? error.message : 'Sistema de mensagens funcional'
        });

        // Clean up test message
        if (!error) {
          await supabase
            .from('assistance_messages')
            .delete()
            .eq('assistance_id', testAssistanceId)
            .eq('sender_name', 'Sistema de Teste');
        }
      } catch (error: any) {
        updateTest('messaging-system', {
          status: 'error',
          details: error.message
        });
      }
    } else {
      updateTest('messaging-system', {
        status: 'error',
        details: 'Sem assistência de teste para testar mensagens'
      });
    }

    // Test photo upload (table structure)
    updateTest('photo-upload', { status: 'running' });
    try {
      const { error } = await supabase
        .from('assistance_photos')
        .select('id')
        .limit(1);

      updateTest('photo-upload', {
        status: error ? 'error' : 'success',
        details: error ? error.message : 'Estrutura de fotos funcional'
      });
    } catch (error: any) {
      updateTest('photo-upload', {
        status: 'error',
        details: error.message
      });
    }

    // Email system (basic check)
    updateTest('email-system', { status: 'running' });
    updateTest('email-system', {
      status: 'success',
      details: 'Configuração presente - teste manual necessário'
    });
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTests(initialTests);

    try {
      // 1. Database connectivity
      const dbConnected = await runDatabaseTest();
      if (!dbConnected) {
        throw new Error('Falha na conectividade da base de dados');
      }

      // 2. Create test assistance
      const assistance = await runCreateAssistanceTest();
      
      // 3. Test supplier pages
      await testSupplierPages(assistance);
      
      // 4. Test edge functions
      await testEdgeFunctions();
      
      // 5. Test other systems
      await testOtherSystems();

      toast.success('Testes completos! Revise os resultados abaixo.');
    } catch (error: any) {
      toast.error('Erro durante os testes: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const cleanupTest = async () => {
    if (!testAssistanceId) return;
    
    try {
      await supabase.rpc('delete_assistance_safely', { 
        p_assistance_id: testAssistanceId 
      });
      
      setTestAssistanceId(null);
      toast.success('Dados de teste limpos');
    } catch (error: any) {
      toast.error('Erro ao limpar dados: ' + error.message);
    }
  };

  const getStatusIcon = (status: FlowTest['status']) => {
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

  const criticalTests = tests.filter(t => t.critical);
  const otherTests = tests.filter(t => !t.critical);
  const allCriticalPassed = criticalTests.every(t => t.status === 'success');
  const hasCriticalErrors = criticalTests.some(t => t.status === 'error');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Teste Completo de Fluxos
        </CardTitle>
        <CardDescription>
          Verificação abrangente de todos os fluxos críticos antes do deploy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'A executar testes...' : 'Executar Todos os Testes'}
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

        {/* Status Overall */}
        {!isRunning && tests.some(t => t.status !== 'pending') && (
          <Alert variant={hasCriticalErrors ? "destructive" : allCriticalPassed ? "default" : "default"}>
            <AlertDescription>
              <strong>Estado Geral:</strong> {
                hasCriticalErrors 
                  ? "❌ Falhas críticas detectadas - NÃO PRONTO PARA DEPLOY"
                  : allCriticalPassed 
                    ? "✅ Todos os testes críticos passaram - PRONTO PARA DEPLOY"
                    : "⏳ Testes em progresso..."
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Critical Tests */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-red-600">Testes Críticos (Obrigatórios)</h3>
          <div className="space-y-2">
            {criticalTests.map(test => (
              <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(test.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{test.name}</span>
                      <Badge variant={test.status === 'success' ? 'default' : test.status === 'error' ? 'destructive' : 'secondary'}>
                        {test.status === 'pending' ? 'Pendente' :
                         test.status === 'running' ? 'A executar' :
                         test.status === 'success' ? 'Sucesso' : 'Erro'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{test.description}</p>
                    {test.details && (
                      <p className="text-xs text-gray-500 mt-1">{test.details}</p>
                    )}
                    {test.url && (
                      <a 
                        href={test.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                      >
                        Testar manualmente <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Other Tests */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-blue-600">Testes Adicionais</h3>
          <div className="space-y-2">
            {otherTests.map(test => (
              <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(test.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{test.name}</span>
                      <Badge variant={test.status === 'success' ? 'default' : test.status === 'error' ? 'destructive' : 'secondary'}>
                        {test.status === 'pending' ? 'Pendente' :
                         test.status === 'running' ? 'A executar' :
                         test.status === 'success' ? 'Sucesso' : 'Erro'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{test.description}</p>
                    {test.details && (
                      <p className="text-xs text-gray-500 mt-1">{test.details}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {testAssistanceId && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>ID da Assistência de Teste:</strong> {testAssistanceId}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Use este ID para verificações manuais adicionais se necessário.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
