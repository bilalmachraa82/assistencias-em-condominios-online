
import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import RealtimeNotifications from "@/components/dashboard/RealtimeNotifications";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut, isAdmin } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="flex items-center justify-between p-4 border-b border-border/50 bg-glass-bg backdrop-blur-xl shadow-soft">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <RealtimeNotifications />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="font-medium">{user?.email}</span>
                {isAdmin && (
                  <span className="bg-gradient-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium shadow-soft">
                    Admin
                  </span>
                )}
              </div>
              <ThemeToggle />
              <Button 
                variant="glass" 
                size="sm" 
                onClick={signOut}
                className="flex items-center gap-2 font-medium"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </header>
          <div className="flex-1 p-6 bg-transparent">
            <div className="animate-fade-in-up">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
