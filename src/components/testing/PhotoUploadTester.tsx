import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
// import AssistancePhotoUploader from '@/components/assistance/sections/AssistancePhotoUploader';
import { TestDataManager } from '@/testing/TestDataManager';
import { TestErrorBoundary } from '@/testing/TestingProvider';

type TestState = 'checking' | 'ready' | 'uploading' | 'success' | 'error' | 'cleaning';

interface TestPrerequisites {
  hasBuildings: boolean;
  hasContractors: boolean;
  hasCategories: boolean;
  buildingId?: string;
  contractorId?: string;
  categoryId?: string;
}

export default function PhotoUploadTester() {
  const [testState, setTestState] = useState<TestState>('checking');
  const [prerequisites, setPrerequisites] = useState<TestPrerequisites>({
    hasBuildings: false,
    hasContractors: false,
    hasCategories: false
  });
  const [testServiceRequestId, setTestServiceRequestId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [testManager] = useState(() => new TestDataManager());

  useEffect(() => {
    checkPrerequisites();
  }, []);

  const checkPrerequisites = async () => {
    try {
      setTestState('checking');

      const testData = await testManager.ensureTestData();

      setPrerequisites({
        hasBuildings: !!testData.buildingId,
        hasContractors: !!testData.contractorId,
        hasCategories: !!testData.categoryId,
        buildingId: testData.buildingId,
        contractorId: testData.contractorId,
        categoryId: testData.categoryId
      });

      setTestState('ready');
    } catch (error: any) {
      setTestState('error');
      setErrorMessage('Erro ao verificar prerequisitos: ' + error.message);
    }
  };

  const startAutonomousTest = async () => {
    try {
      setTestState('uploading');
      setErrorMessage('');

      const serviceRequestId = await testManager.createTestServiceRequest('Teste Upload de Fotos');

      setTestServiceRequestId(serviceRequestId);
      setTestResult(`Service Request de teste criado com ID: ${serviceRequestId}`);

    } catch (error: any) {
      setTestState('error');
      setErrorMessage('Erro ao criar service request de teste: ' + error.message);
    }
  };

  const handleUploadCompleted = () => {
    setTestState('success');
    setTestResult(testResult + '\n✅ Upload de foto concluído com sucesso!');
  };

  const cleanUpTest = async () => {
    if (!testServiceRequestId) return;

    try {
      setIsDeleting(true);
      
      await testManager.cleanup();

      setTestServiceRequestId(null);
      setTestState('ready');
      setTestResult('');
      setErrorMessage('');
    } catch (error: any) {
      setErrorMessage('Erro ao limpar dados de teste: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetTest = () => {
    setTestState('ready');
    setTestResult('');
    setErrorMessage('');
  };

  return (
    <TestErrorBoundary>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Teste de Upload de Fotos</CardTitle>
          <CardDescription>
            Teste end-to-end do sistema de upload de fotos usando novo schema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {testState === 'checking' && (
            <Alert>
              <AlertDescription>
                A verificar prerequisitos do sistema...
              </AlertDescription>
            </Alert>
          )}

          {testState === 'error' && (
            <Alert variant="destructive">
              <AlertDescription>
                {errorMessage}
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={checkPrerequisites}>
                    Verificar Novamente
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {testState === 'ready' && prerequisites.hasBuildings && prerequisites.hasContractors && prerequisites.hasCategories && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  ✅ Sistema pronto para teste de upload
                  <div className="mt-2 text-sm">
                    <strong>Building ID:</strong> {prerequisites.buildingId}<br/>
                    <strong>Contractor ID:</strong> {prerequisites.contractorId}<br/>
                    <strong>Category ID:</strong> {prerequisites.categoryId}
                  </div>
                </AlertDescription>
              </Alert>
              
              <Button onClick={startAutonomousTest} className="w-full">
                Iniciar Teste Autónomo
              </Button>
            </div>
          )}

          {testState === 'uploading' && testServiceRequestId && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  {testResult}
                </AlertDescription>
              </Alert>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Upload de Foto de Teste</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  ✅ Service Request criado com sucesso!
                  ID: {testServiceRequestId}
                </p>
                <Button onClick={handleUploadCompleted} className="w-full">
                  Simular Upload Concluído
                </Button>
              </div>
            </div>
          )}

          {testState === 'success' && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <pre className="whitespace-pre-wrap">{testResult}</pre>
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={cleanUpTest} 
                variant="outline" 
                className="w-full"
                disabled={isDeleting}
              >
                {isDeleting ? 'A limpar...' : 'Limpar Dados e Recomeçar'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </TestErrorBoundary>
  );
}