
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
  BarChart3,
  Settings 
} from 'lucide-react';

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
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BarChart3 className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold">Assistências</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      isActive={location.pathname === item.url}
                    >
                      <Link to={item.url}>
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
      
      <SidebarFooter className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          Sistema de Gestão v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
