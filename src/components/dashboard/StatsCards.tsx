
import { Card } from "@/components/ui/card"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { TrendingUp, TrendingDown } from "lucide-react";

const data = [
  { name: 'Seg', assist: 9 },
  { name: 'Ter', assist: 11 },
  { name: 'Qua', assist: 12 },
  { name: 'Qui', assist: 14 },
  { name: 'Sex', assist: 13 },
];

const pieData = [
  { name: 'Normal', value: 65 },
  { name: 'Urgente', value: 20 },
  { name: 'Emergência', value: 15 }
];

const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      <Card className="chart-card relative overflow-hidden">
        <div className="p-6">
          <h2 className="chart-title">Assistências Ativas</h2>
          <p className="chart-value text-[#22c55e]">12</p>
          <div className="chart-metric mt-1 chart-metric-up">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>+8% vs semana passada</span>
          </div>
          <div className="absolute right-2 top-2 opacity-50 text-xs text-white/50">Este mês</div>
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <Line type="monotone" dataKey="assist" stroke="#22c55e" strokeWidth={2} dot={false} />
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: 'none', borderRadius: '0.5rem' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      <Card className="chart-card gradient-purple">
        <div className="p-6">
          <h2 className="chart-title">Agendamentos Hoje</h2>
          <p className="chart-value">5</p>
          <div className="chart-metric">
            <span>Próxima em 2h</span>
          </div>
          <div className="absolute right-2 top-2 opacity-50 text-xs text-white/50">Hoje</div>
        </div>
      </Card>
      
      <Card className="chart-card gradient-blue">
        <div className="p-6">
          <h2 className="chart-title">Fotos Pendentes</h2>
          <p className="chart-value">3</p>
          <div className="chart-metric chart-metric-down">
            <TrendingDown className="h-3 w-3 mr-1" />
            <span>-25% vs semana passada</span>
          </div>
          <div className="absolute right-2 top-2 opacity-50 text-xs text-white/50">Este mês</div>
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
                <ChartTooltip>
                  <ChartTooltipContent />
                </ChartTooltip>
              </PieChart>
            </ChartContainer>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="text-[#22c55e] text-sm">
              <div className="font-bold">Normal</div>
              <div>65%</div>
            </div>
            <div className="text-[#f59e0b] text-sm">
              <div className="font-bold">Urgente</div>
              <div>20%</div>
            </div>
            <div className="text-[#ef4444] text-sm">
              <div className="font-bold">Emergência</div>
              <div>15%</div>
            </div>
          </div>
        </div>
      </Card>
      
      <Card className="chart-card">
        <div className="p-6">
          <h2 className="chart-title">Tempo Médio de Resolução</h2>
          <p className="chart-value text-[#3b82f6]">48h</p>
          <div className="chart-metric chart-metric-up">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>+12% mais rápido</span>
          </div>
        </div>
      </Card>

      <Card className="chart-card">
        <div className="p-6">
          <h2 className="chart-title">Taxa de Aprovação</h2>
          <p className="chart-value text-[#f59e0b]">92%</p>
          <div className="chart-metric mt-1">
            <span>3% acima da meta</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
