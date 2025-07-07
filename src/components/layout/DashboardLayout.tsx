
import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import RealtimeNotifications from "@/components/dashboard/RealtimeNotifications";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut, isAdmin } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-xl shadow-sm">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <RealtimeNotifications />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
                {isAdmin && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                    Admin
                  </span>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </header>
          <div className="flex-1 p-6 bg-background">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
