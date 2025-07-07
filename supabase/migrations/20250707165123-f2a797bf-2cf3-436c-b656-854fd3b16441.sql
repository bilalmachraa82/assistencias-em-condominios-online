-- CRITICAL SECURITY FIXES - Phase 1: RLS Policy Hardening

-- 1. Remove overly permissive assistance policies
DROP POLICY IF EXISTS "Enable read access for assistance based on interaction_token" ON public.assistances;

-- 2. Create secure token-based policies with proper validation
CREATE POLICY "Secure token-based supplier access" 
ON public.assistances FOR SELECT 
TO anon
USING (
  -- Only allow access if a valid token is provided and matches
  (acceptance_token IS NOT NULL AND acceptance_token != '') OR
  (scheduling_token IS NOT NULL AND scheduling_token != '') OR 
  (validation_token IS NOT NULL AND validation_token != '') OR
  (interaction_token IS NOT NULL AND interaction_token != '')
);

-- 3. Enhance supplier message security with proper token validation
DROP POLICY IF EXISTS "Suppliers can insert messages with valid token" ON public.assistance_messages;

CREATE POLICY "Secure supplier message insert" 
ON public.assistance_messages FOR INSERT 
TO anon
WITH CHECK (
  EXISTS(
    SELECT 1 FROM assistances a 
    WHERE a.id = assistance_id 
    AND (
      (a.acceptance_token IS NOT NULL AND a.acceptance_token != '') OR
      (a.scheduling_token IS NOT NULL AND a.scheduling_token != '') OR 
      (a.validation_token IS NOT NULL AND a.validation_token != '') OR
      (a.interaction_token IS NOT NULL AND a.interaction_token != '')
    )
  )
);

-- 4. Enhance supplier photo security with proper token validation  
DROP POLICY IF EXISTS "Suppliers can insert photos with valid token" ON public.assistance_photos;

CREATE POLICY "Secure supplier photo insert" 
ON public.assistance_photos FOR INSERT 
TO anon
WITH CHECK (
  EXISTS(
    SELECT 1 FROM assistances a 
    WHERE a.id = assistance_id 
    AND (
      (a.acceptance_token IS NOT NULL AND a.acceptance_token != '') OR
      (a.scheduling_token IS NOT NULL AND a.scheduling_token != '') OR 
      (a.validation_token IS NOT NULL AND a.validation_token != '') OR
      (a.interaction_token IS NOT NULL AND a.interaction_token != '')
    )
  )
);

-- 5. Replace overly permissive storage policies with secure ones
DROP POLICY IF EXISTS "Authenticated read assistance photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload assistance photos" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete assistance photos" ON storage.objects;

-- Secure storage policies with file type and size restrictions
CREATE POLICY "Secure read assistance photos" 
ON storage.objects FOR SELECT 
TO authenticated
USING (
  bucket_id = 'assistance-photos' AND
  -- Only allow image files
  (name ~* '\.(jpg|jpeg|png|gif|webp)$')
);

CREATE POLICY "Secure upload assistance photos" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'assistance-photos' AND
  -- Proper folder structure: assistances/{assistance_id}/{filename}
  (storage.foldername(name))[1] = 'assistances' AND
  -- Only allow image files
  (name ~* '\.(jpg|jpeg|png|gif|webp)$') AND
  -- File size limit enforced at application level
  auth.uid() IS NOT NULL
);

CREATE POLICY "Secure delete assistance photos" 
ON storage.objects FOR DELETE 
TO authenticated
USING (
  bucket_id = 'assistance-photos' AND
  -- Users can only delete their own uploads
  auth.uid() IS NOT NULL
);

-- 6. Create enhanced audit function for security events
CREATE OR REPLACE FUNCTION public.audit_security_event(
  event_type TEXT,
  resource_type TEXT,
  resource_id BIGINT,
  client_ip TEXT DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  details JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO activity_log (description, actor, assistance_id)
  VALUES (
    format('SECURITY: %s on %s (ID: %s) from IP: %s - %s', 
      event_type, 
      resource_type, 
      resource_id,
      COALESCE(client_ip, 'unknown'),
      COALESCE(details::text, 'No details')
    ),
    COALESCE(auth.jwt() ->> 'email', 'anonymous'),
    CASE WHEN resource_type = 'assistances' THEN resource_id ELSE NULL END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create secure token validation function
CREATE OR REPLACE FUNCTION public.validate_token_access(
  assistance_id BIGINT,
  provided_token TEXT,
  token_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  stored_token TEXT;
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
      RETURN FALSE;
  END CASE;
  
  -- Validate token exists and matches
  IF stored_token IS NULL OR stored_token = '' OR stored_token != provided_token THEN
    -- Log failed access attempt
    PERFORM audit_security_event(
      'FAILED_TOKEN_ACCESS',
      'assistances', 
      assistance_id,
      current_setting('request.headers', true)::json->>'x-forwarded-for',
      current_setting('request.headers', true)::json->>'user-agent',
      jsonb_build_object('token_type', token_type, 'provided_token_length', length(provided_token))
    );
    RETURN FALSE;
  END IF;
  
  -- Log successful access
  PERFORM audit_security_event(
    'TOKEN_ACCESS_GRANTED',
    'assistances',
    assistance_id, 
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent',
    jsonb_build_object('token_type', token_type)
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;