
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg overflow-hidden p-6">
        <div className="flex items-center justify-center mb-6">
          <AlertCircle className="h-12 w-12 text-red-500 mr-4" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">404</h1>
            <p className="text-lg text-gray-600">Página não encontrada</p>
          </div>
        </div>
        
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">
            O endereço <code className="bg-red-100 px-1 py-0.5 rounded">{location.pathname}</code> não existe ou não está disponível.
          </p>
        </div>
        
        <p className="text-gray-600 mb-6">
          Verifique se o link que você seguiu está correto ou navegue para uma das nossas páginas principais.
        </p>
        
        {/* Special diagnostic for /access route */}
        {location.pathname === '/access' && (
          <div className="mb-4 bg-blue-50 border-l-4 border-blue-400 p-4">
            <p className="text-sm text-blue-700 mb-2">
              Problema específico com a rota <code>/access</code>? Execute o diagnóstico:
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/diagnostic" className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Executar Diagnóstico SPA
              </Link>
            </Button>
          </div>
        )}
        
        <div className="flex justify-center gap-2">
          <Button asChild variant="default">
            <Link to="/" className="flex items-center">
              <Home className="h-4 w-4 mr-2" />
              Voltar para o Início
            </Link>
          </Button>
          
          <Button asChild variant="outline">
            <Link to="/diagnostic" className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Diagnóstico
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
