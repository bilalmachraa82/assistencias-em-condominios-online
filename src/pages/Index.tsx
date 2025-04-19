
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Activity, Calendar, Image, ArrowRight, TrendingUp, Clock } from "lucide-react";

export default function Index() {
  return (
    <DashboardLayout>
      {/* Header section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Olá, Técnico</h1>
        <p className="text-muted-foreground mt-1">Acompanhe suas assistências e agendamentos</p>
      </div>
      
      {/* Stats cards with glassmorphism effect */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6 glass border-0 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 animate-float">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Assistências Ativas</p>
              <h3 className="text-3xl font-bold text-primary">12</h3>
              <p className="text-sm text-muted-foreground mt-2 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-success" />
                <span className="text-success font-medium">+2</span> desde ontem
              </p>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <Activity className="h-6 w-6 text-primary" />
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-between mt-4 text-primary">
            Ver detalhes <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
        
        <Card className="p-6 glass border-0 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 animate-float" style={{animationDelay: "0.2s"}}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Agendamentos Hoje</p>
              <h3 className="text-3xl font-bold text-accent">5</h3>
              <p className="text-sm text-muted-foreground mt-2 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Próximo em 2 horas
              </p>
            </div>
            <div className="bg-accent/10 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-accent" />
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-between mt-4 text-accent">
            Ver agenda <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
        
        <Card className="p-6 glass border-0 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 animate-float" style={{animationDelay: "0.4s"}}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Fotos Pendentes</p>
              <h3 className="text-3xl font-bold text-destructive">3</h3>
              <p className="text-sm text-muted-foreground mt-2 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Mais antiga: 2 dias
              </p>
            </div>
            <div className="bg-destructive/10 p-3 rounded-full">
              <Image className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-between mt-4 text-destructive">
            Carregar fotos <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      </div>
      
      {/* Recent activity section (preview only) */}
      <div className="mt-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Atividade Recente</h2>
          <Button variant="outline" size="sm" className="text-primary">
            Ver todas
          </Button>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((_, index) => (
            <Card key={index} className="p-4 glass border-0">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-4 ${index === 0 ? 'bg-primary' : index === 1 ? 'bg-accent' : 'bg-success'}`}></div>
                <div className="flex-1">
                  <h4 className="font-medium">{index === 0 ? 'Nova assistência criada' : index === 1 ? 'Agendamento confirmado' : 'Fotos carregadas'}</h4>
                  <p className="text-sm text-muted-foreground">{index === 0 ? 'Assistência #1234 - Ar Condicionado' : index === 1 ? 'Cliente ABC - 15/04/2025, 14:30' : 'Assistência #1230 - 3 fotos'}</p>
                </div>
                <p className="text-xs text-muted-foreground">{index === 0 ? 'Agora' : index === 1 ? '2h atrás' : '1d atrás'}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
