
import { Database } from '@/integrations/supabase/types';

// Define a more explicit ValidStatus type with properly typed fields
export type ValidStatus = {
  id: number;
  status_value: string;
  label_pt?: string | null;
  label_en?: string | null;
  hex_color?: string | null;  // Ensure this is properly typed as string | null
  display_order: number;
  sort_order: number;
  created_at?: string | null;
};

// Simplify to avoid never type issues
export type AssistanceStatus = string;
