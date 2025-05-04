
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Fetching valid status values from the database');
    
    // Get the list of allowed status values from the valid_statuses table
    const { data: statusData, error: statusError } = await supabase
      .from('valid_statuses')
      .select('status_value')
      .order('display_order');
    
    if (statusError) {
      console.error('Error fetching statuses from valid_statuses table:', statusError);
      
      // Fallback: get the list of allowed status values from assistances table
      console.log('Falling back to fetching from assistances table');
      const { data, error } = await supabase
        .from('assistances')
        .select('status')
        .limit(1000);
      
      if (error) {
        console.error('Error fetching statuses from assistances table:', error);
        throw error;
      }
      
      // Extract unique status values
      const statusValues = [...new Set(data.map(item => item.status))];
      
      // Add default/common status values that might not be in the database yet
      const defaultStatuses = [
        'Pendente Resposta Inicial',
        'Pendente Aceitação',
        'Pendente Agendamento',
        'Agendado',
        'Em Andamento',
        'Concluído',
        'Pendente Validação',
        'Reagendamento Solicitado',
        'Recusada',
        'Cancelado'
      ];
      
      const allStatusValues = [...new Set([...statusValues, ...defaultStatuses])];
      
      console.log(`Returning ${allStatusValues.length} status values (from fallback)`);
      return new Response(
        JSON.stringify(allStatusValues),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // If valid_statuses table has data, return those values
    const validStatuses = statusData.map(item => item.status_value);
    
    console.log(`Returning ${validStatuses.length} status values from valid_statuses table`);
    return new Response(
      JSON.stringify(validStatuses),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro ao obter valores de status válidos:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
