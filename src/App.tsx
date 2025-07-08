
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

// Supplier public pages
import AcceptRequest from "./pages/supplier/AcceptRequest";
import ScheduleRequest from "./pages/supplier/ScheduleRequest";
import CompleteRequest from "./pages/supplier/CompleteRequest";
import Confirmation from "./pages/supplier/Confirmation";
import Portal from "./pages/supplier/Portal";

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
  // Supplier public routes (no auth required) - Ordered by specificity
  // Routes with parameters (must be first)
  {
    path: "/supplier/portal/:token",
    element: <Portal />,
  },
  {
    path: "/supplier/accept/:token",
    element: <AcceptRequest />,
  },
  {
    path: "/supplier/schedule/:token",
    element: <ScheduleRequest />,
  },
  {
    path: "/supplier/complete/:token",
    element: <CompleteRequest />,
  },
  // Fallback routes without parameters (must be last)
  {
    path: "/supplier/portal",
    element: <Portal />,
  },
  {
    path: "/supplier/complete",
    element: <CompleteRequest />,
  },
  {
    path: "/supplier/accept", 
    element: <AcceptRequest />,
  },
  {
    path: "/supplier/schedule",
    element: <ScheduleRequest />,
  },
  {
    path: "/supplier/confirmation/:type",
    element: <Confirmation />,
  },
  // Catch-all route for 404 pages
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default function App() {
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
