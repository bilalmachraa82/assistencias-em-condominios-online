
-- Fix RLS policies for assistance_messages to allow public access for testing
DROP POLICY IF EXISTS "Admin read assistance_messages" ON public.assistance_messages;
DROP POLICY IF EXISTS "Admin insert assistance_messages" ON public.assistance_messages;

CREATE POLICY "Public read assistance_messages" ON public.assistance_messages
FOR SELECT USING (true);

CREATE POLICY "Public insert assistance_messages" ON public.assistance_messages
FOR INSERT WITH CHECK (true);

-- Fix RLS policies for assistance_photos to allow public access for testing
DROP POLICY IF EXISTS "Admin read assistance_photos" ON public.assistance_photos;
DROP POLICY IF EXISTS "Admin insert assistance_photos" ON public.assistance_photos;

CREATE POLICY "Public read assistance_photos" ON public.assistance_photos
FOR SELECT USING (true);

CREATE POLICY "Public insert assistance_photos" ON public.assistance_photos
FOR INSERT WITH CHECK (true);
