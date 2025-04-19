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
import { Building, FileText, Calendar, User, Tool, AlertTriangle, MessageSquare } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAssistance, setSelectedAssistance] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

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
      
      if (error) {
        console.error('Error fetching assistances:', error);
        throw error;
      }
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
      
      if (error) {
        console.error('Error fetching buildings:', error);
        throw error;
      }
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
      setIsSubmitting(true);
      
      // Generate a random interaction token
      const interaction_token = Math.random().toString(36).substring(2, 15) + 
                               Math.random().toString(36).substring(2, 15);

      console.log("Creating assistance with data:", {
        ...formData,
        interaction_token,
        building_id: selectedBuilding?.id,
        status: 'Pendente Resposta Inicial'
      });

      const { data, error } = await supabase
        .from('assistances')
        .insert([
          { 
            ...formData,
            interaction_token,
            building_id: selectedBuilding?.id,
            status: 'Pendente Resposta Inicial',
            alert_level: 1
          }
        ])
        .select();

      if (error) {
        console.error('Erro ao criar assistência:', error);
        toast.error(`Erro ao criar assistência: ${error.message}`);
        throw error;
      }

      toast.success('Assistência criada com sucesso!');
      setIsAssistanceFormOpen(false);
      setSelectedBuilding(null);
      await refetchAssistances();
    } catch (error) {
      console.error('Erro ao criar assistência:', error);
      toast.error('Erro ao criar assistência. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewAssistance = (assistance: any) => {
    setSelectedAssistance(assistance);
    setIsViewDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Não agendado';
    
    return new Date(dateString).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
                  if (building) {
                    setSelectedBuilding({ id: building.id, name: building.name });
                  }
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
        <Dialog open={isAssistanceFormOpen} onOpenChange={(open) => {
          if (!isSubmitting) {
            setIsAssistanceFormOpen(open);
          }
        }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Nova Assistência</DialogTitle>
              <DialogDescription>
                Preencha os detalhes para criar uma nova solicitação de assistência.
              </DialogDescription>
            </DialogHeader>
            <AssistanceForm
              selectedBuilding={selectedBuilding}
              onSubmit={handleAssistanceSubmit}
              onCancel={() => setIsAssistanceFormOpen(false)}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        {/* View Assistance Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Detalhes da Assistência</DialogTitle>
              <DialogDescription>
                Informações detalhadas da solicitação de assistência.
              </DialogDescription>
            </DialogHeader>
            
            {selectedAssistance && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                      <Building className="h-4 w-4" /> Edifício
                    </h3>
                    <p className="mt-1 text-base">{selectedAssistance.buildings?.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                      <Tool className="h-4 w-4" /> Tipo de Intervenção
                    </h3>
                    <p className="mt-1 text-base">{selectedAssistance.intervention_types?.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" /> Fornecedor
                    </h3>
                    <p className="mt-1 text-base">{selectedAssistance.suppliers?.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                      <AlertTriangle className="h-4 w-4" /> Status
                    </h3>
                    <p className="mt-1 text-base">{selectedAssistance.status}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" /> Data Criação
                    </h3>
                    <p className="mt-1 text-base">{formatDate(selectedAssistance.created_at)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" /> Agendamento
                    </h3>
                    <p className="mt-1 text-base">{formatDateTime(selectedAssistance.scheduled_datetime)}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" /> Descrição
                  </h3>
                  <p className="mt-1 text-base whitespace-pre-wrap">{selectedAssistance.description}</p>
                </div>
                
                {selectedAssistance.photo_path && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Foto</h3>
                    <div className="mt-2 max-w-full overflow-hidden rounded-md border">
                      <img 
                        src={selectedAssistance.photo_path} 
                        alt="Foto da assistência" 
                        className="h-auto w-full object-cover"
                      />
                    </div>
                  </div>
                )}
                
                {selectedAssistance.admin_notes && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Notas Administrativas</h3>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{selectedAssistance.admin_notes}</p>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsViewDialogOpen(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
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
                      <td className="px-4 py-3 text-center text-[#8E9196]">{formatDate(assistance.created_at)}</td>
                      <td className="px-4 py-3">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewAssistance(assistance)}
                        >
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
