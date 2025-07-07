import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { corsHeaders, createCorsResponse } from './cors.ts';
import { validateAction, validateToken } from './validation.ts';
import { checkRateLimit } from './rate-limiting.ts';
import { handleError } from './error-handling.ts';
import { auditSecurityEvent } from './audit.ts';
import { fetchAssistanceData } from './assistance-data.ts';

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
      await auditSecurityEvent(
        supabase,
        'RATE_LIMIT_EXCEEDED',
        'edge_function',
        0,
        clientIP,
        userAgent,
        { function_name: 'supplier-route' }
      );
      return handleError('Rate limit exceeded. Please try again later.', null, 429);
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const token = url.searchParams.get('token');

    console.log(`Processing ${action} request with token: ${token?.substring(0, 10)}... from IP: ${clientIP}`);

    // Enhanced input validation
    if (!token || typeof token !== 'string') {
      await auditSecurityEvent(
        supabase,
        'MISSING_TOKEN',
        'edge_function',
        0,
        clientIP,
        userAgent,
        { action, token_provided: !!token }
      );
      return createCorsResponse({ error: 'Token não fornecido ou inválido' }, 400);
    }

    if (!validateToken(token)) {
      await auditSecurityEvent(
        supabase,
        'INVALID_TOKEN_FORMAT',
        'edge_function',
        0,
        clientIP,
        userAgent,
        { action, token_length: token.length }
      );
      return createCorsResponse({ error: 'Formato de token inválido' }, 400);
    }

    if (action && !validateAction(action)) {
      await auditSecurityEvent(
        supabase,
        'INVALID_ACTION',
        'edge_function',
        0,
        clientIP,
        userAgent,
        { action, token_prefix: token.substring(0, 10) }
      );
      return createCorsResponse({ error: 'Ação inválida' }, 400);
    }

    // Use secure validation function
    const { data: validationResult, error: validationError } = await supabase.rpc('validate_edge_function_access', {
      p_token: token,
      p_action: action || 'view'
    });

    if (validationError || !validationResult?.success) {
      console.error('Token validation failed:', validationError || validationResult);
      
      await auditSecurityEvent(
        supabase,
        'TOKEN_VALIDATION_FAILED',
        'assistances',
        0,
        clientIP,
        userAgent,
        { 
          action, 
          error: validationError?.message || validationResult?.error,
          error_code: validationResult?.code
        }
      );
      
      return handleError(
        validationResult?.error || 'Token inválido ou assistência não encontrada', 
        validationError, 
        404
      );
    }

    const assistanceId = validationResult.assistance_id;
    console.log(`Token validated successfully for assistance ID: ${assistanceId}`);
    
    // Get assistance data with enhanced security
    const assistance = await fetchAssistanceData(supabase, assistanceId, clientIP, userAgent);

    // Audit successful access
    await auditSecurityEvent(
      supabase,
      'TOKEN_ACCESS_SUCCESS',
      'assistances',
      assistance.id,
      clientIP,
      userAgent,
      { action, status: assistance.status }
    );

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