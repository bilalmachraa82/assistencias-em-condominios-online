
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database } from 'lucide-react';
import { HealthCheck } from '@/types/healthCheck';
import { getInitialChecks } from './healthChecks/initialChecks';
import { runAllHealthChecks } from './healthChecks/runAllChecks';
import { HealthCheckItem } from './HealthCheckItem';
import { calculateOverallHealth, getStatusColor, getOverallHealthLabel } from '@/utils/healthCheckUtils';

export default function SystemHealthCheck() {
  const [checks, setChecks] = useState<HealthCheck[]>(getInitialChecks());

  useEffect(() => {
    runAllHealthChecks(setChecks);
  }, []);

  const overallHealth = calculateOverallHealth(checks);

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
            onClick={() => runAllHealthChecks(setChecks)}
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
            Estado Geral: {getOverallHealthLabel(overallHealth)}
          </span>
        </div>

        <div className="grid gap-3">
          {checks.map((check, index) => (
            <HealthCheckItem key={index} check={check} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
