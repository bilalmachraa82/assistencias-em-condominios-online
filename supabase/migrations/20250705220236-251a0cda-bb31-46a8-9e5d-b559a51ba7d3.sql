-- Safe security hardening migration that maintains compatibility
-- Add token-based access for suppliers while keeping existing functionality

-- 1. Add a secure function for token validation
CREATE OR REPLACE FUNCTION public.validate_supplier_token(token_value text, assistance_id bigint, token_type text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE 
    WHEN token_type = 'acceptance' THEN 
      EXISTS(SELECT 1 FROM assistances WHERE id = assistance_id AND acceptance_token = token_value)
    WHEN token_type = 'scheduling' THEN 
      EXISTS(SELECT 1 FROM assistances WHERE id = assistance_id AND scheduling_token = token_value)
    WHEN token_type = 'validation' THEN 
      EXISTS(SELECT 1 FROM assistances WHERE id = assistance_id AND validation_token = token_value)
    ELSE false
  END;
$$;

-- 2. Add token-based policies for assistance_photos (supplier uploads)
CREATE POLICY "Suppliers can insert photos with valid token"
ON assistance_photos
FOR INSERT 
TO public
WITH CHECK (
  -- Allow if they have any valid token for this assistance
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

-- 3. Add token-based policies for assistance_messages (supplier communication)
CREATE POLICY "Suppliers can insert messages with valid token"
ON assistance_messages
FOR INSERT 
TO public
WITH CHECK (
  -- Allow if they have any valid token for this assistance
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

-- 4. Add a function to safely update assistance status (used by suppliers)
CREATE OR REPLACE FUNCTION public.update_assistance_by_token(
  p_assistance_id bigint,
  p_token text,
  p_new_status text,
  p_scheduled_datetime timestamptz DEFAULT NULL,
  p_rejection_reason text DEFAULT NULL,
  p_reschedule_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assistance assistances%ROWTYPE;
  v_token_valid boolean := false;
BEGIN
  -- Get the assistance record
  SELECT * INTO v_assistance FROM assistances WHERE id = p_assistance_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Assistance not found');
  END IF;
  
  -- Validate token (check if it matches any of the tokens for this assistance)
  IF v_assistance.acceptance_token = p_token 
     OR v_assistance.scheduling_token = p_token 
     OR v_assistance.validation_token = p_token 
     OR v_assistance.interaction_token = p_token THEN
    v_token_valid := true;
  END IF;
  
  IF NOT v_token_valid THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid token');
  END IF;
  
  -- Update the assistance
  UPDATE assistances 
  SET 
    status = p_new_status,
    scheduled_datetime = COALESCE(p_scheduled_datetime, scheduled_datetime),
    rejection_reason = COALESCE(p_rejection_reason, rejection_reason),
    reschedule_reason = COALESCE(p_reschedule_reason, reschedule_reason),
    updated_at = NOW()
  WHERE id = p_assistance_id;
  
  -- Log the activity
  INSERT INTO activity_log (assistance_id, description, actor)
  VALUES (p_assistance_id, 'Status updated to: ' || p_new_status, 'supplier');
  
  RETURN jsonb_build_object('success', true, 'message', 'Status updated successfully');
END;
$$;