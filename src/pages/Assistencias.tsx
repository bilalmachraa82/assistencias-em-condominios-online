
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
import { Building, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AssistanceForm from '@/components/assistance/AssistanceForm';
import { toast } from 'sonner';

export default function Assistencias() {
  const [selectedBuilding, setSelectedBuilding] = useState<null | { id: number; name: string }>(null);
  const [isNewAssistanceDialogOpen, setIsNewAssistanceDialogOpen] = useState(false);
  const [isAssistanceFormOpen, setIsAssistanceFormOpen] = useState(false);

  // Fetch list of assistances
  const { data: assistances, isLoading: isAssistancesLoading, refetch: refetchAssistances } = useQuery({
    queryKey: ['assistances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assistances')
        .select(`
          *,
          buildings(name),
          suppliers(name),
          intervention_types(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: buildings, isLoading: isBuildingsLoading } = useQuery({
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

  const handleBuildingSelect = (building: any) => {
    setSelectedBuilding(building);
    setIsNewAssistanceDialogOpen(false);
    setIsAssistanceFormOpen(true);
  };

  const handleAssistanceSubmit = async (formData: any) => {
    try {
      // Generate a random interaction token
      const interaction_token = Math.random().toString(36).substring(2, 15) + 
                               Math.random().toString(36).substring(2, 15);

      const { data, error } = await supabase
        .from('assistances')
        .insert([
          { 
            ...formData,
            interaction_token,
            building_id: selectedBuilding?.id,
            alert_level: 1, // Default value
          }
        ])
        .select();

      if (error) throw error;

      toast.success('Assistência criada com sucesso!');
      setIsAssistanceFormOpen(false);
      setSelectedBuilding(null);
      refetchAssistances(); // Refresh the data
    } catch (error) {
      console.error('Erro ao criar assistência:', error);
      toast.error('Erro ao criar assistência. Tente novamente.');
    }
  };

  // Format the date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

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
              <Building className="h-4 w-4" />
              Nova Assistência
            </Button>
          </div>
        </div>

        {/* Building Selection Dialog */}
        <Dialog open={isNewAssistanceDialogOpen} onOpenChange={setIsNewAssistanceDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Selecione um Edifício</DialogTitle>
              <DialogDescription>
                Escolha o edifício para o qual deseja solicitar assistência.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Select 
                onValueChange={(value) => {
                  const building = buildings?.find(b => b.id === Number(value));
                  setSelectedBuilding(building || null);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Escolha um edifício" />
                </SelectTrigger>
                <SelectContent>
                  {isBuildingsLoading ? (
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
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsNewAssistanceDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                disabled={!selectedBuilding}
                onClick={() => handleBuildingSelect(selectedBuilding)}
              >
                Próximo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assistance Form Dialog */}
        <Dialog open={isAssistanceFormOpen} onOpenChange={setIsAssistanceFormOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <AssistanceForm
              selectedBuilding={selectedBuilding}
              onSubmit={handleAssistanceSubmit}
              onCancel={() => setIsAssistanceFormOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Assistance Listing */}
        <div className="bg-white/5 rounded-3xl p-6 backdrop-blur-lg shadow-xl mt-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Listagem de Assistências
          </h2>
          
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">Edifício</th>
                  <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium">Fornecedor</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Urgência</th>
                  <th className="px-4 py-3 text-left font-medium">Data</th>
                  <th className="px-4 py-3 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isAssistancesLoading ? (
                  <tr>
                    <td className="px-4 py-3 text-[#cbd5e1]" colSpan={8}>
                      Carregando assistências...
                    </td>
                  </tr>
                ) : assistances?.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-[#cbd5e1]" colSpan={8}>
                      Nenhuma assistência encontrada.
                    </td>
                  </tr>
                ) : (
                  assistances?.map((assistance) => (
                    <tr key={assistance.id}>
                      <td className="px-4 py-3 text-[#cbd5e1]">{assistance.id}</td>
                      <td className="px-4 py-3 text-[#cbd5e1]">{assistance.buildings?.name}</td>
                      <td className="px-4 py-3 text-[#cbd5e1]">{assistance.intervention_types?.name}</td>
                      <td className="px-4 py-3 text-[#cbd5e1]">{assistance.suppliers?.name}</td>
                      <td className="px-4 py-3 text-[#cbd5e1]">{assistance.status}</td>
                      <td className="px-4 py-3 text-[#cbd5e1]">{assistance.type}</td>
                      <td className="px-4 py-3 text-[#cbd5e1]">{formatDate(assistance.created_at)}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm">
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
