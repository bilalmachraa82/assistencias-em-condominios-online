
import { Database } from '@/integrations/supabase/types';

export type ValidStatus = Database['public']['Tables']['valid_statuses']['Row'] & {
  label_pt?: string;
  label_en?: string;
  hex_color?: string;
  sort_order?: number;
};

export type AssistanceStatus = string; // simplified to avoid never type issues

