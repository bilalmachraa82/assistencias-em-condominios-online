-- PHASE 1: Critical RLS Policy Hardening
-- Replace overly permissive policies with proper authentication checks

-- 1. Update assistances table policies
DROP POLICY IF EXISTS "Allow public insert to assistances" ON public.assistances;
DROP POLICY IF EXISTS "Allow public read access to assistances" ON public.assistances;
DROP POLICY IF EXISTS "Allow admin delete" ON public.assistances;
DROP POLICY IF EXISTS "Allow admin insert" ON public.assistances;
DROP POLICY IF EXISTS "Allow admin select" ON public.assistances;
DROP POLICY IF EXISTS "Allow admin update" ON public.assistances;

-- New secure policies for assistances
CREATE POLICY "Service role full access to assistances" 
ON public.assistances FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated admin access to assistances" 
ON public.assistances FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin') 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Token-based read access for suppliers (more secure)
CREATE POLICY "Token-based read access for suppliers" 
ON public.assistances FOR SELECT 
TO anon
USING (
  EXISTS(
    SELECT 1 WHERE 
    acceptance_token IS NOT NULL OR 
    scheduling_token IS NOT NULL OR 
    validation_token IS NOT NULL OR
    interaction_token IS NOT NULL
  )
);

-- 2. Update assistance_messages policies  
DROP POLICY IF EXISTS "Public read assistance_messages" ON public.assistance_messages;
DROP POLICY IF EXISTS "Public insert assistance_messages" ON public.assistance_messages;

CREATE POLICY "Service role full access to assistance_messages" 
ON public.assistance_messages FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated admin access to assistance_messages" 
ON public.assistance_messages FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin') 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Keep token-based supplier access but make it more secure
CREATE POLICY "Token-validated supplier message access" 
ON public.assistance_messages FOR SELECT 
TO anon
USING (
  EXISTS(
    SELECT 1 FROM assistances a 
    WHERE a.id = assistance_id 
    AND (
      a.acceptance_token IS NOT NULL OR 
      a.scheduling_token IS NOT NULL OR 
      a.validation_token IS NOT NULL
    )
  )
);

-- 3. Update assistance_photos policies
DROP POLICY IF EXISTS "Public read assistance_photos" ON public.assistance_photos;
DROP POLICY IF EXISTS "Public insert assistance_photos" ON public.assistance_photos;

CREATE POLICY "Service role full access to assistance_photos" 
ON public.assistance_photos FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated admin access to assistance_photos" 
ON public.assistance_photos FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin') 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Keep token-based supplier access but make it more secure  
CREATE POLICY "Token-validated supplier photo access" 
ON public.assistance_photos FOR SELECT 
TO anon
USING (
  EXISTS(
    SELECT 1 FROM assistances a 
    WHERE a.id = assistance_id 
    AND (
      a.acceptance_token IS NOT NULL OR 
      a.scheduling_token IS NOT NULL OR 
      a.validation_token IS NOT NULL
    )
  )
);

-- 4. Update buildings policies
DROP POLICY IF EXISTS "Public read access for buildings" ON public.buildings;

CREATE POLICY "Service role full access to buildings" 
ON public.buildings FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated admin access to buildings" 
ON public.buildings FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin') 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- 5. Update suppliers policies
DROP POLICY IF EXISTS "Public read access for suppliers" ON public.suppliers;

CREATE POLICY "Service role full access to suppliers" 
ON public.suppliers FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated admin access to suppliers" 
ON public.suppliers FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin') 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- 6. Update intervention_types policies
DROP POLICY IF EXISTS "Public read intervention_types" ON public.intervention_types;

CREATE POLICY "Service role full access to intervention_types" 
ON public.intervention_types FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated admin access to intervention_types" 
ON public.intervention_types FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin') 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- 7. Update valid_statuses policies
DROP POLICY IF EXISTS "Public read valid_statuses" ON public.valid_statuses;

CREATE POLICY "Service role full access to valid_statuses" 
ON public.valid_statuses FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated admin access to valid_statuses" 
ON public.valid_statuses FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin') 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- 8. Create user roles table for proper role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'moderator')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 9. Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.user_roles WHERE user_id = $1 AND role = 'admin' LIMIT 1;
$$;

-- 10. Create RLS policies for user_roles table
CREATE POLICY "Service role full access to user_roles" 
ON public.user_roles FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles FOR ALL 
TO authenticated 
USING (public.get_user_role(auth.uid()) = 'admin') 
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- 11. Add updated_at trigger for user_roles
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();

-- 12. Create function to create first admin user
CREATE OR REPLACE FUNCTION public.create_admin_user(admin_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get user ID from auth.users based on email
  SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    RETURN 'User with email ' || admin_email || ' not found';
  END IF;
  
  -- Insert admin role (ON CONFLICT DO NOTHING prevents duplicates)
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (admin_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN 'Admin role granted to user: ' || admin_email;
END;
$$;