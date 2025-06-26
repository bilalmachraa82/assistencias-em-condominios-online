
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

// Input validation functions
function validateAction(action: string): boolean {
  const validActions = ['accept', 'reject', 'schedule', 'reschedule', 'complete'];
  return validActions.includes(action);
}

function validateToken(token: string): boolean {
  return typeof token === 'string' && token.length >= 10 && /^[a-zA-Z0-9-_]+$/.test(token);
}

function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim().slice(0, 1000); // Limit length and trim
  }
  return input;
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

    // Input validation
    if (!token || !action) {
      return handleError('Missing required parameters: token and action', null, 400);
    }
    
    if (!validateAction(action)) {
      return handleError('Invalid action type', null, 400);
    }
    
    if (!validateToken(token)) {
      return handleError('Invalid token format', null, 400);
    }

    // Get token field for this action
    const tokenField = tokenFieldMap[action];

    // First, get the assistance to verify it exists and check current status
    const { data: assistance, error: assistanceError } = await supabase
      .from('assistances')
      .select('id, status, supplier_id')
      .eq(tokenField, token)
      .single();

    if (assistanceError) {
      console.error('Erro ao buscar assistência:', assistanceError);
      
      // Audit failed access attempt
      try {
        await supabase.rpc('audit_sensitive_operation', {
          operation_type: 'FAILED_TOKEN_ACCESS',
          table_name: 'assistances',
          record_id: 0,
          details: { action, tokenField, error: assistanceError.message }
        });
      } catch (auditError) {
        console.error('Audit logging failed:', auditError);
      }
      
      return createCorsResponse(
        { error: 'Token inválido ou assistência não encontrada' },
        404
      );
    }

    console.log('Found assistance:', assistance);

    // Determine the new status based on the action
    const determineStatus = statusTransitions[action] || (() => '');
    const newStatus = determineStatus(data);
    
    if (!newStatus) {
      return handleError('Status não pôde ser determinado para esta ação', null, 400);
    }
    
    console.log(`Setting status from "${assistance.status}" to "${newStatus}"`);
    
    // Update assistance using the RPC function for consistent handling
    try {
      const extraData = getExtraUpdateData(action, data);
      console.log('Extra update data:', extraData);
      
      // Use the RPC function for status updates
      const { error: updateError } = await supabase.rpc('update_assistance_status', {
        p_assistance_id: assistance.id,
        p_new_status: newStatus,
        p_scheduled_datetime: extraData.scheduled_datetime || null
      });
        
      if (updateError) {
        console.error('Erro ao atualizar status via RPC:', updateError);
        return handleError(`Erro ao processar ação: ${updateError.message}`, updateError, 500);
      }
      
      // Update additional fields if needed
      if (Object.keys(extraData).length > 1 || (Object.keys(extraData).length === 1 && !extraData.scheduled_datetime)) {
        const additionalUpdate: any = { updated_at: new Date().toISOString() };
        
        if (extraData.rejection_reason) additionalUpdate.rejection_reason = extraData.rejection_reason;
        if (extraData.reschedule_reason) additionalUpdate.reschedule_reason = extraData.reschedule_reason;
        if (extraData.validation_reminder_count !== undefined) additionalUpdate.validation_reminder_count = extraData.validation_reminder_count;
        
        const { error: additionalError } = await supabase
          .from('assistances')
          .update(additionalUpdate)
          .eq('id', assistance.id);
          
        if (additionalError) {
          console.error('Erro ao atualizar campos adicionais:', additionalError);
          // Don't fail the request for additional field errors
        }
      }
      
      console.log('Assistance updated successfully');
      
    } catch (updateError) {
      console.error('Exception updating assistance:', updateError);
      return handleError('Erro ao processar ação', updateError, 500);
    }
    
    // Audit successful operation
    try {
      await supabase.rpc('audit_sensitive_operation', {
        operation_type: 'SUPPLIER_ACTION',
        table_name: 'assistances',
        record_id: assistance.id,
        details: { action, newStatus, clientIP }
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
          assistance_id: assistance.id
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
