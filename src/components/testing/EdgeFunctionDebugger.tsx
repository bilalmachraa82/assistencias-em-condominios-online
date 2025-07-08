import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface TestResult {
  status: 'pending' | 'success' | 'error';
  response?: any;
  error?: string;
  statusCode?: number;
}

export default function EdgeFunctionDebugger() {
  const [token, setToken] = useState('acc-rmsdRM9AKdmuZMxkbG2xMH-IOujr9-pqRarc-bapbaOrv-rgxGLcBHOh');
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [isLoading, setIsLoading] = useState(false);

  const testEdgeFunction = async (action: string, testToken: string) => {
    const testKey = `${action}-${testToken.substring(0, 8)}`;
    
    setResults(prev => ({
      ...prev,
      [testKey]: { status: 'pending' }
    }));

    try {
      console.log(`🔍 Testing edge function: action=${action}, token=${testToken.substring(0, 10)}...`);
      
      const url = `https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/supplier-route?action=${action}&token=${testToken}`;
      console.log('📤 Request URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log(`📨 Response status: ${response.status}`);
      
      const responseText = await response.text();
      console.log('📝 Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ JSON parse error:', e);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      setResults(prev => ({
        ...prev,
        [testKey]: {
          status: response.ok && data.success ? 'success' : 'error',
          response: data,
          statusCode: response.status,
          error: !response.ok ? `HTTP ${response.status}: ${data.error}` : data.error
        }
      }));

    } catch (error: any) {
      console.error(`❌ Error testing ${action}:`, error);
      setResults(prev => ({
        ...prev,
        [testKey]: {
          status: 'error',
          error: error.message,
          statusCode: 0
        }
      }));
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setResults({});

    try {
      // Test with each action
      await Promise.all([
        testEdgeFunction('view', token),
        testEdgeFunction('accept', token),
        testEdgeFunction('schedule', token),
        testEdgeFunction('validate', token)
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Debug Edge Function</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Token para testar"
            className="flex-1"
          />
          <Button
            onClick={runAllTests}
            disabled={isLoading || !token}
          >
            {isLoading ? 'Testando...' : 'Testar Edge Function'}
          </Button>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Token Length:</strong> {token.length} chars
            <br />
            <strong>Valid Format:</strong> {token.length >= 20 ? '✅' : '❌ (needs ≥20 chars)'}
          </AlertDescription>
        </Alert>

        {Object.entries(results).length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Resultados dos Testes:</h3>
            {Object.entries(results).map(([key, result]) => (
              <div key={key} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(result.status)}
                  <span className="font-medium">{key}</span>
                  <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                    {result.statusCode || 'N/A'}
                  </Badge>
                </div>
                
                {result.error && (
                  <div className="text-red-600 text-sm mb-2">
                    <strong>Erro:</strong> {result.error}
                  </div>
                )}
                
                {result.response && (
                  <div className="text-sm">
                    <strong>Response:</strong>
                    <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(result.response, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}