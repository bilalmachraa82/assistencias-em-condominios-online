
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { TestTube, FileCheck, FileX, Info, Loader2 } from "lucide-react";
import AssistancePhotoUploader from "@/components/assistance/sections/AssistancePhotoUploader";
import { supabase } from '@/integrations/supabase/client';

// Para fins de teste, iremos usar uma assistência específica.
// Certifique-se de que uma assistência com este ID existe na sua base de dados.
const TEST_ASSISTANCE_ID = 1;
const TEST_CATEGORY = "teste";

export default function PhotoUploadTester() {
  const [testState, setTestState] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [assistanceExists, setAssistanceExists] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAssistance() {
      const { data, error } = await supabase
        .from('assistances')
        .select('id')
        .eq('id', TEST_ASSISTANCE_ID)
        .maybeSingle();

      if (error) {
        setTestState('error');
        setTestResult(`Erro ao verificar a assistência: ${error.message}`);
        setAssistanceExists(false);
      } else {
        setAssistanceExists(!!data);
      }
    }
    checkAssistance();
  }, []);

  const handleUploadCompleted = () => {
    setTestState('success');
    setTestResult(`Foto carregada com sucesso para a assistência #${TEST_ASSISTANCE_ID} na categoria '${TEST_CATEGORY}'. Verifique a galeria.`);
  };

  const resetTest = () => {
    setTestState('idle');
    setTestResult(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Teste de Upload de Fotos
        </CardTitle>
        <CardDescription>
          Verifica o fluxo completo de upload de uma foto para o bucket de armazenamento e o registo na base de dados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Pré-requisito</AlertTitle>
          <AlertDescription>
            Este teste requer que uma assistência com o ID <strong>{TEST_ASSISTANCE_ID}</strong> exista na base de dados.
            {assistanceExists === null && <span className="flex items-center gap-2"> <Loader2 className="h-4 w-4 animate-spin"/> A verificar...</span>}
            {assistanceExists === false && <span className="text-red-600 font-bold"> A assistência de teste não foi encontrada! Crie-a para continuar.</span>}
            {assistanceExists === true && <span className="text-green-600 font-bold"> A assistência de teste foi encontrada. Pode prosseguir.</span>}
          </AlertDescription>
        </Alert>

        {testState === 'success' && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <FileCheck className="h-4 w-4 text-green-700" />
            <AlertTitle className="text-green-800">Teste Concluído com Sucesso!</AlertTitle>
            <AlertDescription className="text-green-700">
              {testResult}
            </AlertDescription>
          </Alert>
        )}

        {testState === 'error' && (
          <Alert variant="destructive">
            <FileX className="h-4 w-4" />
            <AlertTitle>Erro no Teste</AlertTitle>
            <AlertDescription>
              {testResult}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg min-h-[150px]">
          {assistanceExists === null && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}

          {assistanceExists && (testState === 'idle' || testState === 'running') && (
            <>
              <p className="mb-4 text-sm text-muted-foreground">Clique abaixo para selecionar uma foto e iniciar o teste.</p>
              <AssistancePhotoUploader
                assistanceId={TEST_ASSISTANCE_ID}
                category={TEST_CATEGORY}
                onUploadCompleted={handleUploadCompleted}
              />
            </>
          )}

          {assistanceExists && (testState === 'success' || testState === 'error') &&(
             <Button onClick={resetTest} variant="outline">Executar Novo Teste</Button>
          )}

           {assistanceExists === false && (
             <p className="text-red-600 text-center">Por favor, crie uma assistência com o ID {TEST_ASSISTANCE_ID} e recarregue a página para poder executar o teste.</p>
           )}
        </div>
      </CardContent>
    </Card>
  );
}
