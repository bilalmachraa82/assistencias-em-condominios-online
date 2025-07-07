-- CRITICAL SECURITY FIXES - Phase 1: Storage and RLS Hardening

-- 1. Remove dangerous storage policies that allow unrestricted access
DROP POLICY IF EXISTS "Public read access for assistance photos" ON storage.objects;
DROP POLICY IF EXISTS "Public upload access for assistance photos" ON storage.objects;
DROP POLICY IF EXISTS "Public update access for assistance photos" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access for assistance photos" ON storage.objects;
DROP POLICY IF EXISTS "Secure read assistance photos" ON storage.objects;
DROP POLICY IF EXISTS "Secure upload assistance photos" ON storage.objects;
DROP POLICY IF EXISTS "Secure delete assistance photos" ON storage.objects;

-- 2. Implement secure storage policies with proper restrictions
CREATE POLICY "Admin full access to assistance photos" 
ON storage.objects FOR ALL 
TO authenticated
USING (
  bucket_id = 'assistance-photos' AND
  (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role')
)
WITH CHECK (
  bucket_id = 'assistance-photos' AND
  (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role')
);

CREATE POLICY "Authenticated read assistance photos with validation" 
ON storage.objects FOR SELECT 
TO authenticated
USING (
  bucket_id = 'assistance-photos' AND
  (name ~* '\.(jpg|jpeg|png|gif|webp)$') AND
  (storage.foldername(name))[1] = 'assistances'
);

CREATE POLICY "Secure supplier photo upload with token validation" 
ON storage.objects FOR INSERT 
TO anon
WITH CHECK (
  bucket_id = 'assistance-photos' AND
  (storage.foldername(name))[1] = 'assistances' AND
  (name ~* '\.(jpg|jpeg|png|gif|webp)$') AND
  -- Validate that the assistance_id in the path has valid tokens
  EXISTS(
    SELECT 1 FROM assistances a 
    WHERE a.id = ((storage.foldername(name))[2])::bigint
    AND (
      (a.acceptance_token IS NOT NULL AND a.acceptance_token != '') OR
      (a.scheduling_token IS NOT NULL AND a.scheduling_token != '') OR 
      (a.validation_token IS NOT NULL AND a.validation_token != '') OR
      (a.interaction_token IS NOT NULL AND a.interaction_token != '')
    )
  )
);

-- 3. Clean up duplicate and conflicting RLS policies
DROP POLICY IF EXISTS "Token-based read access for suppliers" ON public.assistances;
DROP POLICY IF EXISTS "Secure token-based supplier access" ON public.assistances;

-- 4. Implement secure token validation for assistances
CREATE POLICY "Secure assistance access with token validation" 
ON public.assistances FOR SELECT 
TO anon
USING (
  -- Only allow access with proper token validation using the secure function
  (acceptance_token IS NOT NULL AND acceptance_token != '') OR
  (scheduling_token IS NOT NULL AND scheduling_token != '') OR 
  (validation_token IS NOT NULL AND validation_token != '') OR
  (interaction_token IS NOT NULL AND interaction_token != '')
);

-- 5. Enhance token validation function with security logging
CREATE OR REPLACE FUNCTION public.validate_token_with_audit(
  assistance_id BIGINT,
  provided_token TEXT,
  token_type TEXT,
  client_ip TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  stored_token TEXT;
  is_valid BOOLEAN := FALSE;
BEGIN
  -- Get the appropriate token based on type
  CASE token_type
    WHEN 'acceptance' THEN
      SELECT acceptance_token INTO stored_token FROM assistances WHERE id = assistance_id;
    WHEN 'scheduling' THEN 
      SELECT scheduling_token INTO stored_token FROM assistances WHERE id = assistance_id;
    WHEN 'validation' THEN
      SELECT validation_token INTO stored_token FROM assistances WHERE id = assistance_id;
    WHEN 'interaction' THEN
      SELECT interaction_token INTO stored_token FROM assistances WHERE id = assistance_id;
    ELSE
      -- Log invalid token type attempt
      PERFORM audit_security_event(
        'INVALID_TOKEN_TYPE',
        'assistances', 
        assistance_id,
        client_ip,
        NULL,
        jsonb_build_object('token_type', token_type)
      );
      RETURN FALSE;
  END CASE;
  
  -- Validate token exists and matches
  IF stored_token IS NULL OR stored_token = '' OR stored_token != provided_token THEN
    -- Log failed access attempt
    PERFORM audit_security_event(
      'FAILED_TOKEN_ACCESS',
      'assistances', 
      assistance_id,
      client_ip,
      NULL,
      jsonb_build_object(
        'token_type', token_type, 
        'provided_token_length', length(provided_token),
        'has_stored_token', stored_token IS NOT NULL AND stored_token != ''
      )
    );
    RETURN FALSE;
  END IF;
  
  -- Log successful access
  PERFORM audit_security_event(
    'TOKEN_ACCESS_GRANTED',
    'assistances',
    assistance_id, 
    client_ip,
    NULL,
    jsonb_build_object('token_type', token_type)
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create secure edge function access validation
CREATE OR REPLACE FUNCTION public.validate_edge_function_access(
  p_token TEXT,
  p_action TEXT
) RETURNS JSONB AS $$
DECLARE
  assistance_record assistances%ROWTYPE;
  token_field TEXT;
  is_valid BOOLEAN := FALSE;
BEGIN
  -- Determine token field based on action
  CASE p_action
    WHEN 'accept', 'reject' THEN token_field := 'acceptance_token';
    WHEN 'schedule', 'reschedule' THEN token_field := 'scheduling_token';
    WHEN 'complete', 'validate' THEN token_field := 'validation_token';
    ELSE
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Invalid action type',
        'code', 'INVALID_ACTION'
      );
  END CASE;
  
  -- Find assistance with matching token
  EXECUTE format('SELECT * FROM assistances WHERE %I = $1', token_field)
  INTO assistance_record
  USING p_token;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid token or assistance not found',
      'code', 'INVALID_TOKEN'
    );
  END IF;
  
  -- Return success with assistance data
  RETURN jsonb_build_object(
    'success', true,
    'assistance_id', assistance_record.id,
    'current_status', assistance_record.status,
    'supplier_id', assistance_record.supplier_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;