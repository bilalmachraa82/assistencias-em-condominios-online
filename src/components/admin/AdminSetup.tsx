import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

export default function AdminSetup() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Por favor, insira um email');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_admin_user', {
        admin_email: email
      });

      if (error) {
        toast.error(`Erro: ${error.message}`);
        return;
      }

      toast.success(data || 'Utilizador admin criado com sucesso!');
      setEmail('');
    } catch (err: any) {
      toast.error(`Erro inesperado: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Configurar Administrador</CardTitle>
        <CardDescription>
          Criar primeiro utilizador administrador do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email do Administrador</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'A processar...' : 'Criar Administrador'}
          </Button>
        </form>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> O utilizador deve estar registado no sistema antes de poder ser promovido a administrador.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}