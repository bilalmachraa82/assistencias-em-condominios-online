
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
    
    // Get the list of allowed status values
    const { data, error } = await supabase
      .from('assistances')
      .select('status')
      .limit(1000);
    
    if (error) {
      console.error('Error fetching statuses:', error);
      return new Response(
        JSON.stringify({ error: 'Error fetching valid status values', details: error }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
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
      'Concluída',
      'Pendente Validação',
      'Reagendamento',
      'Recusada',
      'Cancelada'
    ];
    
    const allStatusValues = [...new Set([...statusValues, ...defaultStatuses])];
    
    return new Response(
      JSON.stringify(allStatusValues),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Erro ao obter valores de status válidos:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
