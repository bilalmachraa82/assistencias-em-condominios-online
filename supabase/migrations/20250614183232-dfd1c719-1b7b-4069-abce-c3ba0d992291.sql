
CREATE OR REPLACE FUNCTION public.delete_assistance_safely(p_assistance_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_assistance_exists boolean;
    v_activity_count integer;
BEGIN
    -- Verificar se a assistência existe
    SELECT EXISTS(SELECT 1 FROM assistances WHERE id = p_assistance_id) INTO v_assistance_exists;
    
    IF NOT v_assistance_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Assistência não encontrada.',
            'assistance_id', p_assistance_id
        );
    END IF;

    -- Contar registos de activity_log relacionados antes de os eliminar
    SELECT COUNT(*) INTO v_activity_count 
    FROM activity_log 
    WHERE assistance_id = p_assistance_id;

    -- Começar transação
    BEGIN
        -- Registar o evento de eliminação ANTES de eliminar.
        -- O ID da assistência é guardado na descrição para evitar problemas de chave estrangeira.
        INSERT INTO activity_log (description, actor)
        VALUES ('Assistência #' || p_assistance_id || ' eliminada pelo sistema.', 'system');

        -- Eliminar registos dependentes primeiro
        DELETE FROM activity_log WHERE assistance_id = p_assistance_id;
        DELETE FROM email_logs WHERE assistance_id = p_assistance_id;
        
        -- Eliminar a assistência principal
        DELETE FROM assistances WHERE id = p_assistance_id;
        
        -- Verificar se foi realmente eliminada para garantir a consistência
        IF EXISTS(SELECT 1 FROM assistances WHERE id = p_assistance_id) THEN
            RAISE EXCEPTION 'Falha crítica na eliminação da assistência. A operação foi revertida.';
        END IF;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Assistência eliminada com sucesso.',
            'assistance_id', p_assistance_id,
            'deleted_activity_logs', v_activity_count
        );
        
    EXCEPTION WHEN others THEN
        -- O rollback é automático em caso de erro na transação.
        RAISE;
    END;
END;
$function$
