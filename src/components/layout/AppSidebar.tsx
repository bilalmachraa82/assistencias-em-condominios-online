
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { 
  Home, 
  Building2, 
  Users, 
  Wrench,
  Settings 
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';

const navigation = [
  {
    title: "Principal",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: Home,
      },
      {
        title: "Assistências",
        url: "/assistencias",
        icon: Wrench,
      },
    ],
  },
  {
    title: "Gestão",
    items: [
      {
        title: "Edifícios",
        url: "/buildings",
        icon: Building2,
      },
      {
        title: "Fornecedores",
        url: "/suppliers",
        icon: Users,
      },
    ],
  },
  {
    title: "Sistema",
    items: [
      {
        title: "Configuração Serviços",
        url: "/configuracao-servicos",
        icon: Settings,
      },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar className="bg-glass-bg border-r border-glass-border backdrop-blur-xl">
      <SidebarHeader className="border-b border-glass-border px-6 py-6 bg-gradient-subtle">
        <div className="flex items-center gap-3 animate-slide-in-left">
          <Logo size="lg" className="drop-shadow-lg" />
          <div className="h-8 w-px bg-gradient-to-b from-transparent via-border to-transparent opacity-50" />
          <span className="text-sm font-medium text-muted-foreground">Sistema de Gestão</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-transparent">
        {navigation.map((group, groupIndex) => (
          <SidebarGroup key={group.title} className="animate-fade-in-up" style={{ animationDelay: `${groupIndex * 100}ms` }}>
            <SidebarGroupLabel className="text-muted-foreground text-xs font-semibold uppercase tracking-wider px-4 py-4 gradient-text">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item, itemIndex) => (
                  <SidebarMenuItem key={item.title} className="animate-slide-in-left" style={{ animationDelay: `${(groupIndex * 100) + (itemIndex * 50)}ms` }}>
                    <SidebarMenuButton 
                      asChild
                      isActive={location.pathname === item.url}
                      className={`
                        w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 mx-3 my-1 group relative overflow-hidden
                        ${location.pathname === item.url 
                          ? 'bg-gradient-primary text-primary-foreground shadow-colored scale-[1.02]' 
                          : 'text-sidebar-foreground hover:text-sidebar-foreground hover:bg-glass-bg hover:shadow-soft hover:scale-[1.01] hover:backdrop-blur-xl'
                        }
                      `}
                    >
                      <Link to={item.url} className="flex items-center gap-3 relative z-10">
                        <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                          location.pathname === item.url 
                            ? 'bg-white/20 shadow-glow' 
                            : 'bg-transparent group-hover:bg-primary/10'
                        }`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{item.title}</span>
                        {location.pathname === item.url && (
                          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-xl animate-shimmer" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter className="border-t border-glass-border p-6 bg-gradient-subtle">
        <div className="text-xs text-muted-foreground font-medium tracking-wide animate-pulse-soft">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gradient-primary rounded-full animate-bounce-gentle" />
            Sistema de Gestão v2.0
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
