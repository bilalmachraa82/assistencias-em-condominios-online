
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCards } from '@/components/dashboard/StatsCards';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import AssistanceAnalytics from '@/components/analytics/AssistanceAnalytics';
import PerformanceOptimizer from '@/components/performance/PerformanceOptimizer';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DashboardHeader />

        <StatsCards />

        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="activity">Atividade</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="space-y-4">
            <ActivityFeed />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <AssistanceAnalytics />
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-6">
              <PerformanceOptimizer />
            </div>
          </TabsContent>
          
          <TabsContent value="system" className="space-y-4">
            <div className="grid gap-6">
              <div className="text-center py-8 text-muted-foreground">
                Informações do sistema em desenvolvimento...
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
