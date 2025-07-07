-- EMERGENCY FIX: Fix log_table_access function to comply with activity_log_actor_check constraint
-- The current function inserts user email directly, but constraint only allows 'system', 'admin', 'supplier'

CREATE OR REPLACE FUNCTION public.log_table_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
  mapped_actor text;
BEGIN
  -- Get the user's role safely
  BEGIN
    SELECT get_user_role(auth.uid()) INTO user_role;
  EXCEPTION WHEN OTHERS THEN
    user_role := NULL;
  END;
  
  -- Map user role to valid actor values
  IF user_role = 'admin' THEN
    mapped_actor := 'admin';
  ELSIF auth.uid() IS NOT NULL THEN
    mapped_actor := 'supplier'; -- Authenticated but not admin
  ELSE
    mapped_actor := 'system'; -- Anonymous or system operations
  END IF;
  
  -- Log all access attempts to sensitive tables
  INSERT INTO activity_log (description, actor, assistance_id)
  VALUES (
    format('Table access: %s operation on %s by %s', 
      TG_OP, 
      TG_TABLE_NAME, 
      COALESCE(auth.jwt() ->> 'email', 'anonymous')
    ),
    mapped_actor, -- Now uses constraint-compliant values
    CASE WHEN TG_TABLE_NAME = 'assistances' THEN 
      CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END
    ELSE NULL END
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;