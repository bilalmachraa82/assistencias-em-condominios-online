
import { Card } from "@/components/ui/card"

export function ActivityFeed() {
  return (
    <Card className="glass-card">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Atividade Recente</h2>
        <ul className="space-y-4 text-base">
          <li className="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center">
            <span>
              🔔 Nova assistência criada – <span className="text-[#9b87f5] font-medium">#1234</span>{" "}
              (Ar Condicionado)
            </span>
            <span className="text-[#cbd5e1] text-sm">Agora</span>
          </li>
          <li className="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center">
            <span>
              ✅ Agendamento confirmado – <span className="text-[#9b87f5] font-medium">Cliente ABC</span>{" "}
              às 14:30
            </span>
            <span className="text-[#cbd5e1] text-sm">2h atrás</span>
          </li>
          <li className="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center">
            <span>
              📷 Fotos carregadas – <span className="text-[#9b87f5] font-medium">#1230</span> (9 fotos)
            </span>
            <span className="text-[#cbd5e1] text-sm">1d atrás</span>
          </li>
          <li className="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center">
            <span>
              🔧 Manutenção concluída – <span className="text-[#9b87f5] font-medium">#1228</span> (Elevador)
            </span>
            <span className="text-[#cbd5e1] text-sm">2d atrás</span>
          </li>
        </ul>
      </div>
    </Card>
  )
}
