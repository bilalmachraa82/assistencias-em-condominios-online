
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
import { CalendarDays, Home, Settings, ClipboardCheck, Image, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: ClipboardCheck, label: 'Assistências', href: '/assistencias' },
  { icon: CalendarDays, label: 'Agendamentos', href: '/agendamentos' },
  { icon: Image, label: 'Fotos', href: '/fotos' },
  { icon: Settings, label: 'Configurações', href: '/configuracoes' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="glass border-r border-white/10">
          <SidebarHeader className="py-6">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-white/5 text-white flex items-center justify-center mx-auto mb-2 backdrop-blur-sm border border-white/10">
                <span className="font-bold text-xl">A</span>
              </div>
              <h3 className="font-medium text-sm text-white">Assistech</h3>
              <p className="text-xs text-white/60">Gestão de Assistências</p>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-white/50">Menu Principal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <a href={item.href} className="flex items-center gap-3 text-white/80 hover:text-white hover:bg-white/10">
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </a>
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
                      <a href="/perfil" className="flex items-center gap-3 text-white/80 hover:text-white hover:bg-white/10">
                        <User className="h-5 w-5" />
                        <span>Perfil</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Sair">
                      <a href="/logout" className="flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <LogOut className="h-5 w-5" />
                        <span>Sair</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 p-6 overflow-hidden">
          <div className="container mx-auto max-w-6xl">
            <div className="flex justify-between items-center mb-6">
              <SidebarTrigger className="glass text-white/80 hover:text-white" />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-9 px-3 glass text-white/80 hover:text-white hover:bg-white/10">
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
