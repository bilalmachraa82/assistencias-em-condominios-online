import { Card } from "@/components/ui/card"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { 
  ChartContainer, 
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";

const mockWeekData = [
  { name: 'Seg', assist: 9 },
  { name: 'Ter', assist: 11 },
  { name: 'Qua', assist: 12 },
  { name: 'Qui', assist: 14 },
  { name: 'Sex', assist: 13 },
];

const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

export function StatsCards() {
  const { data: stats, loading: isLoadingStats } = useDashboardData();

  if (isLoadingStats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="chart-card">
            <div className="p-6 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const pieData = [
    { name: 'Normal', value: 12 },
    { name: 'Urgente', value: 5 },
    { name: 'Emergência', value: 3 }
  ];

  const weeklyChartData = mockWeekData;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      <Card className="chart-card relative overflow-hidden">
        <div className="p-6">
          <h2 className="chart-title">Assistências Ativas</h2>
          <p className="chart-value text-success">{stats?.totalAssistances || 0}</p>
          <div className="chart-metric mt-1 chart-metric-up">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>Sistema em funcionamento</span>
          </div>
          <div className="absolute right-2 top-2 opacity-50 text-xs text-muted-foreground">Tempo real</div>
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={weeklyChartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <Line type="monotone" dataKey="assist" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      <Card className="chart-card bg-gradient-to-br from-purple-500/10 to-blue-500/10">
        <div className="p-6">
          <h2 className="chart-title">Assistências Hoje</h2>
          <p className="chart-value">{stats?.totalAssistances || 0}</p>
          <div className="chart-metric">
            <span>Novas solicitações</span>
          </div>
          <div className="absolute right-2 top-2 opacity-50 text-xs text-muted-foreground">Hoje</div>
        </div>
      </Card>
      
      <Card className="chart-card bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
        <div className="p-6">
          <h2 className="chart-title">Total de Edifícios</h2>
          <p className="chart-value">{stats?.totalAssistances || 0}</p>
          <div className="chart-metric chart-metric-up">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>Em gestão</span>
          </div>
          <div className="absolute right-2 top-2 opacity-50 text-xs text-muted-foreground">Sistema</div>
        </div>
      </Card>

      <Card className="chart-card row-span-2">
        <div className="p-6">
          <h2 className="chart-title">Distribuição de Urgências</h2>
          <div className="h-56 flex items-center justify-center">
            <ChartContainer 
              config={{
                normal: { color: "#22c55e" },
                urgent: { color: "#f59e0b" },
                emergency: { color: "#ef4444" }
              }}
            >
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip></ChartTooltip>
              </PieChart>
            </ChartContainer>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="text-success text-sm">
              <div className="font-bold">Normal</div>
              <div>{pieData[0].value}</div>
            </div>
            <div className="text-amber-500 text-sm">
              <div className="font-bold">Urgente</div>
              <div>{pieData[1].value}</div>
            </div>
            <div className="text-red-500 text-sm">
              <div className="font-bold">Emergência</div>
              <div>{pieData[2].value}</div>
            </div>
          </div>
        </div>
      </Card>
      
      <Card className="chart-card">
        <div className="p-6">
          <h2 className="chart-title">Total de Fornecedores</h2>
          <p className="chart-value text-primary">{stats?.totalAssistances || 0}</p>
          <div className="chart-metric chart-metric-up">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>Parceiros ativos</span>
          </div>
        </div>
      </Card>

      <Card className="chart-card">
        <div className="p-6">
          <h2 className="chart-title">Total Geral</h2>
          <p className="chart-value text-amber-500">{stats?.totalAssistances || 0}</p>
          <div className="chart-metric mt-1">
            <span>Assistências registadas</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
