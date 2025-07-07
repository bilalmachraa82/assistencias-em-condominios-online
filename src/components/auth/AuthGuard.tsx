import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = true }: AuthGuardProps) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissões de administrador para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}