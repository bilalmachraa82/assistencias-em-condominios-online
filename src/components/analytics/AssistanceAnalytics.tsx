
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AssistanceAnalytics() {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['assistance-analytics'],
    queryFn: async () => {
      // Get status distribution
      const { data: statusData } = await supabase
        .from('assistances')
        .select('status')
        .order('created_at', { ascending: false });

      // Get monthly trends
      const { data: monthlyData } = await supabase
        .from('assistances')
        .select('created_at, status')
        .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString());

      // Get supplier performance
      const { data: supplierData } = await supabase
        .from('assistances')
        .select(`
          supplier_id,
          status,
          suppliers!inner(name)
        `);

      // Process status distribution
      const statusDistribution = statusData?.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Process monthly trends
      const monthlyTrends = monthlyData?.reduce((acc, item) => {
        const month = new Date(item.created_at).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Process supplier performance
      const supplierPerformance = supplierData?.reduce((acc, item) => {
        const supplierName = (item.suppliers as any)?.name || 'Desconhecido';
        if (!acc[supplierName]) {
          acc[supplierName] = { total: 0, completed: 0 };
        }
        acc[supplierName].total++;
        if (item.status === 'Concluída') {
          acc[supplierName].completed++;
        }
        return acc;
      }, {} as Record<string, { total: number; completed: number }>) || {};

      return {
        statusDistribution: Object.entries(statusDistribution).map(([status, count]) => ({
          name: status,
          value: count
        })),
        monthlyTrends: Object.entries(monthlyTrends).map(([month, count]) => ({
          month,
          assistencias: count
        })),
        supplierPerformance: Object.entries(supplierPerformance).map(([name, data]) => ({
          name,
          total: data.total,
          completed: data.completed,
          percentage: Math.round((data.completed / data.total) * 100)
        }))
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A carregar...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalAssistances = analyticsData?.statusDistribution.reduce((sum, item) => sum + item.value, 0) || 0;
  const completedAssistances = analyticsData?.statusDistribution.find(item => item.name === 'Concluída')?.value || 0;
  const pendingAssistances = analyticsData?.statusDistribution.filter(item => 
    item.name.includes('Pendente') || item.name.includes('Agendado')
  ).reduce((sum, item) => sum + item.value, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Assistências</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssistances}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedAssistances}</div>
            <p className="text-xs text-muted-foreground">
              {totalAssistances > 0 ? `${Math.round((completedAssistances / totalAssistances) * 100)}%` : '0%'} do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingAssistances}</div>
            <p className="text-xs text-muted-foreground">
              {totalAssistances > 0 ? `${Math.round((pendingAssistances / totalAssistances) * 100)}%` : '0%'} do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalAssistances > 0 ? `${Math.round((completedAssistances / totalAssistances) * 100)}%` : '0%'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
        </TabsList>
        
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Estados atuais das assistências</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData?.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData?.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Tendências Mensais</CardTitle>
              <CardDescription>Evolução do número de assistências</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData?.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="assistencias" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <CardTitle>Performance dos Fornecedores</CardTitle>
              <CardDescription>Taxa de conclusão por fornecedor</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData?.supplierPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
