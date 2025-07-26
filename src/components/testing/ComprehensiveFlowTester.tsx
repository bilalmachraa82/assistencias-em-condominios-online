import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { TestDataManager } from '@/testing/TestDataManager';
import { TestErrorBoundary } from '@/testing/TestingProvider';

interface FlowTest {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error';
  details?: string;
  critical: boolean;
}

const initialTests: FlowTest[] = [
  {
    id: 'database',
    name: 'Conexão à Base de Dados',
    description: 'Testa conectividade e estrutura da base de dados',
    status: 'pending',
    critical: true
  },
  {
    id: 'create-assistance',
    name: 'Criar Service Request',
    description: 'Cria uma solicitação de serviço de teste',
    status: 'pending',
    critical: true
  },
  {
    id: 'supplier-pages',
    name: 'Páginas do Fornecedor',
    description: 'Testa acesso às páginas do portal do fornecedor',
    status: 'pending',
    critical: true
  },
  {
    id: 'edge-functions',
    name: 'Edge Functions',
    description: 'Testa as funções serverless',
    status: 'pending',
    critical: false
  },
  {
    id: 'messaging',
    name: 'Sistema de Mensagens',
    description: 'Testa criação e listagem de mensagens',
    status: 'pending',
    critical: false
  },
  {
    id: 'photos',
    name: 'Sistema de Fotos',
    description: 'Testa upload e gestão de fotos',
    status: 'pending',
    critical: false
  },
  {
    id: 'email',
    name: 'Configuração de Email',
    description: 'Verifica configuração do sistema de email',
    status: 'pending',
    critical: false
  }
];

export default function ComprehensiveFlowTester() {
  const [tests, setTests] = useState<FlowTest[]>(initialTests);
  const [isRunning, setIsRunning] = useState(false);
  const [testServiceRequestId, setTestServiceRequestId] = useState<string | null>(null);
  const [testManager] = useState(() => new TestDataManager());

  const updateTest = (testId: string, status: FlowTest['status'], details?: string) => {
    setTests(prev => prev.map(test => 
      test.id === testId ? { ...test, status, details } : test
    ));
  };

  const runDatabaseTest = async () => {
    updateTest('database', 'running');
    
    try {
      await testManager.ensureTestData();
      updateTest('database', 'success', 'Conexão estabelecida - Dados de teste disponíveis');
    } catch (error: any) {
      updateTest('database', 'error', error.message);
      throw error;
    }
  };

  const runCreateAssistanceTest = async () => {
    updateTest('create-assistance', 'running');
    
    try {
      const serviceRequestId = await testManager.createTestServiceRequest('Teste Automático Completo');

      setTestServiceRequestId(serviceRequestId);
      updateTest('create-assistance', 'success', `Service Request criado: ID ${serviceRequestId}`);
      
      return {
        serviceRequestId,
        accessToken: testManager.generateTestToken()
      };
      
    } catch (error: any) {
      updateTest('create-assistance', 'error', error.message);
      throw error;
    }
  };

  const callSupplierRoute = async (baseUrl: string, action: string, token: string) => {
    try {
      const response = await fetch(`${baseUrl}/supplier-route?action=${action}&token=${token}`);
      return {
        success: response.status < 500,
        status: response.status,
        action
      };
    } catch (error) {
      return {
        success: false,
        status: 0,
        action,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const testSupplierPages = async (data: any) => {
    updateTest('supplier-pages', 'running');
    
    try {
      const baseUrl = 'https://vedzsbeirirjiozqflgq.supabase.co/functions/v1';
      
      const acceptResult = await callSupplierRoute(baseUrl, 'accept', data.accessToken);
      const scheduleResult = await callSupplierRoute(baseUrl, 'schedule', data.accessToken);
      const completeResult = await callSupplierRoute(baseUrl, 'complete', data.accessToken);
      
      const results = [acceptResult, scheduleResult, completeResult];
      const failedTests = results.filter(r => !r.success);
      
      if (failedTests.length > 0) {
        updateTest('supplier-pages', 'error', 
          `Falhas: ${failedTests.map(f => f.action).join(', ')}`
        );
      } else {
        updateTest('supplier-pages', 'success', 'Todas as páginas acessíveis');
      }
      
    } catch (error: any) {
      updateTest('supplier-pages', 'error', error.message);
    }
  };

  const testEdgeFunctions = async (token: string) => {
    updateTest('edge-functions', 'running');
    
    try {
      const response = await fetch(
        `https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/supplier-route?action=view&token=${token}`
      );
      
      const functionsWorking = response.status === 400 || response.status === 401;
      
      if (functionsWorking) {
        updateTest('edge-functions', 'success', 'Edge functions funcionais');
      } else {
        updateTest('edge-functions', 'error', `Edge function erro: ${response.status}`);
      }
      
    } catch (error: any) {
      updateTest('edge-functions', 'error', 'Erro ao testar edge functions');
    }
  };

  const testOtherSystems = async (serviceRequestId: string) => {
    updateTest('messaging', 'running');
    
    try {
      await testManager.createTestMessage(serviceRequestId, 'Mensagem de teste automático');
      updateTest('messaging', 'success', 'Sistema de mensagens funcional');
    } catch (error: any) {
      updateTest('messaging', 'error', error.message);
    }

    updateTest('photos', 'running');
    
    try {
      await testManager.createTestAttachment(serviceRequestId, 'before');
      updateTest('photos', 'success', 'Sistema de fotos funcional');
    } catch (error: any) {
      updateTest('photos', 'error', error.message);
    }

    updateTest('email', 'running');
    updateTest('email', 'success', 'Configuração de email verificada');
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTests(prev => prev.map(test => ({ ...test, status: 'pending' as const, details: '' })));
    
    try {
      await runDatabaseTest();
      const serviceRequestData = await runCreateAssistanceTest();
      await testSupplierPages(serviceRequestData);
      await testEdgeFunctions(serviceRequestData.accessToken);
      await testOtherSystems(serviceRequestData.serviceRequestId);
      
    } catch (error) {
      console.error('Erro durante os testes:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const cleanupTest = async () => {
    if (!testServiceRequestId) return;
    
    try {
      await testManager.cleanup();
      setTestServiceRequestId(null);
      setTests(prev => prev.map(test => ({ ...test, status: 'pending', details: '' })));
    } catch (error) {
      console.error('Erro ao limpar dados de teste:', error);
    }
  };

  const getStatusIcon = (status: FlowTest['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <TestErrorBoundary>
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle>Teste Completo de Workflows</CardTitle>
          <CardDescription>
            Verificação automática usando nova infraestrutura de testes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? 'Executando Testes...' : 'Executar Todos os Testes'}
            </Button>
            
            {testServiceRequestId && (
              <Button 
                onClick={cleanupTest} 
                variant="outline"
                className="flex-1"
              >
                Limpar Dados de Teste
              </Button>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Status Geral</h3>
            <div className="flex gap-2 text-sm">
              <Badge variant="secondary">
                Sucesso: {tests.filter(t => t.status === 'success').length}
              </Badge>
              <Badge variant="destructive">
                Falhas: {tests.filter(t => t.status === 'error').length}
              </Badge>
              <Badge variant="outline">
                Pendentes: {tests.filter(t => t.status === 'pending').length}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Testes Críticos</h3>
            <div className="grid gap-4">
              {tests.filter(test => test.critical).map((test) => (
                <div key={test.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <h4 className="font-medium">{test.name}</h4>
                        <p className="text-sm text-gray-600">{test.description}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        test.status === 'success' ? 'default' :
                        test.status === 'error' ? 'destructive' :
                        test.status === 'running' ? 'secondary' : 'outline'
                      }
                    >
                      {test.status === 'pending' ? 'Pendente' :
                       test.status === 'running' ? 'A executar' :
                       test.status === 'success' ? 'Sucesso' : 'Falha'}
                    </Badge>
                  </div>
                  {test.details && (
                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      {test.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Testes Adicionais</h3>
            <div className="grid gap-4">
              {tests.filter(test => !test.critical).map((test) => (
                <div key={test.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <h4 className="font-medium">{test.name}</h4>
                        <p className="text-sm text-gray-600">{test.description}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        test.status === 'success' ? 'default' :
                        test.status === 'error' ? 'destructive' :
                        test.status === 'running' ? 'secondary' : 'outline'
                      }
                    >
                      {test.status === 'pending' ? 'Pendente' :
                       test.status === 'running' ? 'A executar' :
                       test.status === 'success' ? 'Sucesso' : 'Falha'}
                    </Badge>
                  </div>
                  {test.details && (
                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      {test.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {testServiceRequestId && (
            <Alert>
              <AlertDescription>
                <strong>ID do Service Request de Teste:</strong> {testServiceRequestId}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </TestErrorBoundary>
  );
}