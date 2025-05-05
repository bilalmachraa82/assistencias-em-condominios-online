
import { Database } from '@/integrations/supabase/types';

export type ValidStatus = Database['public']['Tables']['valid_statuses']['Row'];
export type AssistanceStatus = ValidStatus['status_value'];
