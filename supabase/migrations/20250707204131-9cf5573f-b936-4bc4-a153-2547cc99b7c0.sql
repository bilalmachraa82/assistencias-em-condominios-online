-- Fix Portal access by allowing 'view' action to work with any valid token
-- Update validate_edge_function_access to handle portal/view access

CREATE OR REPLACE FUNCTION public.validate_edge_function_access(p_token text, p_action text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  assistance_record assistances%ROWTYPE;
  token_field TEXT;
  is_valid BOOLEAN := FALSE;
BEGIN
  -- Handle portal/view action - check all token types
  IF p_action = 'view' OR p_action = 'portal' THEN
    -- Find assistance with matching token in any token field
    SELECT * INTO assistance_record
    FROM assistances 
    WHERE acceptance_token = p_token 
       OR scheduling_token = p_token 
       OR validation_token = p_token 
       OR interaction_token = p_token;
    
    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'assistance_id', assistance_record.id,
        'current_status', assistance_record.status,
        'supplier_id', assistance_record.supplier_id
      );
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Invalid token or assistance not found',
        'code', 'INVALID_TOKEN'
      );
    END IF;
  END IF;
  
  -- Determine token field based on action (existing logic)
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
  
  -- Find assistance with matching token for specific action
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
$$;