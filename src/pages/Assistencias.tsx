
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Buildings } from 'lucide-react';

export default function Assistencias() {
  const [selectedBuilding, setSelectedBuilding] = useState<null | { id: number; name: string }>(null);
  const [isNewAssistanceDialogOpen, setIsNewAssistanceDialogOpen] = useState(false);

  const { data: buildings, isLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout>
      <div className="animate-fade-in-up">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-extrabold leading-tight">Assistências</h1>
            <p className="text-[#cbd5e1] mt-2 text-lg">Gerencie suas solicitações de manutenção</p>
          </div>
          <div>
            <Button 
              onClick={() => setIsNewAssistanceDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Buildings className="h-4 w-4" />
              Nova Assistência
            </Button>
          </div>
        </div>

        {/* Building Selection Dialog */}
        {isNewAssistanceDialogOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl w-[500px]">
              <h2 className="text-2xl font-bold mb-4">Selecione um Edifício</h2>
              <Select 
                onValueChange={(value) => {
                  const building = buildings?.find(b => b.id === Number(value));
                  setSelectedBuilding(building || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um edifício" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <div className="p-4 text-center">Carregando edifícios...</div>
                  ) : buildings?.length === 0 ? (
                    <div className="p-4 text-center">Nenhum edifício encontrado</div>
                  ) : (
                    buildings?.map((building) => (
                      <SelectItem 
                        key={building.id} 
                        value={String(building.id)}
                      >
                        {building.name} - {building.address}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <div className="flex justify-end mt-4 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsNewAssistanceDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  disabled={!selectedBuilding}
                  onClick={() => {
                    // Próximo passo: criar formulário de assistência
                    console.log('Edifício selecionado:', selectedBuilding);
                    setIsNewAssistanceDialogOpen(false);
                  }}
                >
                  Próximo
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for Assistance List */}
        <div className="bg-white/5 rounded-3xl p-6 backdrop-blur-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-6">Listagem de Assistências</h2>
          <p className="text-[#cbd5e1]">Nenhuma assistência encontrada.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
