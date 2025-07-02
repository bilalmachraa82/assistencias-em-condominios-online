
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
    <Sidebar className="bg-sidebar border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4 bg-sidebar">
        <div className="flex items-center gap-3">
          <Logo size="md" />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-sidebar">
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-muted-foreground text-xs font-medium uppercase tracking-wider px-3 py-3">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      isActive={location.pathname === item.url}
                      className={`
                        w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 mx-2
                        ${location.pathname === item.url 
                          ? 'bg-primary text-primary-foreground shadow-lg' 
                          : 'text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent'
                        }
                      `}
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border p-4 bg-sidebar">
        <div className="text-xs text-muted-foreground">
          Sistema de Gestão v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
