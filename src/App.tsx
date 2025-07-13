
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useToast } from "@/hooks/use-toast";
import { Toaster as Sonner } from "sonner";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ThemeProvider } from "@/components/ui/theme-provider";

import "./index.css";
import Dashboard from "./pages/Dashboard";
import Buildings from "./pages/Buildings";
import Suppliers from "./pages/Suppliers";
import Assistencias from "./pages/Assistencias";
import ConfiguracaoServicos from "./pages/ConfiguracaoServicos";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

// Access Portal
import AccessPortal from "./pages/AccessPortal";
import Confirmation from "./pages/supplier/Confirmation";

// Health & Diagnostic Tools
import HealthCheck from "./pages/HealthCheck";
import SPARoutingDiagnostic from "./components/testing/SPARoutingDiagnostic";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/",
    element: <AuthGuard><Dashboard /></AuthGuard>,
  },
  {
    path: "/assistencias",
    element: <AuthGuard><Assistencias /></AuthGuard>,
  },
  {
    path: "/buildings",
    element: <AuthGuard><Buildings /></AuthGuard>,
  },
  {
    path: "/suppliers",
    element: <AuthGuard><Suppliers /></AuthGuard>,
  },
  {
    path: "/configuracao-servicos",
    element: <AuthGuard><ConfiguracaoServicos /></AuthGuard>,
  },
  // ✨ MAGIC ACCESS SYSTEM: Clean and Simple (Industry Standard)
  {
    path: "/access",
    element: <AccessPortal />,
  },
  // 🏥 HEALTH CHECK: System status monitoring
  {
    path: "/health",
    element: <HealthCheck />,
  },
  // 🔧 DIAGNOSTIC SYSTEM: For troubleshooting routing issues
  {
    path: "/diagnostic",
    element: <SPARoutingDiagnostic />,
  },
  // Catch-all route for 404 pages
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default function App() {
  // Enhanced SPA routing debug with deployment verification
  console.log('🎯 App initialized - SPA routing active');
  console.log('🛣️ Current location:', window.location.pathname);
  console.log('🌐 Base URL:', window.location.origin);
  console.log('🔍 Available routes:', ['/auth', '/', '/assistencias', '/buildings', '/suppliers', '/configuracao-servicos', '/access', '/health', '/diagnostic']);
  console.log('📅 Build timestamp:', new Date().toISOString());
  
  // Route verification check
  const currentPath = window.location.pathname;
  const knownRoutes = ['/auth', '/', '/assistencias', '/buildings', '/suppliers', '/configuracao-servicos', '/access', '/health', '/diagnostic'];
  const isKnownRoute = knownRoutes.some(route => currentPath === route || currentPath.startsWith(route));
  
  console.log('✅ Route verification:', { 
    currentPath, 
    isKnownRoute, 
    matchedRoute: knownRoutes.find(route => currentPath === route || currentPath.startsWith(route)) 
  });
  
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          
          <Sonner />
          <ReactQueryDevtools initialIsOpen={false} />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
