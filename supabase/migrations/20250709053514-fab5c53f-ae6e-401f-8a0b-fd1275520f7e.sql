-- EMERGENCY CRITICAL FIX: Complete rewrite of delete_assistance_safely without ANY logging after deletion
-- Also fix RLS policies for activity_log to allow proper admin access

-- 1. Fix delete_assistance_safely - NO logging after deletion to prevent foreign key violations
CREATE OR REPLACE FUNCTION public.delete_assistance_safely(p_assistance_id bigint)
RETURNS jsonb
SET search_path = public
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assistance_exists boolean;
    v_activity_count integer;
    v_photo_count integer;
    v_message_count integer;
    v_email_count integer;
    v_building_name text;
    v_supplier_name text;
BEGIN
    -- Verificar se a assistência existe e obter informações para logging
    SELECT EXISTS(SELECT 1 FROM assistances WHERE id = p_assistance_id) INTO v_assistance_exists;
    
    IF NOT v_assistance_exists THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Assistência não encontrada.', 
            'assistance_id', p_assistance_id
        );
    END IF;

    -- Obter informações da assistência para logging antes da eliminação
    SELECT 
        b.name,
        s.name
    INTO v_building_name, v_supplier_name
    FROM assistances a
    LEFT JOIN buildings b ON a.building_id = b.id
    LEFT JOIN suppliers s ON a.supplier_id = s.id
    WHERE a.id = p_assistance_id;

    -- Contar registos relacionados antes de os eliminar
    SELECT COUNT(*) INTO v_activity_count FROM activity_log WHERE assistance_id = p_assistance_id;
    SELECT COUNT(*) INTO v_photo_count FROM assistance_photos WHERE assistance_id = p_assistance_id;
    SELECT COUNT(*) INTO v_message_count FROM assistance_messages WHERE assistance_id = p_assistance_id;
    SELECT COUNT(*) INTO v_email_count FROM email_logs WHERE assistance_id = p_assistance_id;

    -- Executar eliminação em transação SEM qualquer logging final
    BEGIN
        -- Eliminar registos das tabelas dependentes primeiro (ordem importante para foreign keys)
        DELETE FROM assistance_photos WHERE assistance_id = p_assistance_id;
        DELETE FROM assistance_messages WHERE assistance_id = p_assistance_id;
        DELETE FROM email_logs WHERE assistance_id = p_assistance_id;
        DELETE FROM activity_log WHERE assistance_id = p_assistance_id;
        
        -- Eliminar a assistência principal
        DELETE FROM assistances WHERE id = p_assistance_id;
        
        -- Verificar se a eliminação foi bem-sucedida
        IF NOT EXISTS(SELECT 1 FROM assistances WHERE id = p_assistance_id) THEN
            -- SUCCESS: Return success WITHOUT any logging to avoid foreign key violation
            RETURN jsonb_build_object(
                'success', true,
                'message', 'Assistência e todos os dados associados foram eliminados com sucesso.',
                'assistance_id', p_assistance_id,
                'deleted_counts', jsonb_build_object(
                    'activity_logs', v_activity_count,
                    'photos', v_photo_count,
                    'messages', v_message_count,
                    'emails', v_email_count
                ),
                'details', jsonb_build_object(
                    'building', COALESCE(v_building_name, 'N/A'),
                    'supplier', COALESCE(v_supplier_name, 'N/A')
                )
            );
        ELSE
            RAISE EXCEPTION 'Falha crítica: assistência ainda existe após eliminação.';
        END IF;
        
    EXCEPTION WHEN others THEN
        -- Return error WITHOUT logging to avoid potential foreign key issues
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Erro na eliminação da assistência: ' || SQLERRM,
            'assistance_id', p_assistance_id
        );
    END;
END;
$$;

-- 2. Fix RLS policies for activity_log to allow proper admin access
DROP POLICY IF EXISTS "Admin full access to activity_log" ON activity_log;
DROP POLICY IF EXISTS "Authenticated admin access to activity_log" ON activity_log;
DROP POLICY IF EXISTS "Service role full access to activity_log" ON activity_log;

-- Create comprehensive RLS policies for activity_log
CREATE POLICY "Service role full access to activity_log" 
ON activity_log FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated admin access to activity_log" 
ON activity_log FOR ALL 
TO authenticated
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admin user access to activity_log" 
ON activity_log FOR ALL 
USING (
  auth.role() = 'service_role' OR 
  get_user_role(auth.uid()) = 'admin' OR
  (auth.jwt() ->> 'role') = 'admin'
)
WITH CHECK (
  auth.role() = 'service_role' OR 
  get_user_role(auth.uid()) = 'admin' OR
  (auth.jwt() ->> 'role') = 'admin'
);