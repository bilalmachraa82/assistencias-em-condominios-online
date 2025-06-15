
-- Atualiza a função para eliminar de forma segura uma assistência e todos os seus dados associados,
-- incluindo agora as fotos no armazenamento (storage) e os registos na tabela `assistance_photos`.
CREATE OR REPLACE FUNCTION public.delete_assistance_safely(p_assistance_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_assistance_exists boolean;
    v_activity_count integer;
    v_photo_count integer;
    v_storage_paths text[];
    v_base_url text := 'https://vedzsbeirirjiozqflgq.supabase.co/storage/v1/object/public/assistance-photos/';
BEGIN
    -- Verificar se a assistência existe
    SELECT EXISTS(SELECT 1 FROM assistances WHERE id = p_assistance_id) INTO v_assistance_exists;
    
    IF NOT v_assistance_exists THEN
        RETURN jsonb_build_object('success', false, 'error', 'Assistência não encontrada.', 'assistance_id', p_assistance_id);
    END IF;

    -- Contar registos relacionados antes de os eliminar
    SELECT COUNT(*) INTO v_activity_count FROM activity_log WHERE assistance_id = p_assistance_id;
    SELECT COUNT(*) INTO v_photo_count FROM assistance_photos WHERE assistance_id = p_assistance_id;

    -- Começar transação
    BEGIN
        -- Obter os caminhos das fotos para eliminar do armazenamento
        SELECT array_agg(replace(photo_url, v_base_url, ''))
        INTO v_storage_paths
        FROM assistance_photos
        WHERE assistance_id = p_assistance_id;

        -- Eliminar os ficheiros do armazenamento, se existirem
        IF v_storage_paths IS NOT NULL AND array_length(v_storage_paths, 1) > 0 THEN
            PERFORM storage.delete_objects('assistance-photos', v_storage_paths);
        END IF;
        
        -- Registar o evento de eliminação
        INSERT INTO activity_log (description, actor)
        VALUES ('Assistência #' || p_assistance_id || ' e dados associados eliminados pelo sistema.', 'system');

        -- Eliminar registos das tabelas dependentes
        DELETE FROM assistance_photos WHERE assistance_id = p_assistance_id;
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
            'deleted_files', v_storage_paths
        );
        
    EXCEPTION WHEN others THEN
        -- O rollback é automático em caso de erro
        RAISE;
    END;
END;
$function$
