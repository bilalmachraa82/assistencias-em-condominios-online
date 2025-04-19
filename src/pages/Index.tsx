
import { Card } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function Index() {
  return (
    <DashboardLayout>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6 backdrop-blur-sm bg-card/80 shadow-lg hover:shadow-xl transition-all">
          <h3 className="font-semibold text-lg mb-2">Assistências Ativas</h3>
          <p className="text-3xl font-bold">12</p>
        </Card>
        
        <Card className="p-6 backdrop-blur-sm bg-card/80 shadow-lg hover:shadow-xl transition-all">
          <h3 className="font-semibold text-lg mb-2">Agendamentos Hoje</h3>
          <p className="text-3xl font-bold">5</p>
        </Card>
        
        <Card className="p-6 backdrop-blur-sm bg-card/80 shadow-lg hover:shadow-xl transition-all">
          <h3 className="font-semibold text-lg mb-2">Fotos Pendentes</h3>
          <p className="text-3xl font-bold">3</p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
