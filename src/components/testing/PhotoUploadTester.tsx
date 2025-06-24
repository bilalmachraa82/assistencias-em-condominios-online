
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { TestTube, FileCheck, FileX, Info, Loader2, Play, Trash2, CheckCircle2 } from "lucide-react";
import AssistancePhotoUploader from "@/components/assistance/sections/AssistancePhotoUploader";
import { supabase } from '@/integrations/supabase/client';
import { generateToken } from '@/utils/TokenUtils';
import { toast } from 'sonner';
import { VALID_PHOTO_CATEGORIES } from '@/config/photoCategories';
import { validateDeleteAssistanceResult } from '@/types/assistance';

type TestState = 'checking' | 'prereqs_missing' | 'ready' | 'creating_assistance' | 'uploading' | 'success' | 'cleaning' | 'error';

interface TestPrerequisites {
  hasBuildings: boolean;
  hasSuppliers: boolean;
  firstBuilding?: any;
  firstSupplier?: any;
}

export default function PhotoUploadTester() {
  const [testState, setTestState] = useState<TestState>('checking');
  const [prerequisites, setPrerequisites] = useState<TestPrerequisites>({ hasBuildings: false, hasSuppliers: false });
  const [testAssistanceId, setTestAssistanceId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    checkPrerequisites();
  }, []);

  const checkPrerequisites = async () => {
    setTestState('checking');
    try {
      const [buildingsResult, suppliersResult] = await Promise.all([
        supabase.from('buildings').select('id, name').eq('is_active', true).limit(1).maybeSingle(),
        supabase.from('suppliers').select('id, name').eq('is_active', true).limit(1).maybeSingle()
      ]);

      if (buildingsResult.error || suppliersResult.error) {
        throw new Error('Erro ao verificar pré-requisitos');
      }

      const prereqs = {
        hasBuildings: !!buildingsResult.data,
        hasSuppliers: !!suppliersResult.data,
        firstBuilding: buildingsResult.data,
        firstSupplier: suppliersResult.data
      };

      setPrerequisites(prereqs);

      if (prereqs.hasBuildings && prereqs.hasSuppliers) {
        setTestState('ready');
      } else {
        setTestState('prereqs_missing');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro desconhecido ao verificar pré-requisitos');
      setTestState('error');
    }
  };

  const startAutonomousTest = async () => {
    setTestState('creating_assistance');
    setErrorMessage(null);

    try {
      // Generate required tokens
      const interaction_token = generateToken();
      const acceptance_token = generateToken();
      const scheduling_token = generateToken();
      const validation_token = generateToken();

      // Create temporary assistance
      const { data, error } = await supabase
        .from('assistances')
        .insert([{
          building_id: prerequisites.firstBuilding.id,
          supplier_id: prerequisites.firstSupplier.id,
          type: 'Normal', // Corrigido de 'Teste Autónomo' para um tipo válido
          description: 'Assistência temporária criada automaticamente para teste de upload de fotos.',
          status: 'Pendente Resposta Inicial',
          alert_level: 1,
          interaction_token,
          acceptance_token,
          scheduling_token,
          validation_token
        }])
        .select('id')
        .single();

      if (error) throw error;

      setTestAssistanceId(data.id);
      setTestState('uploading');
      toast.success(`Assistência de teste #${data.id} criada! Pode agora fazer upload de fotos para a categoria "Diagnóstico".`);
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro ao criar assistência de teste');
      setTestState('error');
    }
  };

  const handleUploadCompleted = () => {
    setTestState('success');
    setTestResult(`Foto carregada com sucesso! A assistência de teste #${testAssistanceId} contém agora as fotos enviadas na categoria "Diagnóstico".`);
  };

  const cleanUpTest = async () => {
    if (!testAssistanceId) return;
    
    setIsDeleting(true);
    setTestState('cleaning');
    
    try {
      console.log(`🗑️ Starting cleanup for test assistance #${testAssistanceId}`);
      
      const { data: result, error: rpcError } = await supabase
        .rpc('delete_assistance_safely', { p_assistance_id: testAssistanceId });

      if (rpcError) {
        console.error('❌ RPC Error during cleanup:', rpcError);
        toast.error(`Erro ao limpar dados de teste: ${rpcError.message}`);
        setTestState('error');
        setErrorMessage('Falha ao limpar dados de teste');
        return;
      }

      console.log('📋 Cleanup result:', result);
      const validatedResult = validateDeleteAssistanceResult(result);

      if (!validatedResult.success) {
        console.error('❌ Cleanup function returned failure:', validatedResult.error);
        toast.error(validatedResult.error || 'Erro ao limpar dados de teste');
        setTestState('error');
        setErrorMessage('Falha ao limpar dados de teste');
        return;
      }

      console.log(`✅ Test assistance #${testAssistanceId} cleaned up successfully`);
      toast.success('Dados de teste limpos com sucesso!');
      
      setTestAssistanceId(null);
      setTestState('ready');
      setTestResult(null);
      
    } catch (error: any) {
      console.error(`💥 Exception during cleanup:`, error);
      toast.error('Erro inesperado ao limpar dados de teste');
      setTestState('error');
      setErrorMessage('Erro inesperado ao limpar dados de teste');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetTest = () => {
    setTestState('ready');
    setTestResult(null);
    setErrorMessage(null);
    setTestAssistanceId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Teste Autónomo de Upload de Fotos
        </CardTitle>
        <CardDescription>
          Teste completo e autónomo que cria uma assistência temporária, faz upload de fotos para a categoria "Diagnóstico" e limpa todos os dados automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prerequisites Check */}
        {testState === 'checking' && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>A verificar pré-requisitos...</AlertTitle>
            <AlertDescription>
              A verificar se existem edifícios e fornecedores na base de dados.
            </AlertDescription>
          </Alert>
        )}

        {testState === 'prereqs_missing' && (
          <Alert variant="destructive">
            <FileX className="h-4 w-4" />
            <AlertTitle>Pré-requisitos em falta</AlertTitle>
            <AlertDescription>
              Para executar o teste, precisa de ter pelo menos:
              <ul className="list-disc list-inside mt-2">
                {!prerequisites.hasBuildings && <li>Um edifício ativo</li>}
                {!prerequisites.hasSuppliers && <li>Um fornecedor ativo</li>}
              </ul>
              Crie os dados necessários nas respetivas páginas e depois clique em "Verificar Novamente".
            </AlertDescription>
          </Alert>
        )}

        {/* Success State */}
        {testState === 'success' && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-700" />
            <AlertTitle className="text-green-800">Teste Concluído com Sucesso!</AlertTitle>
            <AlertDescription className="text-green-700">
              {testResult}
            </AlertDescription>
          </Alert>
        )}

        {/* Error State */}
        {testState === 'error' && (
          <Alert variant="destructive">
            <FileX className="h-4 w-4" />
            <AlertTitle>Erro no Teste</AlertTitle>
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Info about test setup */}
        {(testState === 'ready' || testState === 'creating_assistance' || testState === 'uploading') && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Configuração do Teste</AlertTitle>
            <AlertDescription>
              Será utilizado o edifício <strong>{prerequisites.firstBuilding?.name}</strong> e o fornecedor <strong>{prerequisites.firstSupplier?.name}</strong> para criar a assistência de teste.
            </AlertDescription>
          </Alert>
        )}

        {/* Test Controls */}
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg min-h-[200px]">
          {testState === 'prereqs_missing' && (
            <Button onClick={checkPrerequisites} variant="outline" className="flex items-center gap-2">
              <Loader2 className="h-4 w-4" />
              Verificar Novamente
            </Button>
          )}

          {testState === 'ready' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Clique no botão abaixo para iniciar o teste autónomo.
              </p>
              <Button onClick={startAutonomousTest} className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Iniciar Teste Autónomo
              </Button>
            </div>
          )}

          {testState === 'creating_assistance' && (
            <div className="text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">A criar assistência de teste...</p>
            </div>
          )}

          {testState === 'uploading' && testAssistanceId && (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Assistência de teste criada! Selecione uma foto para a categoria "Diagnóstico" para testar o upload.
              </p>
              <AssistancePhotoUploader
                assistanceId={testAssistanceId}
                category={VALID_PHOTO_CATEGORIES[0]}
                onUploadCompleted={handleUploadCompleted}
              />
            </div>
          )}

          {testState === 'success' && (
            <div className="text-center space-y-4">
              <Button 
                onClick={cleanUpTest} 
                variant="destructive" 
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {isDeleting ? 'A limpar...' : 'Limpar Dados e Recomeçar'}
              </Button>
            </div>
          )}

          {testState === 'cleaning' && (
            <div className="text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">A limpar dados de teste...</p>
            </div>
          )}

          {testState === 'error' && (
            <Button onClick={resetTest} variant="outline" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
