
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting store (in-memory for this example)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20;

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

// Helper function for consistent error handling
function handleError(message: string, error: any = null, status = 500) {
  console.error(`Error: ${message}`, error);
  return createCorsResponse({ 
    error: message,
    details: error ? (error.message || JSON.stringify(error)) : undefined 
  }, status);
}

// Input validation functions
function validateAction(action: string): boolean {
  const validActions = ['accept', 'schedule', 'validate'];
  return validActions.includes(action);
}

function validateToken(token: string): boolean {
  if (typeof token !== 'string') return false;
  // Enhanced token validation - proper format check
  const tokenPattern = /^[a-zA-Z0-9]+-[a-zA-Z0-9]{22}-[a-zA-Z0-9]{6}-[a-zA-Z0-9]{6}-[a-zA-Z0-9]{8}-[a-zA-Z0-9]{10}$/;
  return tokenPattern.test(token);
}

// Rate limiting function
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitStore.get(identifier) || [];
  
  // Clean old requests
  const recentRequests = userRequests.filter((timestamp: number) => 
    now - timestamp < RATE_LIMIT_WINDOW
  );
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitStore.set(identifier, recentRequests);
  return true;
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

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Apply rate limiting
    if (!checkRateLimit(clientIP)) {
      return handleError('Rate limit exceeded. Please try again later.', null, 429);
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const token = url.searchParams.get('token');

    console.log(`Processing ${action} request with token: ${token?.substring(0, 10)}...`);

    // Input validation
    if (!token) {
      return createCorsResponse({ error: 'Token não fornecido' }, 400);
    }

    if (!validateToken(token)) {
      return createCorsResponse({ error: 'Formato de token inválido' }, 400);
    }

    if (action && !validateAction(action)) {
      return createCorsResponse({ error: 'Ação inválida' }, 400);
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
    
    console.log(`Using token field: ${tokenField} to query database`);
    
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
      console.error('Error fetching assistance:', assistanceError);
      
      // Audit failed access attempt
      try {
        await supabase.rpc('audit_sensitive_operation', {
          operation_type: 'FAILED_TOKEN_ACCESS',
          table_name: 'assistances',
          record_id: 0,
          details: { action, tokenField, error: assistanceError.message, clientIP }
        });
      } catch (auditError) {
        console.error('Audit logging failed:', auditError);
      }
      
      return handleError('Token inválido ou assistência não encontrada', assistanceError, 404);
    }

    console.log(`Found assistance with ID: ${assistance.id}, status: ${assistance.status}`);

    // Audit successful token access
    try {
      await supabase.rpc('audit_sensitive_operation', {
        operation_type: 'TOKEN_ACCESS',
        table_name: 'assistances',
        record_id: assistance.id,
        details: { action, tokenField, clientIP }
      });
    } catch (auditError) {
      console.error('Audit logging failed:', auditError);
    }

    // Return assistance data
    return createCorsResponse({ 
      success: true, 
      data: assistance 
    });
  } catch (error) {
    return handleError('Erro interno do servidor', error);
  }
});
