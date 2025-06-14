
import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import RealtimeNotifications from "@/components/dashboard/RealtimeNotifications";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <RealtimeNotifications />
            </div>
          </header>
          <div className="flex-1 p-6 bg-gray-50">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
