
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Play } from 'lucide-react';
import { useEndToEndTester } from '@/hooks/useEndToEndTester';
import TestStepItem from './TestStepItem';

export default function EndToEndTester() {
  const {
    isRunning,
    testAssistanceId,
    steps,
    runTests,
    cleanupTest,
  } = useEndToEndTester();

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
            <TestStepItem key={step.id} step={step} index={index} />
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
