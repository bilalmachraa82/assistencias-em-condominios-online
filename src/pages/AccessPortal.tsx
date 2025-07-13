import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Check, Clock, Building, User, Phone, Mail, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeProvider } from '@/components/ui/theme-provider';
import AccessActions from '@/components/access/AccessActions';
import AccessMessages from '@/components/access/AccessMessages';
import AccessPhotos from '@/components/access/AccessPhotos';

interface AssistanceData {
  id: number;
  type: string;
  description: string;
  status: string;
  admin_notes?: string;
  scheduled_datetime?: string;
  created_at: string;
  building: {
    name: string;
    address: string;
  };
  supplier: {
    name: string;
    email: string;
  };
  intervention_type?: {
    name: string;
  };
  tokens: {
    interaction: string;
    acceptance?: string;
    scheduling?: string;
    validation?: string;
  };
}

export default function AccessPortal() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assistance, setAssistance] = useState<AssistanceData | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isDark, setIsDark] = useState(false);

  // Theme toggle
  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  // Enhanced debugging for routing issues
  console.log('🎯 AccessPortal mounted');
  console.log('📍 Current location:', window.location.href);
  console.log('🔑 Magic code from URL:', code);
  console.log('🛠️ Search params:', searchParams.toString());

  useEffect(() => {
    if (!code) {
      setError('Código de acesso não fornecido na URL');
      setLoading(false);
      return;
    }

    validateMagicCode();
  }, [code, refreshTrigger]);

  const validateMagicCode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Validating magic code:', code);
      
      const { data, error } = await supabase
        .rpc('validate_magic_code', { input_code: code });
      
      if (error) {
        console.error('❌ Error validating code:', error);
        throw error;
      }
      
      console.log('✅ Magic code validation result:', data);
      
      // Type-safe parsing of JSON response
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (!result.success) {
        setError(result.error || 'Código de acesso inválido');
        return;
      }
      
      setAssistance(result.data);
      toast.success('Acesso autorizado');
      
    } catch (err) {
      console.error('❌ Error in validateMagicCode:', err);
      setError('Erro ao validar código de acesso');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
          <Card className="glass-card animate-pulse">
            <CardContent className="p-8">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-center">
                  <p className="font-medium text-foreground">Validando acesso...</p>
                  <p className="text-sm text-muted-foreground mt-1">A verificar o código de acesso</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
          <Card className="w-full max-w-md glass-card">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Negado</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={() => window.history.back()}
                  className="w-full"
                >
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ThemeProvider>
    );
  }

  if (!assistance) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
          <Card className="w-full max-w-md glass-card">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Nenhuma Assistência</h2>
                <p className="text-muted-foreground">Não foi encontrada nenhuma assistência com este código</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="min-h-screen bg-gradient-subtle">
        {/* Theme Toggle */}
        <div className="fixed top-4 right-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="glass-card hover-glow"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Enhanced Header */}
          <Card className="mb-8 glass-card animate-fade-in">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-primary rounded-lg">
                    <Building className="h-5 w-5 text-primary-foreground" />
                  </div>
                  Assistência #{assistance.id}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={assistance.status === 'Pendente Resposta Inicial' ? 'destructive' : 'default'}
                    className="px-3 py-1 font-medium"
                  >
                    {assistance.status}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {new Date(assistance.created_at).toLocaleDateString('pt-PT')}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-subtle rounded-lg border">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary" />
                      Prédio
                    </h3>
                    <p className="font-medium text-foreground">{assistance.building.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{assistance.building.address}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-subtle rounded-lg border">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Fornecedor
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{assistance.supplier.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{assistance.supplier.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gradient-subtle rounded-lg border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  Descrição do Problema
                </h3>
                <p className="text-foreground leading-relaxed">{assistance.description}</p>
                {assistance.admin_notes && (
                  <div className="mt-3 p-3 bg-muted rounded border-l-4 border-primary">
                    <p className="text-sm font-medium text-muted-foreground">Notas do Administrador:</p>
                    <p className="text-sm mt-1">{assistance.admin_notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
        </Card>

          {/* Enhanced Main Content */}
          <div className="grid gap-8">
            <div className="animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <AccessActions 
                assistance={assistance} 
                onUpdate={refreshData}
              />
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                <AccessMessages 
                  assistanceId={assistance.id}
                  onUpdate={refreshData}
                />
              </div>
              
              <div className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                <AccessPhotos 
                  assistanceId={assistance.id}
                  onUpdate={refreshData}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}