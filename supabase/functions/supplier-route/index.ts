import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { corsHeaders, createCorsResponse } from './cors.ts';
import { validateAction, validateToken } from './validation.ts';
import { checkRateLimit } from './rate-limiting.ts';
import { handleError } from './error-handling.ts';
import { auditSecurityEvent } from './audit.ts';
import { fetchAssistanceData } from './assistance-data.ts';

// Simple hash function (matches frontend implementation)
function generateSimpleHash(assistanceId: number, salt: string = 'secure-salt-2024'): string {
  const data = `${assistanceId}-${salt}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
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
    const assistanceId = url.searchParams.get('id');
    const verifyHash = url.searchParams.get('verify');

    console.log(`Processing ${action} request with token: ${token?.substring(0, 10)}... or ID: ${assistanceId} from IP: ${clientIP}`);

    // Enhanced input validation - support both old token system and new ID+hash system
    const usingNewSystem = assistanceId && verifyHash;
    const usingOldSystem = token && typeof token === 'string';
    
    if (!usingNewSystem && !usingOldSystem) {
      await auditSecurityEvent(
        supabase,
        'MISSING_CREDENTIALS',
        'edge_function',
        0,
        clientIP,
        userAgent,
        { action, token_provided: !!token, id_provided: !!assistanceId, hash_provided: !!verifyHash }
      );
      return createCorsResponse({ error: 'Token ou credenciais de acesso não fornecidas' }, 400);
    }

    // Validate old token system if being used
    if (usingOldSystem && !validateToken(token)) {
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

    let finalAssistanceId: number;

    if (usingNewSystem) {
      // New system: validate ID + hash
      const idNum = parseInt(assistanceId);
      if (isNaN(idNum)) {
        return createCorsResponse({ error: 'ID de assistência inválido' }, 400);
      }

      // Simple hash verification (same algorithm as frontend)
      const expectedHash = generateSimpleHash(idNum, 'secure-salt-2024');
      if (expectedHash !== verifyHash) {
        await auditSecurityEvent(
          supabase,
          'HASH_VALIDATION_FAILED',
          'assistances',
          idNum,
          clientIP,
          userAgent,
          { action, provided_hash: verifyHash.substring(0, 8) }
        );
        return createCorsResponse({ error: 'Hash de verificação inválido' }, 400);
      }

      finalAssistanceId = idNum;
      console.log(`Hash validated successfully for assistance ID: ${finalAssistanceId}`);
    } else {
      // Old system: use direct token validation (EMERGENCY FIX)
      console.log(`🔄 Direct token validation for token: ${token.substring(0, 15)}...`);
      
      // Try to find assistance by token in any token field
      const { data: assistance, error: assistanceError } = await supabase
        .from('assistances')
        .select('id, status, supplier_id')
        .or(`acceptance_token.eq.${token},scheduling_token.eq.${token},validation_token.eq.${token},interaction_token.eq.${token}`)
        .single();

      if (assistanceError || !assistance) {
        console.error('Direct token validation failed:', assistanceError);
        
        await auditSecurityEvent(
          supabase,
          'TOKEN_VALIDATION_FAILED',
          'assistances',
          0,
          clientIP,
          userAgent,
          { 
            action, 
            error: assistanceError?.message || 'Token not found',
            method: 'direct_query'
          }
        );
        
        return handleError('Token inválido ou assistência não encontrada', assistanceError, 404);
      }

      finalAssistanceId = assistance.id;
      console.log(`✅ Direct token validation successful for assistance ID: ${finalAssistanceId}`);
    }
    
    // Get assistance data with enhanced security
    const assistance = await fetchAssistanceData(supabase, finalAssistanceId, clientIP, userAgent);

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
        buildings: assistance.buildings,
        suppliers: assistance.suppliers,
        intervention_types: assistance.intervention_types
      }
    });
  } catch (error) {
    console.error('Unexpected error in supplier-route:', error);
    return handleError('Erro interno do servidor', error);
  }
});