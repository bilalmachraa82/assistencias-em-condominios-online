
import { Database } from '@/integrations/supabase/types';

// Define a more explicit ValidStatus type with properly typed fields
export type ValidStatus = {
  id: number;
  status_value: string;
  label_pt?: string | null;
  label_en?: string | null;
  hex_color?: string | null;
  display_order: number;
  sort_order: number;
  created_at?: string | null;
};

// Define the exact status values as a union type based on the database
export type AssistanceStatusValue = 
  | 'Pendente Resposta Inicial'
  | 'Pendente Aceitação'
  | 'Recusada Fornecedor'
  | 'Pendente Agendamento'
  | 'Agendado'
  | 'Em Progresso'
  | 'Pendente Validação'
  | 'Concluído'
  | 'Reagendamento Solicitado'
  | 'Validação Expirada'
  | 'Cancelado';

// Use the specific union type instead of generic string
export type AssistanceStatus = AssistanceStatusValue;
