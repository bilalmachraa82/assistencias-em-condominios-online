
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";

const buildingSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  address: z.string().optional(),
  cadastral_code: z.string().optional(),
  nif: z.string().optional(),
  admin_notes: z.string().optional(),
  is_active: z.boolean().optional(),
});

type BuildingFormData = z.infer<typeof buildingSchema>;

interface BuildingFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BuildingFormData) => void;
  initialData?: {
    id: number;
    name: string;
    address?: string;
    cadastral_code?: string;
    nif?: string;
    admin_notes?: string;
    is_active: boolean;
  };
}

export default function BuildingForm({ open, onClose, onSubmit, initialData }: BuildingFormProps) {
  const form = useForm<BuildingFormData>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      name: initialData?.name || '',
      address: initialData?.address || '',
      cadastral_code: initialData?.cadastral_code || '',
      nif: initialData?.nif || '',
      admin_notes: initialData?.admin_notes || '',
      is_active: initialData?.is_active ?? true,
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        address: initialData.address || '',
        cadastral_code: initialData.cadastral_code || '',
        nif: initialData.nif || '',
        admin_notes: initialData.admin_notes || '',
        is_active: initialData.is_active,
      });
    } else {
      form.reset({
        name: '',
        address: '',
        cadastral_code: '',
        nif: '',
        admin_notes: '',
        is_active: true,
      });
    }
  }, [initialData, form]);

  const handleSubmit = (data: BuildingFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Edifício' : 'Novo Edifício'}
          </DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Edite os detalhes do edifício.' 
              : 'Preencha os detalhes para criar um novo edifício.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Edifício *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Edifício Central" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Morada</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rua Principal, 123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cadastral_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código Postal</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 1000-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nif"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIF</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="admin_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Notas adicionais sobre o edifício..."
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
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Activo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Edifício disponível para novas assistências
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {initialData ? 'Actualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
