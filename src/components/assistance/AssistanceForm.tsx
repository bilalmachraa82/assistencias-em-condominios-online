
import React from 'react';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AssistanceFormProps = {
  selectedBuilding: { id: number; name: string } | null;
  onSubmit: (data: AssistanceFormValues) => void;
  onCancel: () => void;
};

type AssistanceFormValues = {
  intervention_type_id: number;
  supplier_id: number;
  description: string;
  admin_notes?: string;
  type: string;
};

export default function AssistanceForm({ selectedBuilding, onSubmit, onCancel }: AssistanceFormProps) {
  const form = useForm<AssistanceFormValues>();

  const { data: interventionTypes, isLoading: isLoadingTypes } = useQuery({
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

  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({
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

  const handleSubmit = async (values: AssistanceFormValues) => {
    // Find the selected intervention type to get its maps_to_urgency value
    const selectedType = interventionTypes?.find(
      type => type.id === Number(values.intervention_type_id)
    );

    // Set the type based on maps_to_urgency, defaulting to 'Normal' if not found
    const assistanceType = selectedType?.maps_to_urgency || 'Normal';

    onSubmit({
      ...values,
      type: assistanceType,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="text-lg font-semibold mb-4">
          Nova Assistência para {selectedBuilding?.name}
        </div>

        {/* Intervention Type */}
        <FormField
          control={form.control}
          name="intervention_type_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria da Intervenção</FormLabel>
              <FormControl>
                <Select 
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value?.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {interventionTypes?.map((type) => (
                      <SelectItem 
                        key={type.id} 
                        value={type.id.toString()}
                      >
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Supplier */}
        <FormField
          control={form.control}
          name="supplier_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornecedor Recomendado/Atribuído</FormLabel>
              <FormControl>
                <Select 
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value?.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier) => (
                      <SelectItem 
                        key={supplier.id} 
                        value={supplier.id.toString()}
                      >
                        {supplier.name} {supplier.specialization ? `(${supplier.specialization})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <FormLabel>Descrição Detalhada</FormLabel>
              <FormControl>
                <Textarea 
                  {...field}
                  placeholder="Descreva o problema ou necessidade em detalhe, incluindo localização específica (piso, fração, etc.) se aplicável..."
                  className="min-h-[120px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Admin Notes */}
        <FormField
          control={form.control}
          name="admin_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas Internas (Admin)</FormLabel>
              <FormControl>
                <Textarea 
                  {...field}
                  placeholder="Observações visíveis apenas para a administração..."
                  className="min-h-[80px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            Criar Assistência
          </Button>
        </div>
      </form>
    </Form>
  );
}
