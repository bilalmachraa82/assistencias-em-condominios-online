
-- Corrige a função delete_assistance_safely removendo a chamada para storage.delete_objects que não existe
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
BEGIN
    -- Verificar se a assistência existe
    SELECT EXISTS(SELECT 1 FROM assistances WHERE id = p_assistance_id) INTO v_assistance_exists;
    
    IF NOT v_assistance_exists THEN
        RETURN jsonb_build_object('success', false, 'error', 'Assistência não encontrada.', 'assistance_id', p_assistance_id);
    END IF;

    -- Contar registos relacionados antes de os eliminar
    SELECT COUNT(*) INTO v_activity_count FROM activity_log WHERE assistance_id = p_assistance_id;
    SELECT COUNT(*) INTO v_photo_count FROM assistance_photos WHERE assistance_id = p_assistance_id;
    SELECT COUNT(*) INTO v_message_count FROM assistance_messages WHERE assistance_id = p_assistance_id;

    -- Começar transação
    BEGIN
        -- Registar o evento de eliminação
        INSERT INTO activity_log (description, actor)
        VALUES ('Assistência #' || p_assistance_id || ' e dados associados eliminados pelo sistema.', 'system');

        -- Eliminar registos das tabelas dependentes (sem tentar eliminar ficheiros do storage)
        DELETE FROM assistance_photos WHERE assistance_id = p_assistance_id;
        DELETE FROM assistance_messages WHERE assistance_id = p_assistance_id;
        DELETE FROM activity_log WHERE assistance_id = p_assistance_id;
        DELETE FROM email_logs WHERE assistance_id = p_assistance_id;
        
        -- Eliminar a assistência principal
        DELETE FROM assistances WHERE id = p_assistance_id;
        
        -- Verificar a eliminação para garantir a consistência
        IF EXISTS(SELECT 1 FROM assistances WHERE id = p_assistance_id) THEN
            RAISE EXCEPTION 'Falha crítica na eliminação da assistência. A operação foi revertida.';
        END IF;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Assistência e dados associados eliminados com sucesso.',
            'assistance_id', p_assistance_id,
            'deleted_activity_logs', v_activity_count,
            'deleted_photos_count', v_photo_count,
            'deleted_messages_count', v_message_count
        );
        
    EXCEPTION WHEN others THEN
        -- O rollback é automático em caso de erro
        RAISE;
    END;
END;
$$;
