
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Clock, Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { TestStep } from '@/hooks/useEndToEndTester';

interface TestStepItemProps {
  step: TestStep;
  index: number;
}

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

const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL copiada para clipboard!');
};

export default function TestStepItem({ step, index }: TestStepItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border">
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
  );
}
