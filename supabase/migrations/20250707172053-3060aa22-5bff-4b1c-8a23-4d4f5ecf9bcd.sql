-- Phase 2: Fix get_user_role function to be more robust
-- Add proper error handling and UUID validation

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  -- Validate input
  IF user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get role with explicit error handling
  SELECT role INTO user_role 
  FROM public.user_roles 
  WHERE user_roles.user_id = $1 
  AND role = 'admin' 
  LIMIT 1;
  
  -- Return the role or NULL if not found
  RETURN user_role;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return NULL for safety
    RAISE LOG 'Error in get_user_role for user %: %', user_id, SQLERRM;
    RETURN NULL;
END;
$$;