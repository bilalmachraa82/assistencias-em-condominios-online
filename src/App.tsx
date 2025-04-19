
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Index from "./pages/Index";
import Buildings from "./pages/Buildings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout><Index /></DashboardLayout>} />
          <Route path="/buildings" element={<DashboardLayout><Buildings /></DashboardLayout>} />
          <Route path="/assistencias" element={<DashboardLayout><div>Assistências Page</div></DashboardLayout>} />
          <Route path="/fotos" element={<DashboardLayout><div>Fotos Page</div></DashboardLayout>} />
          <Route path="/ai-suggestions" element={<DashboardLayout><div>AI Suggestions Page</div></DashboardLayout>} />
          <Route path="/configuracoes" element={<DashboardLayout><div>Configurações Page</div></DashboardLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
