
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
import { Sparkles, Home, Building2, CalendarDays, Image, Settings, User, LogOut, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: Building2, label: 'Edifícios', href: '/buildings' },
  { icon: CalendarDays, label: 'Assistências', href: '/assistencias' },
  { icon: Image, label: 'Fotos', href: '/fotos' },
  { icon: Bot, label: 'Sugestões da IA', href: '/ai-suggestions' },
  { icon: Settings, label: 'Configurações', href: '/configuracoes' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="glass-sidebar">
          <SidebarHeader className="py-6">
            <div className="text-3xl font-bold mb-10 tracking-tight flex items-center gap-2">
              <Sparkles className="text-[#38bdf8]" size={24} />
              ASSISTECH
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton asChild>
                        <Link 
                          to={item.href} 
                          className="hover:text-[#38bdf8] transition-colors cursor-pointer flex items-center gap-2 text-lg"
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="text-sm text-[#ef4444] cursor-pointer hover:underline">
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link 
                  to="/logout" 
                  className="flex items-center gap-2 text-lg"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sair</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 p-8 overflow-hidden">
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
