-- EMERGENCY FIX: Completely rewrite delete_assistance_safely function to handle foreign key constraints properly
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

    -- Executar eliminação em transação
    BEGIN
        -- Eliminar registos das tabelas dependentes primeiro (ordem importante para foreign keys)
        DELETE FROM assistance_photos WHERE assistance_id = p_assistance_id;
        DELETE FROM assistance_messages WHERE assistance_id = p_assistance_id;
        DELETE FROM email_logs WHERE assistance_id = p_assistance_id;
        DELETE FROM activity_log WHERE assistance_id = p_assistance_id;
        
        -- Eliminar a assistência principal
        DELETE FROM assistances WHERE id = p_assistance_id;
        
        -- Verificar se a eliminação foi bem-sucedida
        GET DIAGNOSTICS v_activity_count = ROW_COUNT;
        IF v_activity_count = 0 THEN
            RAISE EXCEPTION 'Falha na eliminação da assistência. Nenhuma linha foi afetada.';
        END IF;
        
        -- Verificar se ainda existe (dupla verificação)
        IF EXISTS(SELECT 1 FROM assistances WHERE id = p_assistance_id) THEN
            RAISE EXCEPTION 'Falha crítica: assistência ainda existe após eliminação.';
        END IF;
        
        -- Registar o evento de eliminação DEPOIS de eliminar tudo (sem assistance_id)
        INSERT INTO activity_log (description, actor)
        VALUES (
            format('Assistência #%s eliminada com sucesso. Edifício: %s, Fornecedor: %s. Eliminados: %s atividades, %s fotos, %s mensagens, %s emails.',
                p_assistance_id,
                COALESCE(v_building_name, 'N/A'),
                COALESCE(v_supplier_name, 'N/A'),
                v_activity_count,
                v_photo_count,
                v_message_count,
                v_email_count
            ),
            'system'
        );
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Assistência e todos os dados associados foram eliminados com sucesso.',
            'assistance_id', p_assistance_id,
            'deleted_counts', jsonb_build_object(
                'activity_logs', v_activity_count,
                'photos', v_photo_count,
                'messages', v_message_count,
                'emails', v_email_count
            )
        );
        
    EXCEPTION WHEN others THEN
        -- Log do erro para debugging
        INSERT INTO activity_log (description, actor)
        VALUES (
            format('ERRO na eliminação da assistência #%s: %s', p_assistance_id, SQLERRM),
            'system'
        );
        
        -- Re-raise o erro para que seja tratado pela aplicação
        RAISE;
    END;
END;
$$;