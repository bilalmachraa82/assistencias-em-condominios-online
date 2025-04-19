
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';

const Dashboard = () => {
  return (
    <DashboardLayout>
      <DashboardHeader />
      <StatsCards />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Additional dashboard content can go here */}
        </div>
        <ActivityFeed />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
