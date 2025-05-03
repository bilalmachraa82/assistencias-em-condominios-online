
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  isSubmitting?: boolean;
};

export type AssistanceFormValues = {
  intervention_type_id: number;
  supplier_id: number;
  description: string;
  admin_notes?: string;
  type: string;
};

// Form schema
const formSchema = z.object({
  intervention_type_id: z.number({
    required_error: "Selecione uma categoria de intervenção",
  }),
  supplier_id: z.number({
    required_error: "Selecione um fornecedor",
  }),
  description: z.string().min(1, {
    message: "Descrição é obrigatória",
  }),
  admin_notes: z.string().optional(),
});

export default function AssistanceForm({ selectedBuilding, onSubmit, onCancel, isSubmitting = false }: AssistanceFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      admin_notes: "",
    },
  });

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

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Encontrar o tipo de intervenção selecionado para obter o valor de maps_to_urgency
      const selectedType = interventionTypes?.find(
        type => type.id === Number(values.intervention_type_id)
      );

      // Definir o tipo com base em maps_to_urgency, padrão para 'Normal' se não encontrado
      const assistanceType = selectedType?.maps_to_urgency || 'Normal';

      // Now we ensure all required fields are present
      const formData: AssistanceFormValues = {
        intervention_type_id: values.intervention_type_id,
        supplier_id: values.supplier_id,
        description: values.description,
        type: assistanceType,
        admin_notes: values.admin_notes,
      };

      onSubmit(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Erro ao enviar formulário. Por favor, tente novamente.");
    }
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
              <FormLabel>Categoria da Intervenção *</FormLabel>
              <FormControl>
                <Select 
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value?.toString()}
                  disabled={isLoadingTypes}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingTypes ? (
                      <div className="p-2 text-center">Carregando categorias...</div>
                    ) : !interventionTypes || interventionTypes.length === 0 ? (
                      <div className="p-2 text-center">Nenhuma categoria encontrada</div>
                    ) : (
                      interventionTypes.map((type) => (
                        <SelectItem 
                          key={type.id} 
                          value={type.id.toString()}
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

        {/* Supplier */}
        <FormField
          control={form.control}
          name="supplier_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornecedor Recomendado/Atribuído *</FormLabel>
              <FormControl>
                <Select 
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value?.toString()}
                  disabled={isLoadingSuppliers}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingSuppliers ? (
                      <div className="p-2 text-center">Carregando fornecedores...</div>
                    ) : !suppliers || suppliers.length === 0 ? (
                      <div className="p-2 text-center">Nenhum fornecedor encontrado</div>
                    ) : (
                      suppliers.map((supplier) => (
                        <SelectItem 
                          key={supplier.id} 
                          value={supplier.id.toString()}
                        >
                          {supplier.name} {supplier.specialization ? `(${supplier.specialization})` : ''}
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

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição Detalhada *</FormLabel>
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

        {/* Admin Notes - Optional */}
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
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Processando..." : "Criar Assistência"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
