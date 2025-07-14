
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
  category_id: string;
  contractor_id: string;
  description: string;
  admin_notes?: string;
  priority: string;
};

// Form schema
const formSchema = z.object({
  category_id: z.string({
    required_error: "Selecione uma categoria de serviço",
  }),
  contractor_id: z.string({
    required_error: "Selecione um contratador",
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

  const { data: serviceCategories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['service_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: contractors, isLoading: isLoadingContractors } = useQuery({
    queryKey: ['contractors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contractors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const formData: AssistanceFormValues = {
        category_id: values.category_id,
        contractor_id: values.contractor_id,
        description: values.description,
        priority: 'normal',
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
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria do Serviço *</FormLabel>
              <FormControl>
                <Select 
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoadingCategories}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingCategories ? (
                      <div className="p-2 text-center">Carregando categorias...</div>
                    ) : !serviceCategories || serviceCategories.length === 0 ? (
                      <div className="p-2 text-center">Nenhuma categoria encontrada</div>
                    ) : (
                      serviceCategories.map((category) => (
                        <SelectItem 
                          key={category.id} 
                          value={category.id}
                        >
                          {category.name}
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
          name="contractor_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contratador Recomendado/Atribuído *</FormLabel>
              <FormControl>
                <Select 
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoadingContractors}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o contratador" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingContractors ? (
                      <div className="p-2 text-center">Carregando contratadores...</div>
                    ) : !contractors || contractors.length === 0 ? (
                      <div className="p-2 text-center">Nenhum contratador encontrado</div>
                    ) : (
                      contractors.map((contractor) => (
                        <SelectItem 
                          key={contractor.id} 
                          value={contractor.id}
                        >
                          {contractor.name} {contractor.company_name ? `(${contractor.company_name})` : ''}
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
            {isSubmitting ? "Processando..." : "Criar Solicitação de Serviço"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
