
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Activity, Calendar, Image, ArrowRight, Sun, MapPin, Plus, Camera, TrendingUp, MessageSquare } from "lucide-react";

export default function Index() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold mb-2">Olá, João!</h1>
          <p className="text-[#cbd5e1]">Pronto para transformar assistências em soluções?</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass px-4 py-2 rounded-full flex items-center gap-2 text-[#f1f5f9]">
            <MapPin className="h-4 w-4" />
            <span>Lisboa</span>
            <Sun className="h-4 w-4 text-[#fb923c]" />
            <span>21°C</span>
          </div>
          <Button className="btn-glass rounded-full" variant="ghost">
            <Plus className="h-4 w-4 mr-2" />
            Nova Assistência
          </Button>
          <Button className="btn-glass rounded-full" variant="ghost">
            <Camera className="h-4 w-4 mr-2" />
            Nova Foto
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="glass-card p-6">
          <h3 className="text-base font-medium text-[#f1f5f9] mb-1">Assistências Ativas</h3>
          <div className="flex flex-col my-3">
            <span className="text-5xl font-semibold text-[#f1f5f9]">12</span>
            <p className="text-sm text-success mt-2 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2 desde ontem
            </p>
          </div>
          <div className="h-1 w-full bg-white/10 rounded-full mb-4">
            <div className="h-1 bg-success rounded-full" style={{width: '75%'}}></div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-between mt-2 text-[#f1f5f9]/80 hover:text-[#f1f5f9]">
            Ver detalhes <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>

        <Card className="glass-card p-6">
          <h3 className="text-base font-medium text-[#f1f5f9] mb-1">Agendamentos Hoje</h3>
          <div className="flex flex-col my-3">
            <span className="text-5xl font-semibold text-[#f1f5f9]">5</span>
            <p className="text-sm text-[#cbd5e1] mt-2 flex items-center">
              <Calendar className="h-3 w-3 mr-1 text-primary-blue" /> 
              Próxima em 2 horas
            </p>
          </div>
          <div className="h-1 w-full bg-white/10 rounded-full mb-4">
            <div className="h-1 bg-primary-blue rounded-full" style={{width: '40%'}}></div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-between mt-2 text-primary-blue hover:text-primary-blue/80">
            Ver agenda <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>

        <Card className="glass-card p-6">
          <h3 className="text-base font-medium text-[#f1f5f9] mb-1">Fotos Pendentes</h3>
          <div className="flex flex-col my-3">
            <span className="text-5xl font-semibold text-[#f1f5f9]">3</span>
            <p className="text-sm text-[#cbd5e1] mt-2 flex items-center">
              <Image className="h-3 w-3 mr-1 text-destructive" />
              Mais antiga: 2 dias
            </p>
          </div>
          <div className="h-1 w-full bg-white/10 rounded-full mb-4">
            <div className="h-1 bg-destructive rounded-full" style={{width: '25%'}}></div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-between mt-2 text-destructive hover:text-destructive/80">
            Carregar fotos <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      </div>
      
      <div className="glass-card p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Atividade Recente</h2>
          <Button variant="ghost" size="sm" className="text-[#cbd5e1] hover:text-[#f1f5f9]">
            Ver todas
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="glass p-4 rounded-xl">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full mr-4 bg-[#ec4899]" />
              <div className="flex-1">
                <h4 className="font-medium text-[#f1f5f9]">Nova assistência criada</h4>
                <p className="text-sm text-[#cbd5e1]">#1234 - Ar Condicionado</p>
              </div>
              <p className="text-xs text-[#cbd5e1]">Agora</p>
            </div>
          </div>
          
          <div className="glass p-4 rounded-xl">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full mr-4 bg-primary-blue" />
              <div className="flex-1">
                <h4 className="font-medium text-[#f1f5f9]">Agendamento confirmado</h4>
                <p className="text-sm text-[#cbd5e1]">Cliente ABC - 15/04/2025 às 14:30</p>
              </div>
              <p className="text-xs text-[#cbd5e1]">2h atrás</p>
            </div>
          </div>
          
          <div className="glass p-4 rounded-xl">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full mr-4 bg-success" />
              <div className="flex-1">
                <h4 className="font-medium text-[#f1f5f9]">Fotos carregadas</h4>
                <p className="text-sm text-[#cbd5e1]">#1230 - 9 fotos</p>
              </div>
              <p className="text-xs text-[#cbd5e1]">1 dia atrás</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-6 right-6">
        <Button className="rounded-full w-12 h-12 p-0 glass shadow-lg hover:bg-[#38bdf8]/20">
          <MessageSquare className="h-5 w-5 text-[#38bdf8]" />
        </Button>
      </div>
    </DashboardLayout>
  );
}
