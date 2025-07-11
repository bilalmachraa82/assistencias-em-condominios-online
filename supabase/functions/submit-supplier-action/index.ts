
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting store (in-memory for this example)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

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

// Helper function to handle errors consistently
function handleError(message: string, details: any = null, status = 500) {
  console.error(`Error: ${message}`, details);
  return createCorsResponse({ 
    error: message,
    details: details || undefined 
  }, status);
}

// Enhanced input validation functions
function validateAction(action: string): boolean {
  const validActions = ['accept', 'reject', 'schedule', 'reschedule', 'complete'];
  return typeof action === 'string' && validActions.includes(action.toLowerCase());
}

function validateToken(token: string): boolean {
  if (typeof token !== 'string') return false;
  // Enhanced token validation - proper format check
  const tokenPattern = /^[a-zA-Z0-9]+-[a-zA-Z0-9]{22}-[a-zA-Z0-9]{6}-[a-zA-Z0-9]{6}-[a-zA-Z0-9]{8}-[a-zA-Z0-9]{10}$/;
  return tokenPattern.test(token);
}

function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove HTML tags and scripts, limit length
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim()
      .slice(0, 1000);
  }
  return input;
}

function validateDateTime(dateTimeString: string): boolean {
  if (!dateTimeString) return false;
  const date = new Date(dateTimeString);
  return date instanceof Date && !isNaN(date.getTime()) && date > new Date();
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

// Mapping of action to required token field names
const tokenFieldMap = {
  'accept': 'acceptance_token',
  'reject': 'acceptance_token',
  'schedule': 'scheduling_token',
  'reschedule': 'scheduling_token',
  'complete': 'validation_token'
};

// UPDATED: Fixed status transitions to use only valid statuses
const statusTransitions = {
  'accept': (data?: any) => data?.datetime ? 'Agendado' : 'Pendente Aceitação',
  'reject': () => 'Recusada Fornecedor',
  'schedule': () => 'Agendado',
  'reschedule': () => 'Agendado',
  'complete': () => 'Pendente Validação'
};

// Extra data to include with updates based on action
function getExtraUpdateData(action: string, data?: any): Record<string, any> {
  switch(action) {
    case 'reject':
      return { rejection_reason: sanitizeInput(data?.reason) || '' };
    case 'schedule':
      return { scheduled_datetime: data?.datetime || null };
    case 'reschedule':
      return { 
        scheduled_datetime: data?.datetime || null,
        reschedule_reason: sanitizeInput(data?.reason) || '' 
      };
    case 'complete':
      return { validation_reminder_count: 0 };
    case 'accept':
      if (data?.datetime) {
        return { scheduled_datetime: data.datetime };
      }
      return {};
    default:
      return {};
  }
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
    
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Error parsing JSON body:", e);
      return handleError('Invalid JSON in request body', null, 400);
    }
    
    const { action, token, data } = body;

    console.log('Processing action:', action, 'with token:', token?.substring(0, 10) + '...');

    // Enhanced input validation
    if (!token || !action) {
      return handleError('Missing required parameters: token and action', null, 400);
    }
    
    if (!validateAction(action)) {
      await supabase.rpc('audit_security_event', {
        event_type: 'INVALID_ACTION_ATTEMPT',
        resource_type: 'edge_function',
        resource_id: 0,
        client_ip: clientIP,
        details: { action, token_prefix: token?.substring(0, 10) }
      });
      return handleError('Invalid action type', null, 400);
    }
    
    if (!validateToken(token)) {
      await supabase.rpc('audit_security_event', {
        event_type: 'INVALID_TOKEN_FORMAT',
        resource_type: 'edge_function', 
        resource_id: 0,
        client_ip: clientIP,
        details: { action, token_length: token?.length }
      });
      return handleError('Invalid token format', null, 400);
    }

    // Validate datetime if provided
    if (data?.datetime && !validateDateTime(data.datetime)) {
      return handleError('Invalid datetime format or date in the past', null, 400);
    }

    // Use secure validation function instead of direct database access
    const { data: validationResult, error: validationError } = await supabase.rpc('validate_edge_function_access', {
      p_token: token,
      p_action: action
    });

    if (validationError || !validationResult?.success) {
      console.error('Token validation failed:', validationError || validationResult);
      
      // Enhanced audit logging for failed access
      try {
        await supabase.rpc('audit_security_event', {
          event_type: 'SUPPLIER_ACTION_TOKEN_VALIDATION_FAILED',
          resource_type: 'assistances',
          resource_id: 0,
          client_ip: clientIP,
          details: { 
            action, 
            error: validationError?.message || validationResult?.error,
            error_code: validationResult?.code
          }
        });
      } catch (auditError) {
        console.error('Audit logging failed:', auditError);
      }
      
      return createCorsResponse(
        { error: validationResult?.error || 'Token inválido ou assistência não encontrada' },
        404
      );
    }

    const assistanceId = validationResult.assistance_id;
    const currentStatus = validationResult.current_status;
    console.log(`Token validated for assistance ID: ${assistanceId}, current status: ${currentStatus}`);

    // Determine the new status based on the action
    const determineStatus = statusTransitions[action] || (() => '');
    const newStatus = determineStatus(data);
    
    if (!newStatus) {
      return handleError('Status não pôde ser determinado para esta ação', null, 400);
    }
    
    console.log(`Setting status from "${currentStatus}" to "${newStatus}"`);
    
    // Use the secure update function that validates tokens and updates status
    try {
      const extraData = getExtraUpdateData(action, data);
      console.log('Extra update data:', extraData);
      
      // Use the new secure function for token-based updates
      const { data: updateResult, error: updateError } = await supabase.rpc('update_assistance_by_token', {
        p_assistance_id: assistanceId,
        p_token: token,
        p_new_status: newStatus,
        p_scheduled_datetime: extraData.scheduled_datetime || null,
        p_rejection_reason: extraData.rejection_reason || null,
        p_reschedule_reason: extraData.reschedule_reason || null
      });
        
      if (updateError) {
        console.error('Erro ao atualizar status via token function:', updateError);
        return handleError(`Erro ao processar ação: ${updateError.message}`, updateError, 500);
      }
      
      if (updateResult && !updateResult.success) {
        console.error('Token function returned error:', updateResult.error);
        return handleError(updateResult.error || 'Erro ao validar token', null, 403);
      }
      
      // Handle validation reminder count for complete action
      if (action === 'complete' && extraData.validation_reminder_count !== undefined) {
        const { error: reminderError } = await supabase
          .from('assistances')
          .update({ validation_reminder_count: extraData.validation_reminder_count })
          .eq('id', assistanceId);
          
        if (reminderError) {
          console.error('Erro ao atualizar contador de lembretes:', reminderError);
          // Don't fail the request for this
        }
      }
      
      console.log('Assistance updated successfully via secure token function');
      
    } catch (updateError) {
      console.error('Exception updating assistance:', updateError);
      return handleError('Erro ao processar ação', updateError, 500);
    }
    
    // Audit successful operation
    try {
      await supabase.rpc('audit_security_event', {
        event_type: 'SUPPLIER_ACTION_SUCCESS',
        resource_type: 'assistances',
        resource_id: assistanceId,
        client_ip: clientIP,
        details: { action, old_status: currentStatus, new_status: newStatus }
      });
    } catch (auditError) {
      console.error('Audit logging failed:', auditError);
    }

    // Log the activity
    try {
      await supabase
        .from('activity_log')
        .insert([{
          description: `Fornecedor: Ação ${action} realizada. Status atualizado para ${newStatus}`,
          actor: 'supplier',
          assistance_id: assistanceId
        }]);
    } catch (logError) {
      console.error('Erro ao registrar log de atividade:', logError);
      // Continue without failing if logging fails
    }

    return createCorsResponse({ 
      success: true, 
      message: 'Ação processada com sucesso' 
    });
  } catch (error) {
    console.error('Erro no processamento:', error.message);
    return handleError('Erro ao processar assistência', error.message);
  }
});
