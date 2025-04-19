
import { Card } from "@/components/ui/card"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

const data = [
  { name: 'Seg', assist: 9 },
  { name: 'Ter', assist: 11 },
  { name: 'Qua', assist: 12 },
  { name: 'Qui', assist: 14 },
  { name: 'Sex', assist: 13 },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      <Card className="glass-card">
        <div className="p-6">
          <h2 className="text-xl font-semibold">Assistências Ativas</h2>
          <p className="text-4xl font-bold text-[#22c55e] mt-2">12</p>
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <Line type="monotone" dataKey="assist" stroke="#22c55e" strokeWidth={2} dot={false} />
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      <Card className="glass-card">
        <div className="p-6">
          <h2 className="text-xl font-semibold">Agendamentos Hoje</h2>
          <p className="text-4xl font-bold text-[#3b82f6] mt-2">5</p>
          <p className="text-sm text-[#cbd5e1]">Próxima em 2h</p>
        </div>
      </Card>
      
      <Card className="glass-card">
        <div className="p-6">
          <h2 className="text-xl font-semibold">Fotos Pendentes</h2>
          <p className="text-4xl font-bold text-[#ef4444] mt-2">3</p>
          <p className="text-sm text-[#cbd5e1]">Mais antiga: 2 dias</p>
        </div>
      </Card>
    </div>
  )
}
