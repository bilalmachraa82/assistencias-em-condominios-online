
-- Phase 1: Critical RLS Implementation for all tables

-- 1. Enable RLS on all tables that don't have it
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervention_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valid_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistance_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistance_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Public read assistance_messages" ON public.assistance_messages;
DROP POLICY IF EXISTS "Public insert assistance_messages" ON public.assistance_messages;
DROP POLICY IF EXISTS "Public read assistance_photos" ON public.assistance_photos;
DROP POLICY IF EXISTS "Public insert assistance_photos" ON public.assistance_photos;

-- 2. Create secure RLS policies for suppliers (Admin only)
CREATE POLICY "Admin full access to suppliers" ON public.suppliers
FOR ALL USING (
  auth.role() = 'service_role' OR 
  auth.jwt() ->> 'role' = 'admin'
);

-- 3. Create secure RLS policies for buildings (Admin only)
CREATE POLICY "Admin full access to buildings" ON public.buildings
FOR ALL USING (
  auth.role() = 'service_role' OR 
  auth.jwt() ->> 'role' = 'admin'
);

-- 4. Create secure RLS policies for intervention_types
CREATE POLICY "Public read intervention_types" ON public.intervention_types
FOR SELECT USING (true);

CREATE POLICY "Admin modify intervention_types" ON public.intervention_types
FOR ALL USING (
  auth.role() = 'service_role' OR 
  auth.jwt() ->> 'role' = 'admin'
);

-- 5. Create secure RLS policies for valid_statuses
CREATE POLICY "Public read valid_statuses" ON public.valid_statuses
FOR SELECT USING (true);

CREATE POLICY "Admin modify valid_statuses" ON public.valid_statuses
FOR ALL USING (
  auth.role() = 'service_role' OR 
  auth.jwt() ->> 'role' = 'admin'
);

-- 6. Create secure RLS policies for email_logs (Admin only)
CREATE POLICY "Admin full access to email_logs" ON public.email_logs
FOR ALL USING (
  auth.role() = 'service_role' OR 
  auth.jwt() ->> 'role' = 'admin'
);

-- 7. Create secure RLS policies for activity_log (Admin only)
CREATE POLICY "Admin full access to activity_log" ON public.activity_log
FOR ALL USING (
  auth.role() = 'service_role' OR 
  auth.jwt() ->> 'role' = 'admin'
);

-- 8. Create secure RLS policies for assistance_messages
CREATE POLICY "Admin read assistance_messages" ON public.assistance_messages
FOR SELECT USING (
  auth.role() = 'service_role' OR 
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admin insert assistance_messages" ON public.assistance_messages
FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR 
  auth.jwt() ->> 'role' = 'admin'
);

-- 9. Create secure RLS policies for assistance_photos
CREATE POLICY "Admin read assistance_photos" ON public.assistance_photos
FOR SELECT USING (
  auth.role() = 'service_role' OR 
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admin insert assistance_photos" ON public.assistance_photos
FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR 
  auth.jwt() ->> 'role' = 'admin'
);

-- Phase 2: Storage Security Hardening
-- Remove overly permissive storage policies
DROP POLICY IF EXISTS "Public read access for assistance photos" ON storage.objects;
DROP POLICY IF EXISTS "Public upload access for assistance photos" ON storage.objects;
DROP POLICY IF EXISTS "Public update access for assistance photos" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access for assistance photos" ON storage.objects;

-- Create secure storage policies with proper restrictions
CREATE POLICY "Authenticated read assistance photos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'assistance-photos');

CREATE POLICY "Authenticated upload assistance photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'assistance-photos' AND
  (storage.foldername(name))[1] = 'assistances' AND
  -- File size limit (5MB) will be enforced in application code
  -- File type restrictions will be enforced in application code
  auth.uid() IS NOT NULL
);

CREATE POLICY "Owner delete assistance photos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'assistance-photos' AND
  auth.uid()::text = (storage.foldername(name))[3] -- Assuming folder structure: assistances/assistance_id/user_id/filename
);

-- Service role bypass for system operations
CREATE POLICY "Service role full access assistance photos" ON storage.objects
FOR ALL TO service_role
USING (bucket_id = 'assistance-photos');

-- Create audit function for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_operation(
  operation_type TEXT,
  table_name TEXT,
  record_id BIGINT,
  details JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO activity_log (description, actor, assistance_id)
  VALUES (
    format('AUDIT: %s on %s (ID: %s) - %s', 
      operation_type, 
      table_name, 
      record_id, 
      COALESCE(details::text, 'No details')
    ),
    COALESCE(auth.jwt() ->> 'email', 'system'),
    CASE WHEN table_name = 'assistances' THEN record_id ELSE NULL END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
