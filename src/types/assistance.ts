
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

// UPDATED: Define the exact status values for the 8 essential statuses
export type AssistanceStatusValue = 
  | 'Pendente Resposta Inicial'
  | 'Pendente Aceitação'
  | 'Recusada Fornecedor'
  | 'Agendado'
  | 'Em Progresso'
  | 'Pendente Validação'
  | 'Concluído'
  | 'Cancelado';

// Use the specific union type instead of generic string
export type AssistanceStatus = AssistanceStatusValue;

// Tipo forte para retorno da função delete_assistance_safely
export interface DeleteAssistanceResult {
  success: boolean;
  error?: string;
  message?: string;
  assistance_id?: number;
  deleted_activity_logs?: number;
}

// Função para validar e tipar o resultado do Supabase RPC
export function validateDeleteAssistanceResult(
  data: unknown
): DeleteAssistanceResult {
  if (
    typeof data === "object" &&
    data !== null &&
    "success" in data &&
    typeof (data as any).success === "boolean"
  ) {
    return data as DeleteAssistanceResult;
  }
  throw new Error(
    "Resultado inesperado ao eliminar assistência: " +
      JSON.stringify(data)
  );
}
