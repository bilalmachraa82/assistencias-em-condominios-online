
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { Card } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const chartData = [
  { name: 'Jan', total: 32 },
  { name: 'Fev', total: 45 },
  { name: 'Mar', total: 31 },
  { name: 'Abr', total: 28 },
  { name: 'Mai', total: 40 },
  { name: 'Jun', total: 35 },
  { name: 'Jul', total: 55 },
];

const Dashboard = () => {
  return (
    <DashboardLayout>
      <DashboardHeader />
      <StatsCards />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="chart-card">
            <div className="p-6">
              <h2 className="chart-title">Assistências por Mês</h2>
              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9b87f5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#9b87f5" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A3349" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#f8fafc" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#2A3349' }}
                    />
                    <YAxis 
                      stroke="#f8fafc"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#2A3349' }}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(25, 33, 51, 0.8)', 
                        borderColor: '#2A3349',
                        color: '#fff',
                        borderRadius: '0.5rem',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#9b87f5" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#totalGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </div>
        <ActivityFeed />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
