
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
          <h1 className="text-4xl font-bold text-foreground mb-2">Olá, João!</h1>
          <p className="text-muted-foreground">Pronto para transformar assistências em soluções?</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>Lisboa</span>
            <Sun className="h-4 w-4" />
            <span>21°C</span>
          </div>
          <Button className="bg-white shadow-sm border border-input/30 hover:bg-secondary/30" variant="ghost">
            <Plus className="h-4 w-4 mr-2" />
            Nova Assistência
          </Button>
          <Button className="bg-white shadow-sm border border-input/30 hover:bg-secondary/30" variant="ghost">
            <Camera className="h-4 w-4 mr-2" />
            Nova Foto
          </Button>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="glass-card border-0">
          <h3 className="text-base font-medium text-foreground/70 mb-1">Assistências Ativas</h3>
          <div className="flex flex-col my-3">
            <span className="text-5xl font-bold text-primary">12</span>
            <p className="text-sm text-success mt-2 flex items-center">
              <Activity className="h-3 w-3 mr-1" />
              +2 desde ontem
            </p>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-between mt-4 text-primary">
            Ver detalhes <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>

        <Card className="glass-card border-0">
          <h3 className="text-base font-medium text-foreground/70 mb-1">Agendamentos Hoje</h3>
          <div className="flex flex-col my-3">
            <span className="text-5xl font-bold text-accent">5</span>
            <p className="text-sm text-muted-foreground mt-2">Próxima em 2 horas</p>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-between mt-4 text-accent">
            Ver agenda <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>

        <Card className="glass-card border-0">
          <h3 className="text-base font-medium text-foreground/70 mb-1">Fotos Pendentes</h3>
          <div className="flex flex-col my-3">
            <span className="text-5xl font-bold text-destructive">3</span>
            <p className="text-sm text-muted-foreground mt-2">Mais antiga: 2 dias</p>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-between mt-4 text-destructive">
            Carregar fotos <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      </div>
      
      {/* Recent activity */}
      <div className="glass-card border-0 p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">Atividade Recente</h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Ver todas
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="glass p-4 rounded-xl bg-white/90">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full mr-4 bg-primary" />
              <div className="flex-1">
                <h4 className="font-medium text-foreground">Nova assistência criada</h4>
                <p className="text-sm text-muted-foreground">#1234 - Ar Condicionado</p>
              </div>
              <p className="text-xs text-muted-foreground">Agora</p>
            </div>
          </div>
          
          <div className="glass p-4 rounded-xl bg-white/90">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full mr-4 bg-accent" />
              <div className="flex-1">
                <h4 className="font-medium text-foreground">Agendamento confirmado</h4>
                <p className="text-sm text-muted-foreground">Cliente ABC - 15/04/2025 às 14:30</p>
              </div>
              <p className="text-xs text-muted-foreground">2h atrás</p>
            </div>
          </div>
          
          <div className="glass p-4 rounded-xl bg-white/90">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full mr-4 bg-success" />
              <div className="flex-1">
                <h4 className="font-medium text-foreground">Fotos carregadas</h4>
                <p className="text-sm text-muted-foreground">#1230 - 9 fotos</p>
              </div>
              <p className="text-xs text-muted-foreground">1 dia atrás</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
