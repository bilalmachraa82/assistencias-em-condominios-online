-- FINAL SECURITY AUDIT: Disable public anon access to sensitive tables
-- This is a critical security measure to prevent unauthorized data access

-- Remove any remaining public access policies for anon users on sensitive tables
DROP POLICY IF EXISTS "Public read access for buildings" ON public.buildings;
DROP POLICY IF EXISTS "Public read access for suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Public read access for intervention_types" ON public.intervention_types;
DROP POLICY IF EXISTS "Public read access for valid_statuses" ON public.valid_statuses;

-- Ensure all sensitive data requires authentication
-- Buildings, suppliers, and configuration data should only be accessible to authenticated admin users
-- This prevents data enumeration attacks and unauthorized information disclosure

-- Create comprehensive audit trigger for monitoring all access attempts
CREATE OR REPLACE FUNCTION public.log_table_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all access attempts to sensitive tables
  INSERT INTO activity_log (description, actor, assistance_id)
  VALUES (
    format('Table access: %s operation on %s by %s', 
      TG_OP, 
      TG_TABLE_NAME, 
      COALESCE(auth.jwt() ->> 'email', 'anonymous')
    ),
    COALESCE(auth.jwt() ->> 'email', 'system'),
    CASE WHEN TG_TABLE_NAME = 'assistances' THEN 
      CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END
    ELSE NULL END
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add monitoring triggers to critical tables
DROP TRIGGER IF EXISTS audit_assistances_access ON public.assistances;
CREATE TRIGGER audit_assistances_access
  AFTER INSERT OR UPDATE OR DELETE ON public.assistances
  FOR EACH ROW EXECUTE FUNCTION public.log_table_access();

-- Final security validation: Ensure service role can still access everything
-- This is critical for the application to function while maintaining security
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;