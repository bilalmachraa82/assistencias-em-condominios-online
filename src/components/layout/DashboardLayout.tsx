
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { CalendarDays, Home, Settings, ClipboardCheck, Building2, User, LogOut, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";

// Define menu items with their respective routes and icons
const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Edifícios', href: '/buildings', icon: Building2 },
  { name: 'Fornecedores', href: '/suppliers', icon: Store },
  { name: 'Assistências', href: '/assistencias', icon: CalendarDays },
  { name: 'Configuração de Serviços', href: '/configuracao-servicos', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#fb923c] text-[#f1f5f9]">
        <Sidebar className="glass-sidebar">
          <SidebarHeader className="py-6">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-white/5 text-[#f1f5f9] flex items-center justify-center mx-auto mb-2 backdrop-blur-sm border border-white/5">
                <span className="font-semibold text-xl">A</span>
              </div>
              <h3 className="font-medium text-sm text-[#f1f5f9]">Assistech</h3>
              <p className="text-xs text-[#cbd5e1]">Gestão de Assistências</p>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-[#cbd5e1]/70">Menu Principal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild tooltip={item.name}>
                        <Link 
                          to={item.href} 
                          className={`flex items-center gap-3 ${location.pathname === item.href 
                            ? 'menu-item-active' 
                            : 'menu-item'
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="mt-auto py-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Perfil">
                      <Link to="/perfil" className="menu-item flex items-center gap-3">
                        <User className="h-5 w-5" />
                        <span>Perfil</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Sair">
                      <Link to="/logout" className="menu-item-danger flex items-center gap-3">
                        <LogOut className="h-5 w-5" />
                        <span>Sair</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 p-8 overflow-auto">
          <div className="container mx-auto max-w-6xl">
            <div className="flex justify-between items-center mb-8">
              <SidebarTrigger className="glass text-[#f1f5f9]/80 hover:text-[#f1f5f9]" />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-9 px-3 glass text-[#f1f5f9]/80 hover:text-[#f1f5f9] hover:bg-white/10">
                  <User className="h-4 w-4 mr-2" />
                  <span>Técnico</span>
                </Button>
              </div>
            </div>
            
            <div>
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
