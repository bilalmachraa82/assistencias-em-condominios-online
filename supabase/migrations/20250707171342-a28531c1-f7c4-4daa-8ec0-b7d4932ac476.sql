-- Fix RLS policy for assistances to work with user_roles table
-- The current policy checks for auth.jwt()->>'role' which doesn't exist
-- We need to use the get_user_role function instead

DROP POLICY IF EXISTS "Authenticated admin access to assistances" ON public.assistances;

CREATE POLICY "Authenticated admin access to assistances"
ON public.assistances
FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');