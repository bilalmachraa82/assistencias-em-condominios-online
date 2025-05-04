
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function for CORS responses
function createCorsResponse(body: any, status = 200) {
  return new Response(
    JSON.stringify(body),
    { 
      status, 
      headers: { 
        'Content-Type': 'application/json', 
        ...corsHeaders 
      } 
    }
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const token = url.searchParams.get('token');

    if (!token) {
      return createCorsResponse({ error: 'Token não fornecido' }, 400);
    }

    // Validate token and get assistance
    let tokenField;

    switch(action) {
      case 'accept':
        tokenField = 'acceptance_token';
        break;
      case 'schedule':
        tokenField = 'scheduling_token';
        break;
      case 'validate':
        tokenField = 'validation_token';
        break;
      default:
        return createCorsResponse({ error: 'Ação inválida' }, 400);
    }
    
    // Get assistance data with the provided token
    const { data: assistance, error: assistanceError } = await supabase
      .from('assistances')
      .select(`
        id, 
        description, 
        status, 
        type, 
        buildings!inner(id, name, address), 
        suppliers!inner(id, name, email, phone), 
        intervention_types!inner(id, name)
      `)
      .eq(tokenField, token)
      .single();

    if (assistanceError) {
      console.error('Erro ao buscar assistência:', assistanceError);
      return createCorsResponse({ error: 'Token inválido ou assistência não encontrada' }, 404);
    }

    // Return assistance data
    return createCorsResponse({ 
      success: true, 
      data: assistance 
    });
  } catch (error) {
    console.error('Erro:', error.message);
    return createCorsResponse({ error: 'Erro interno do servidor' }, 500);
  }
});
