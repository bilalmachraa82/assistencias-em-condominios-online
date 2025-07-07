
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
  
  // More flexible token validation - check basic format and security requirements
  // Tokens should be at least 40 characters, contain only alphanumeric and hyphens
  if (token.length < 40) {
    console.log(`Token too short: ${token.length} characters`);
    return false;
  }
  
  // Allow alphanumeric characters and hyphens only (security check)
  const safePattern = /^[a-zA-Z0-9\-]+$/;
  const isValid = safePattern.test(token);
  
  if (!isValid) {
    console.log(`Token contains invalid characters: ${token.substring(0, 10)}...`);
  } else {
    console.log(`Token validation passed: ${token.substring(0, 10)}... (${token.length} chars)`);
  }
  
  return isValid;
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

    // Get client IP for rate limiting and audit
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Enhanced rate limiting with progressive penalties
    if (!checkRateLimit(clientIP)) {
      await supabase.rpc('audit_security_event', {
        event_type: 'RATE_LIMIT_EXCEEDED',
        resource_type: 'edge_function',
        resource_id: 0,
        client_ip: clientIP,
        user_agent: userAgent,
        details: { function_name: 'supplier-route' }
      });
      return handleError('Rate limit exceeded. Please try again later.', null, 429);
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const token = url.searchParams.get('token');

    console.log(`Processing ${action} request with token: ${token?.substring(0, 10)}... from IP: ${clientIP}`);

    // Enhanced input validation
    if (!token || typeof token !== 'string') {
      await supabase.rpc('audit_security_event', {
        event_type: 'MISSING_TOKEN',
        resource_type: 'edge_function',
        resource_id: 0,
        client_ip: clientIP,
        user_agent: userAgent,
        details: { action, token_provided: !!token }
      });
      return createCorsResponse({ error: 'Token não fornecido ou inválido' }, 400);
    }

    if (!validateToken(token)) {
      await supabase.rpc('audit_security_event', {
        event_type: 'INVALID_TOKEN_FORMAT',
        resource_type: 'edge_function',
        resource_id: 0,
        client_ip: clientIP,
        user_agent: userAgent,
        details: { action, token_length: token.length }
      });
      return createCorsResponse({ error: 'Formato de token inválido' }, 400);
    }

    if (action && !validateAction(action)) {
      await supabase.rpc('audit_security_event', {
        event_type: 'INVALID_ACTION',
        resource_type: 'edge_function',
        resource_id: 0,
        client_ip: clientIP,
        user_agent: userAgent,
        details: { action, token_prefix: token.substring(0, 10) }
      });
      return createCorsResponse({ error: 'Ação inválida' }, 400);
    }

    // Use secure validation function
    const { data: validationResult, error: validationError } = await supabase.rpc('validate_edge_function_access', {
      p_token: token,
      p_action: action || 'view'
    });

    if (validationError || !validationResult?.success) {
      console.error('Token validation failed:', validationError || validationResult);
      
      await supabase.rpc('audit_security_event', {
        event_type: 'TOKEN_VALIDATION_FAILED',
        resource_type: 'assistances',
        resource_id: 0,
        client_ip: clientIP,
        user_agent: userAgent,
        details: { 
          action, 
          error: validationError?.message || validationResult?.error,
          error_code: validationResult?.code
        }
      });
      
      return handleError(
        validationResult?.error || 'Token inválido ou assistência não encontrada', 
        validationError, 
        404
      );
    }

    const assistanceId = validationResult.assistance_id;
    console.log(`Token validated successfully for assistance ID: ${assistanceId}`);
    
    // Get assistance data with enhanced security
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
      .eq('id', assistanceId)
      .single();

    if (assistanceError || !assistance) {
      console.error('Error fetching assistance details:', assistanceError);
      
      await supabase.rpc('audit_security_event', {
        event_type: 'ASSISTANCE_DATA_FETCH_FAILED',
        resource_type: 'assistances',
        resource_id: assistanceId,
        client_ip: clientIP,
        user_agent: userAgent,
        details: { error: assistanceError?.message }
      });
      
      return handleError('Erro ao carregar dados da assistência', assistanceError, 500);
    }

    // Audit successful access
    await supabase.rpc('audit_security_event', {
      event_type: 'TOKEN_ACCESS_SUCCESS',
      resource_type: 'assistances',
      resource_id: assistance.id,
      client_ip: clientIP,
      user_agent: userAgent,
      details: { action, status: assistance.status }
    });

    console.log(`Successfully retrieved assistance data for ID: ${assistance.id}, status: ${assistance.status}`);

    // Return assistance data with sanitized output
    return createCorsResponse({ 
      success: true, 
      data: {
        id: assistance.id,
        description: assistance.description,
        status: assistance.status,
        type: assistance.type,
        building: assistance.buildings,
        supplier: assistance.suppliers,
        intervention_type: assistance.intervention_types
      }
    });
  } catch (error) {
    console.error('Unexpected error in supplier-route:', error);
    return handleError('Erro interno do servidor', error);
  }
});
