
import { Database } from '@/integrations/supabase/types';

// Use the database type directly without extending it
export type ValidStatus = Database['public']['Tables']['valid_statuses']['Row'];

// Simplify to avoid never type issues
export type AssistanceStatus = string;
