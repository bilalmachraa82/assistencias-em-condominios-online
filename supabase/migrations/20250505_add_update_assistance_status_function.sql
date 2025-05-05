
-- Create a function to update assistance status directly
CREATE OR REPLACE FUNCTION update_assistance_status(
  p_assistance_id BIGINT,
  p_new_status TEXT,
  p_scheduled_datetime TIMESTAMPTZ DEFAULT NULL
) 
RETURNS VOID AS $$
BEGIN
  UPDATE assistances
  SET 
    status = p_new_status,
    scheduled_datetime = COALESCE(p_scheduled_datetime, scheduled_datetime),
    updated_at = NOW()
  WHERE id = p_assistance_id;
END;
$$ LANGUAGE plpgsql;
