
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
    <Sidebar className="bg-white border-r border-gray-200">
      <SidebarHeader className="border-b border-gray-200 px-6 py-4 bg-white">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white">
            <BarChart3 className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold text-gray-900">Assistências</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-white">
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-gray-500 text-xs font-medium uppercase tracking-wider px-3 py-2">
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
                        w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors
                        ${location.pathname === item.url 
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
      
      <SidebarFooter className="border-t border-gray-200 p-4 bg-white">
        <div className="text-xs text-gray-500">
          Sistema de Gestão v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
