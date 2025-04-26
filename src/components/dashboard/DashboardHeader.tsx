import { Button } from "@/components/ui/button";
import { MapPin, Plus, Camera, Sun } from "lucide-react";
export function DashboardHeader() {
  return <div className="flex justify-between items-center mb-10 animate-fade-in-up">
      <div>
        <h1 className="text-5xl font-extrabold leading-tight">Olá, Andre!</h1>
        <p className="text-[#cbd5e1] mt-2 text-lg">
          Pronto para transformar assistências em soluções?
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="glass px-4 py-2 rounded-full flex items-center gap-2 text-[#f1f5f9]">
          <MapPin className="h-4 w-4" />
          <span>Lisboa</span>
          <Sun className="h-4 w-4 text-[#fb923c]" />
          <span>21°C</span>
        </div>
        <Button className="bg-gradient-to-r from-[#38bdf8] to-[#6366f1] text-white hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" /> Nova Assistência
        </Button>
        <Button variant="ghost" className="glass">
          <Camera className="mr-2 h-4 w-4" /> Nova Foto
        </Button>
      </div>
    </div>;
}