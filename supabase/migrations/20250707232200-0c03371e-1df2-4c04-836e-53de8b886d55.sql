-- Fix the corrupted token by updating it to the correct format
-- The token "izin01xxnqa2v71dccgf" should be "izin0ixxnqa2v71dccgf"
UPDATE assistances 
SET acceptance_token = 'izin0ixxnqa2v71dccgf'
WHERE id = 45 AND acceptance_token = 'izin0ixxnqa2v71dccgf';

-- Also ensure all assistances have at least one valid token
UPDATE assistances 
SET interaction_token = COALESCE(interaction_token, 
  COALESCE(acceptance_token, 
    COALESCE(scheduling_token, validation_token)
  )
)
WHERE interaction_token IS NULL OR interaction_token = '';