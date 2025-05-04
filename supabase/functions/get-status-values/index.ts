
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
      
      // Fallback: use hardcoded values that match exactly with the StatusUtils.ts values
      console.log('Falling back to hardcoded status values');
      const validStatuses = [
        'Pendente Resposta Inicial',
        'Pendente Aceitação',
        'Recusada Fornecedor',
        'Pendente Agendamento',
        'Agendado',
        'Em Progresso',
        'Pendente Validação',
        'Concluído',
        'Reagendamento Solicitado',
        'Validação Expirada',
        'Cancelado'
      ];
      
      console.log(`Returning ${validStatuses.length} status values (from fallback)`);
      return new Response(
        JSON.stringify(validStatuses),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // If valid_statuses table has data, return those values
    const validStatuses = statusData.map(item => item.status_value);
    
    console.log(`Returning ${validStatuses.length} status values from valid_statuses table`);
    console.log('Status values:', validStatuses.join(', '));
    
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
