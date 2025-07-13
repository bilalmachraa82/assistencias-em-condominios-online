
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
  // Catch-all route for 404 pages
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default function App() {
  // Debug SPA routing
  console.log('🎯 App initialized - SPA routing active');
  
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
