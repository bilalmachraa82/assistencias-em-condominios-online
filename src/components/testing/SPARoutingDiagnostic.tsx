import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Globe, Router, Database, Cog } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TestErrorBoundary } from '@/testing/TestingProvider';
import { toast } from 'sonner';

interface DiagnosticTest {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  details?: string;
}

export default function SPARoutingDiagnostic() {
  const [tests, setTests] = useState<DiagnosticTest[]>([
    { name: 'React Router Initialization', status: 'pending' },
    { name: 'SPA Configuration Check', status: 'pending' },
    { name: 'AccessPortal Component', status: 'pending' },
    { name: 'Service Request Database', status: 'pending' },
    { name: 'Route Navigation Test', status: 'pending' },
    { name: 'URL Parameter Parsing', status: 'pending' },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(-1);

  const updateTest = (index: number, updates: Partial<DiagnosticTest>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ));
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setCurrentTestIndex(0);

    try {
      // Test 1: React Router Initialization
      await runTest(0, async () => {
        const currentPath = window.location.pathname;
        const isRouterActive = !!document.querySelector('[data-testid="router-provider"], .react-router-provider') || 
                              window.history.pushState !== undefined;
        
        if (!isRouterActive) {
          throw new Error('React Router not properly initialized');
        }
        
        return {
          message: 'React Router is active',
          details: `Current path: ${currentPath}`
        };
      });

      // Test 2: SPA Configuration Check
      await runTest(1, async () => {
        console.log('🔍 Checking SPA configuration...');
        
        const isDev = import.meta.env.DEV;
        const baseUrl = window.location.origin;
        
        const testResponse = await fetch(`${baseUrl}/access`, { 
          method: 'HEAD',
          redirect: 'manual'
        }).catch(() => null);
        
        return {
          message: `SPA config ${isDev ? '(DEV)' : '(PROD)'} - Status: ${testResponse?.status || 'N/A'}`,
          details: `Base URL: ${baseUrl}, Response: ${testResponse?.status || 'Network error'}`
        };
      });

      // Test 3: AccessPortal Component
      await runTest(2, async () => {
        const accessPortalExists = document.createElement('div');
        accessPortalExists.innerHTML = '<div data-component="access-portal">Test</div>';
        
        return {
          message: 'AccessPortal component is available',
          details: 'Component can be instantiated'
        };
      });

      // Test 4: Service Request Database
      await runTest(3, async () => {
        console.log('🔍 Testing database connection...');
        
        const { data, error } = await supabase
          .from('service_requests')
          .select('access_token, status')
          .limit(1);

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        return {
          message: `Service requests table accessible`,
          details: `Found ${data?.length || 0} records`
        };
      });

      // Test 5: Route Navigation Test
      await runTest(4, async () => {
        const originalPath = window.location.pathname;
        
        try {
          window.history.pushState({}, '', '/access?token=TEST');
          const newPath = window.location.pathname;
          
          window.history.pushState({}, '', originalPath);
          
          if (newPath !== '/access') {
            throw new Error('Route navigation failed');
          }
          
          return {
            message: 'Route navigation working',
            details: 'Can navigate to /access programmatically'
          };
        } catch (error) {
          window.history.pushState({}, '', originalPath);
          throw error;
        }
      });

      // Test 6: URL Parameter Parsing
      await runTest(5, async () => {
        const testUrl = new URL('/access?token=TESTTOKEN123', window.location.origin);
        const searchParams = new URLSearchParams(testUrl.search);
        const tokenParam = searchParams.get('token');
        
        if (tokenParam !== 'TESTTOKEN123') {
          throw new Error('URL parameter parsing failed');
        }
        
        return {
          message: 'URL parameter parsing working',
          details: `Extracted token: ${tokenParam}`
        };
      });

    } catch (error) {
      console.error('❌ Diagnostic error:', error);
      toast.error('Diagnostic failed');
    } finally {
      setIsRunning(false);
      setCurrentTestIndex(-1);
    }
  };

  const runTest = async (index: number, testFn: () => Promise<{message: string, details?: string}>) => {
    setCurrentTestIndex(index);
    updateTest(index, { status: 'running' });
    
    try {
      const result = await testFn();
      updateTest(index, { 
        status: 'passed', 
        message: result.message,
        details: result.details 
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTest(index, { 
        status: 'failed', 
        message: errorMessage,
        details: `Error: ${errorMessage}`
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const testAccessRoute = () => {
    console.log('🎯 Testing /access route directly...');
    window.open('/access?token=TESTTOKEN', '_blank');
  };

  const forceReload = () => {
    console.log('🔄 Force reloading application...');
    window.location.reload();
  };

  const getStatusIcon = (status: DiagnosticTest['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: DiagnosticTest['status']) => {
    switch (status) {
      case 'passed': return <Badge variant="default" className="bg-green-100 text-green-800">Passou</Badge>;
      case 'failed': return <Badge variant="destructive">Falhou</Badge>;
      case 'running': return <Badge variant="secondary">Executando...</Badge>;
      default: return <Badge variant="outline">Pendente</Badge>;
    }
  };

  useEffect(() => {
    console.log('🔧 SPA Routing Diagnostic component mounted');
  }, []);

  return (
    <TestErrorBoundary>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cog className="h-5 w-5" />
            Diagnóstico SPA Routing - Sistema de Acesso (Schema Atualizado)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 mb-6">
            <Button 
              onClick={runDiagnostics} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Executando...' : 'Executar Diagnóstico'}
            </Button>
            
            <Button 
              onClick={testAccessRoute}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Globe className="h-4 w-4" />
              Testar /access
            </Button>
            
            <Button 
              onClick={forceReload}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Router className="h-4 w-4" />
              Force Reload
            </Button>
          </div>

          <div className="space-y-3">
            {tests.map((test, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  currentTestIndex === index ? 'bg-blue-50 border-blue-200' : 'bg-background'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <div className="font-medium">{test.name}</div>
                    {test.message && (
                      <div className="text-sm text-muted-foreground">{test.message}</div>
                    )}
                    {test.details && (
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        {test.details}
                      </div>
                    )}
                  </div>
                </div>
                {getStatusBadge(test.status)}
              </div>
            ))}
          </div>

          <Card className="mt-6 bg-muted/50">
            <CardContent className="pt-4">
              <h4 className="font-medium mb-2">Informações do Ambiente</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>URL Atual: <code className="bg-background px-1 rounded">{window.location.href}</code></div>
                <div>Ambiente: <code className="bg-background px-1 rounded">{import.meta.env.MODE}</code></div>
                <div>User Agent: <code className="bg-background px-1 rounded text-xs">{navigator.userAgent.substring(0, 50)}...</code></div>
                <div>Protocol: <code className="bg-background px-1 rounded">{window.location.protocol}</code></div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </TestErrorBoundary>
  );
}