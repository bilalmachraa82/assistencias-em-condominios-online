
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Activity, Calendar, Image, ArrowRight, Sun, MapPin, Plus, Camera } from "lucide-react";

export default function Index() {
  return (
    <DashboardLayout>
      {/* Header section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Olá, João!</h1>
          <p className="text-white/80">Pronto para transformar assistências em soluções?</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass px-4 py-2 rounded-full flex items-center gap-2 text-white">
            <MapPin className="h-4 w-4" />
            <span>Lisboa</span>
            <Sun className="h-4 w-4" />
            <span>21°C</span>
          </div>
          <Button className="glass hover:bg-white/20" variant="ghost">
            <Plus className="h-4 w-4 mr-2" />
            Nova Assistência
          </Button>
          <Button className="glass hover:bg-white/20" variant="ghost">
            <Camera className="h-4 w-4 mr-2" />
            Nova Foto
          </Button>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="glass-card p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-white mb-1">Assistências Ativas</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-primary">12</span>
                <span className="text-white/80">assistências</span>
              </div>
              <p className="text-sm text-success mt-2 flex items-center">
                <Activity className="h-3 w-3 mr-1" />
                +2 desde ontem
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-between mt-4 text-primary">
            Ver detalhes <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-white mb-1">Agendamentos Hoje</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-accent">5</span>
                <span className="text-white/80">hoje</span>
              </div>
              <p className="text-sm text-white/80 mt-2">Próxima em 2 horas</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-between mt-4 text-accent">
            Ver agenda <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-white mb-1">Fotos Pendentes</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-destructive">3</span>
                <span className="text-white/80">pendentes</span>
              </div>
              <p className="text-sm text-white/80 mt-2">Mais antiga: 2 dias</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-between mt-4 text-destructive">
            Carregar fotos <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      </div>
      
      {/* Recent activity */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Atividade Recente</h2>
          <Button variant="ghost" size="sm" className="text-white/80">
            Ver todas
          </Button>
        </div>
        
        <div className="space-y-4">
          {[
            {
              title: "Nova assistência criada",
              description: "#1234 - Ar Condicionado",
              time: "Agora",
              status: "primary"
            },
            {
              title: "Agendamento confirmado",
              description: "Cliente ABC - 15/04/2025 às 14:30",
              time: "2h atrás",
              status: "accent"
            },
            {
              title: "Fotos carregadas",
              description: "#1230 - 9 fotos",
              time: "1 dia atrás",
              status: "success"
            }
          ].map((item, index) => (
            <div key={index} className="glass p-4 rounded-xl transition-all hover:bg-white/20">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-4 bg-${item.status}`} />
                <div className="flex-1">
                  <h4 className="font-medium text-white">{item.title}</h4>
                  <p className="text-sm text-white/70">{item.description}</p>
                </div>
                <p className="text-xs text-white/60">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
