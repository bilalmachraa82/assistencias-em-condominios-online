
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
import { Building, Calendar, FileText, PenLine } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from 'sonner';

type AssistanceFormValues = {
  building_id: number;
  supplier_id: number;
  description: string;
  type: string;
  intervention_type_id?: number;
  alert_level: number;
  scheduled_datetime?: string;
}

export default function Assistencias() {
  const [selectedBuilding, setSelectedBuilding] = useState<null | { id: number; name: string }>(null);
  const [isNewAssistanceDialogOpen, setIsNewAssistanceDialogOpen] = useState(false);
  const [isAssistanceFormOpen, setIsAssistanceFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AssistanceFormValues>({
    defaultValues: {
      building_id: 0,
      supplier_id: 0,
      description: '',
      type: '',
      alert_level: 1,
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

  const { data: suppliers, isLoading: isSuppliersLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: interventionTypes, isLoading: isInterventionTypesLoading } = useQuery({
    queryKey: ['intervention_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intervention_types')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (values: AssistanceFormValues) => {
    setIsSubmitting(true);
    try {
      // Generate a random interaction token
      const interaction_token = Math.random().toString(36).substring(2, 15) + 
                               Math.random().toString(36).substring(2, 15);

      const { data, error } = await supabase
        .from('assistances')
        .insert([
          { 
            ...values,
            interaction_token,
            building_id: selectedBuilding?.id
          }
        ])
        .select();

      if (error) throw error;

      toast.success('Assistência criada com sucesso!');
      setIsAssistanceFormOpen(false);
      setSelectedBuilding(null);
    } catch (error) {
      console.error('Erro ao criar assistência:', error);
      toast.error('Erro ao criar assistência. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuildingSelect = (building: any) => {
    setSelectedBuilding(building);
    setIsNewAssistanceDialogOpen(false);
    setIsAssistanceFormOpen(true);
    
    // Set building_id in form
    form.setValue('building_id', building.id);
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
                <SelectTrigger>
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
            <DialogHeader>
              <DialogTitle>Nova Assistência</DialogTitle>
              <DialogDescription>
                Preencha os detalhes da solicitação de assistência para o edifício {selectedBuilding?.name}.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Supplier Selection */}
                <FormField
                  control={form.control}
                  name="supplier_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={(value) => field.onChange(Number(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um fornecedor" />
                          </SelectTrigger>
                          <SelectContent>
                            {isSuppliersLoading ? (
                              <div className="p-4 text-center">Carregando fornecedores...</div>
                            ) : suppliers?.length === 0 ? (
                              <div className="p-4 text-center">Nenhum fornecedor encontrado</div>
                            ) : (
                              suppliers?.map((supplier) => (
                                <SelectItem 
                                  key={supplier.id} 
                                  value={String(supplier.id)}
                                >
                                  {supplier.name} - {supplier.specialization || 'Geral'}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Assistência</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Manutenção">Manutenção</SelectItem>
                            <SelectItem value="Reparação">Reparação</SelectItem>
                            <SelectItem value="Instalação">Instalação</SelectItem>
                            <SelectItem value="Urgência">Urgência</SelectItem>
                            <SelectItem value="Preventiva">Preventiva</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Intervention Type */}
                <FormField
                  control={form.control}
                  name="intervention_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria de Intervenção</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={(value) => field.onChange(Number(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {isInterventionTypesLoading ? (
                              <div className="p-4 text-center">Carregando categorias...</div>
                            ) : interventionTypes?.length === 0 ? (
                              <div className="p-4 text-center">Nenhuma categoria encontrada</div>
                            ) : (
                              interventionTypes?.map((type) => (
                                <SelectItem 
                                  key={type.id} 
                                  value={String(type.id)}
                                >
                                  {type.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Alert Level */}
                <FormField
                  control={form.control}
                  name="alert_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de Urgência (1-5)</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={(value) => field.onChange(Number(value))}
                          defaultValue="1"
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Nível de urgência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Baixa</SelectItem>
                            <SelectItem value="2">2 - Média-Baixa</SelectItem>
                            <SelectItem value="3">3 - Média</SelectItem>
                            <SelectItem value="4">4 - Média-Alta</SelectItem>
                            <SelectItem value="5">5 - Alta</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Scheduled Date/Time */}
                <FormField
                  control={form.control}
                  name="scheduled_datetime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Agendada (opcional)</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 opacity-70" />
                          <Input 
                            type="datetime-local" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <div className="flex items-start">
                          <PenLine className="mr-2 h-4 w-4 mt-3 opacity-70" />
                          <Textarea 
                            placeholder="Descreva o problema ou necessidade em detalhes..." 
                            className="min-h-[120px]" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAssistanceFormOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Enviando...' : 'Criar Assistência'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
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
                <tr>
                  <td className="px-4 py-3 text-[#cbd5e1]" colSpan={8}>
                    Nenhuma assistência encontrada.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
