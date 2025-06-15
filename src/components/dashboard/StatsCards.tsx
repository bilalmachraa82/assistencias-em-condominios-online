
import { Card } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { 
  ChartContainer, 
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";

const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

const activeAssistancesChartConfig = {
  assist: {
    label: "Assistências",
    color: "hsl(var(--success))",
  },
} satisfies ChartConfig;

const pieChartConfig = {
  normal: { label: "Normal", color: "#22c55e" },
  urgent: { label: "Urgente", color: "#f59e0b" },
  emergency: { label: "Emergência", color: "#ef4444" },
} satisfies ChartConfig;

export function StatsCards() {
  const { stats, isLoadingStats } = useDashboardData();

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
    { name: 'normal', value: stats?.urgencyDistribution?.normal || 0 },
    { name: 'urgent', value: stats?.urgencyDistribution?.urgent || 0 },
    { name: 'emergency', value: stats?.urgencyDistribution?.emergency || 0 }
  ];

  const weeklyChartData = stats?.weeklyTrend || [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      <Card className="chart-card relative overflow-hidden flex flex-col">
        <div className="p-6 pb-2">
          <h2 className="chart-title">Assistências Ativas</h2>
          <p className="chart-value text-success">{stats?.activeAssistances || 0}</p>
          <div className="chart-metric mt-1 chart-metric-up">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>Sistema em funcionamento</span>
          </div>
          <div className="absolute right-2 top-2 opacity-50 text-xs text-muted-foreground">Tempo real</div>
        </div>
        <div className="flex-1">
          <ChartContainer config={activeAssistancesChartConfig} className="h-full w-full">
            <LineChart
              accessibilityLayer
              data={weeklyChartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis dataKey="name" hide />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" hideLabel />}
              />
              <Line
                dataKey="assist"
                type="monotone"
                stroke="var(--color-assist)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </Card>
      
      <Card className="chart-card bg-gradient-to-br from-purple-500/10 to-blue-500/10">
        <div className="p-6">
          <h2 className="chart-title">Assistências Hoje</h2>
          <p className="chart-value">{stats?.todayAssistances || 0}</p>
          <div className="chart-metric">
            <span>Novas solicitações</span>
          </div>
          <div className="absolute right-2 top-2 opacity-50 text-xs text-muted-foreground">Hoje</div>
        </div>
      </Card>
      
      <Card className="chart-card bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
        <div className="p-6">
          <h2 className="chart-title">Total de Edifícios</h2>
          <p className="chart-value">{stats?.totalBuildings || 0}</p>
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
            <ChartContainer config={pieChartConfig}>
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
                  nameKey="name"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="name" hideIndicator />}
                />
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
          <p className="chart-value text-primary">{stats?.totalSuppliers || 0}</p>
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
