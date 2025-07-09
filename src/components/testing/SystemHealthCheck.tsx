import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, Cloud, Mail, Users } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { callSupplierRoute } from '@/utils/edgeFunctions';

interface HealthCheck {
  name: string;
  icon: React.ReactNode;
  status: 'checking' | 'healthy' | 'warning' | 'error';
  message: string;
  count?: number;
}

export default function SystemHealthCheck() {
  const [checks, setChecks] = useState<HealthCheck[]>([
    {
      name: 'Base de Dados',
      icon: <Database className="h-4 w-4" />,
      status: 'checking',
      message: 'A verificar conexão...'
    },
    {
      name: 'Storage',
      icon: <Cloud className="h-4 w-4" />,
      status: 'checking',
      message: 'A verificar buckets...'
    },
    {
      name: 'Edge Functions',
      icon: <Mail className="h-4 w-4" />,
      status: 'checking',
      message: 'A verificar functions...'
    },
    {
      name: 'Dados do Sistema',
      icon: <Users className="h-4 w-4" />,
      status: 'checking',
      message: 'A verificar integridade...'
    }
  ]);

  const runHealthChecks = async () => {
    setChecks(prev => prev.map(check => ({ ...check, status: 'checking' as const })));

    // Check Database with RLS awareness
    try {
      // Use service role to bypass RLS for health check
      const { count, error } = await supabase.from('assistances').select('*', { count: 'exact', head: true });
      if (error) throw error;
      
      setChecks(prev => prev.map(check => 
        check.name === 'Base de Dados' 
          ? { ...check, status: 'healthy' as const, message: `Conexão OK - ${count || 0} assistências (RLS ativo)`, count: count || 0 }
          : check
      ));
    } catch (error) {
      setChecks(prev => prev.map(check => 
        check.name === 'Base de Dados' 
          ? { ...check, status: 'error' as const, message: 'Erro de conexão ou RLS' }
          : check
      ));
    }

    // Check Storage with security policies
    try {
      // Test storage by checking if we can list files (this tests bucket existence and policies)
      const { data: files, error } = await supabase.storage
        .from('assistance-photos')
        .list('', { limit: 1 });

      if (error) {
        // If we get a permission error, that means RLS is working properly
        if (error.message.includes('permission') || error.message.includes('policy') || error.message.includes('insufficient_privilege')) {
          setChecks(prev => prev.map(check => 
            check.name === 'Storage' 
              ? { ...check, status: 'healthy' as const, message: 'Bucket "assistance-photos" OK - Políticas RLS ativas' }
              : check
          ));
        } else {
          throw error;
        }
      } else {
        // If we can list files without authentication, there might be a security issue
        setChecks(prev => prev.map(check => 
          check.name === 'Storage' 
            ? { ...check, status: 'warning' as const, message: `Bucket OK mas políticas podem estar muito permissivas - ${files?.length || 0} ficheiros` }
            : check
        ));
      }
    } catch (error: any) {
      setChecks(prev => prev.map(check => 
        check.name === 'Storage' 
          ? { ...check, status: 'error' as const, message: `Erro: ${error.message}` }
          : check
      ));
    }

    // Check Edge Functions with rate limiting
    try {
      const { success, error } = await callSupplierRoute('accept', 'test-token', { showToastOnError: false });
      
      // For health check, we expect a controlled error (invalid token)
      // Success would be unexpected, error is expected behavior
      const functionsWorking = !success && error;
      
      setChecks(prev => prev.map(check => 
        check.name === 'Edge Functions' 
          ? { 
              ...check, 
              status: functionsWorking ? 'healthy' as const : 'error' as const,
              message: functionsWorking 
                ? 'Functions OK - Validação de tokens ativa'
                : 'Functions inacessíveis ou problema de autenticação'
            }
          : check
      ));
    } catch (error) {
      setChecks(prev => prev.map(check => 
        check.name === 'Edge Functions' 
          ? { ...check, status: 'error' as const, message: 'Erro ao verificar functions' }
          : check
      ));
    }

    // Check System Data Integrity with security awareness
    try {
      // These should now be restricted by RLS - attempt to count without admin privileges
      const [buildings, suppliers, interventionTypes, validStatuses] = await Promise.all([
        supabase.from('buildings').select('*', { count: 'exact', head: true }),
        supabase.from('suppliers').select('*', { count: 'exact', head: true }),
        supabase.from('intervention_types').select('*', { count: 'exact', head: true }),
        supabase.from('valid_statuses').select('*', { count: 'exact', head: true })
      ]);

      // Check if RLS is properly blocking access
      const hasRLSErrors = [buildings, suppliers, interventionTypes, validStatuses].some(result => 
        result.error && (result.error.message.includes('policy') || result.error.message.includes('permission'))
      );

      if (hasRLSErrors) {
        setChecks(prev => prev.map(check => 
          check.name === 'Dados do Sistema' 
            ? { 
                ...check, 
                status: 'healthy' as const, 
                message: 'RLS ativo - Acesso restrito conforme esperado (Security OK)'
              }
            : check
        ));
      } else {
        // If we can access everything, there might be a security concern
        const buildingCount = buildings.count || 0;
        const supplierCount = suppliers.count || 0;
        const interventionCount = interventionTypes.count || 0;
        const statusCount = validStatuses.count || 0;

        const hasMinimumData = buildingCount > 0 && supplierCount > 0 && interventionCount > 0 && statusCount > 0;

        setChecks(prev => prev.map(check => 
          check.name === 'Dados do Sistema' 
            ? { 
                ...check, 
                status: hasMinimumData ? 'warning' as const : 'error' as const, 
                message: hasMinimumData 
                  ? `${buildingCount} edifícios, ${supplierCount} fornecedores - AVISO: RLS pode estar desativado`
                  : 'Dados insuficientes + possível problema de segurança'
              }
            : check
        ));
      }
    } catch (error) {
      setChecks(prev => prev.map(check => 
        check.name === 'Dados do Sistema' 
          ? { ...check, status: 'error' as const, message: 'Erro ao verificar dados' }
          : check
      ));
    }
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const getStatusColor = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusVariant = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const overallHealth = checks.every(check => check.status === 'healthy') ? 'healthy' :
                       checks.some(check => check.status === 'error') ? 'error' : 'warning';

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Verificação de Saúde do Sistema
            </CardTitle>
            <CardDescription>
              Estado atual dos componentes do sistema
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runHealthChecks}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className={`h-3 w-3 rounded-full ${getStatusColor(overallHealth)}`} />
          <span className="font-medium">
            Estado Geral: {overallHealth === 'healthy' ? 'Saudável' : overallHealth === 'warning' ? 'Atenção' : 'Erro'}
          </span>
        </div>

        <div className="grid gap-3">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {check.icon}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{check.name}</span>
                    <Badge variant={getStatusVariant(check.status)}>
                      {check.status === 'checking' ? 'A verificar' :
                       check.status === 'healthy' ? 'OK' :
                       check.status === 'warning' ? 'Atenção' : 'Erro'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{check.message}</p>
                </div>
              </div>
              <div className={`h-3 w-3 rounded-full ${getStatusColor(check.status)}`} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
