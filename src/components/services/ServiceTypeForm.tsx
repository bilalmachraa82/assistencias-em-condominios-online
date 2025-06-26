
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const serviceTypeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  maps_to_urgency: z.enum(['Normal', 'Urgente'], {
    required_error: 'Seleccione o nível de urgência',
  }),
});

type ServiceTypeFormData = z.infer<typeof serviceTypeSchema>;

interface ServiceTypeFormProps {
  initialData?: {
    id: number;
    name: string;
    description?: string;
    maps_to_urgency?: string;
  };
  onSubmit: (data: ServiceTypeFormData) => void;
  onCancel: () => void;
}

export default function ServiceTypeForm({ initialData, onSubmit, onCancel }: ServiceTypeFormProps) {
  const form = useForm<ServiceTypeFormData>({
    resolver: zodResolver(serviceTypeSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      maps_to_urgency: (initialData?.maps_to_urgency as 'Normal' | 'Urgente') || 'Normal',
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description || '',
        maps_to_urgency: (initialData.maps_to_urgency as 'Normal' | 'Urgente') || 'Normal',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        maps_to_urgency: 'Normal',
      });
    }
  }, [initialData, form]);

  const handleSubmit = (data: ServiceTypeFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Categoria *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Electricidade" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descrição detalhada da categoria de serviço..."
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maps_to_urgency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nível de Urgência *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione o nível de urgência" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {initialData ? 'Actualizar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
