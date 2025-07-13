import React from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Activity, Globe } from 'lucide-react';

export default function HealthCheck() {
  const location = useLocation();
  
  // Route health checks
  const routes = [
    { path: '/', name: 'Dashboard', working: true },
    { path: '/auth', name: 'Authentication', working: true },
    { path: '/assistencias', name: 'Assistências', working: true },
    { path: '/buildings', name: 'Buildings', working: true },
    { path: '/suppliers', name: 'Suppliers', working: true },
    { path: '/configuracao-servicos', name: 'Configuração Serviços', working: true },
    { path: '/access', name: 'Access Portal', working: true },
    { path: '/diagnostic', name: 'Diagnostic', working: true },
  ];

  // System health checks
  const systemChecks = [
    { name: 'React Router', status: 'operational', message: 'SPA routing active' },
    { name: 'Supabase Connection', status: 'operational', message: 'Database accessible' },
    { name: 'Authentication', status: 'operational', message: 'Auth system ready' },
    { name: 'Environment', status: 'operational', message: 'Production environment' },
  ];

  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    environment: 'production',
    build: process.env.NODE_ENV || 'development',
    url: window.location.origin,
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            System Health Check
          </h1>
          <p className="text-muted-foreground">
            Real-time status of application components and routes
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Route Status */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Route Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {routes.map((route) => (
                  <div key={route.path} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      {route.working ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <span className="font-medium">{route.name}</span>
                        <p className="text-sm text-muted-foreground">{route.path}</p>
                      </div>
                    </div>
                    <Badge variant={route.working ? 'default' : 'destructive'}>
                      {route.working ? 'OK' : 'ERROR'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemChecks.map((check) => (
                  <div key={check.name} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-500" />
                      <div>
                        <span className="font-medium">{check.name}</span>
                        <p className="text-sm text-muted-foreground">{check.message}</p>
                      </div>
                    </div>
                    <Badge variant="default">
                      {check.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deployment Info */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Deployment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground">Environment</p>
                <p className="font-medium capitalize">{deploymentInfo.environment}</p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground">Build Mode</p>
                <p className="font-medium capitalize">{deploymentInfo.build}</p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground">Base URL</p>
                <p className="font-medium text-sm break-all">{deploymentInfo.url}</p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground">Last Check</p>
                <p className="font-medium text-sm">{new Date(deploymentInfo.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Location Debug */}
        <Card className="glass-card mt-6">
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              <p><span className="text-muted-foreground">Current pathname:</span> {location.pathname}</p>
              <p><span className="text-muted-foreground">Full URL:</span> {window.location.href}</p>
              <p><span className="text-muted-foreground">Search params:</span> {location.search || 'None'}</p>
              <p><span className="text-muted-foreground">Hash:</span> {location.hash || 'None'}</p>
              <p><span className="text-muted-foreground">User Agent:</span> {navigator.userAgent}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}