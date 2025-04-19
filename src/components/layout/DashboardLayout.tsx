
import React from 'react';
import { Link, useLocation } from "react-router-dom";
import { 
  Sparkles, 
  LogOut, 
  Building2, 
  CircuitBoard, 
  Image as ImageIcon, 
  Bot, 
  Settings 
} from "lucide-react";
import { 
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";

const menuItems = [
  { icon: Building2, label: 'Edifícios', href: '/buildings' },
  { icon: CircuitBoard, label: 'Assistências', href: '/assistencias' },
  { icon: ImageIcon, label: 'Fotos', href: '/fotos' },
  { icon: Bot, label: 'AI Sugestões', href: '/ai-suggestions' },
  { icon: Settings, label: 'Configurações', href: '/configuracoes' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#1A1F2C]">
        <Sidebar className="border-r border-white/10">
          <SidebarContent>
            <div className="px-3 py-4">
              <div className="flex items-center gap-2 text-white text-xl font-bold mb-6">
                <Sparkles className="text-[#1EAEDB]" size={24} />
                ASSISTECH
              </div>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild>
                      <Link 
                        to={item.href}
                        className={`text-gray-300 hover:text-white transition-colors ${location.pathname === item.href ? 'text-white bg-white/10' : ''}`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>
          </SidebarContent>
        </Sidebar>

        <Sidebar className="border-r border-white/10">
          <SidebarContent>
            <div className="p-4">
              <div className="text-white/80 text-sm font-medium mb-4">
                Detalhes
              </div>
              {/* Second sidebar content will be dynamic based on the current route */}
              <div className="text-white/60 text-xs">
                {location.pathname === '/buildings' && 'Informações de edifícios e propriedades'}
                {location.pathname === '/assistencias' && 'Gestão de assistências técnicas'}
                {location.pathname === '/fotos' && 'Galeria de imagens de manutenção'}
                {location.pathname === '/ai-suggestions' && 'Sugestões de melhorias com IA'}
                {location.pathname === '/configuracoes' && 'Configurações do sistema'}
              </div>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 p-8 overflow-auto">
          <div className="container mx-auto max-w-6xl">
            <div className="flex justify-end mb-8">
              <button className="h-9 px-3 glass text-white/80 hover:text-white hover:bg-white/10 rounded-md flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>Técnico</span>
              </button>
            </div>
            <div className="text-white">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
