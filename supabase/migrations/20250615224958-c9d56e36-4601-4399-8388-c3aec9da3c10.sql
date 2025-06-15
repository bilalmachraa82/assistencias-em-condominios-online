
-- Fix search_path security warnings for all affected functions

-- 1. Update audit_sensitive_operation function
CREATE OR REPLACE FUNCTION public.audit_sensitive_operation(
  operation_type TEXT,
  table_name TEXT,
  record_id BIGINT,
  details JSONB DEFAULT NULL
) RETURNS VOID 
SET search_path = public
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO activity_log (description, actor, assistance_id)
  VALUES (
    format('AUDIT: %s on %s (ID: %s) - %s', 
      operation_type, 
      table_name, 
      record_id, 
      COALESCE(details::text, 'No details')
    ),
    COALESCE(auth.jwt() ->> 'email', 'system'),
    CASE WHEN table_name = 'assistances' THEN record_id ELSE NULL END
  );
END;
$$;

-- 2. Update trigger_set_timestamp function
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS trigger
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 3. Update update_assistance_status function
CREATE OR REPLACE FUNCTION public.update_assistance_status(
  p_assistance_id BIGINT,
  p_new_status TEXT,
  p_scheduled_datetime TIMESTAMPTZ DEFAULT NULL
) 
RETURNS VOID
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE assistances
  SET 
    status = p_new_status,
    scheduled_datetime = COALESCE(p_scheduled_datetime, scheduled_datetime),
    updated_at = NOW()
  WHERE id = p_assistance_id;
END;
$$;

-- 4. Update delete_assistance_safely function
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
$$;

-- 5. Update log_assistance_deletion function
CREATE OR REPLACE FUNCTION public.log_assistance_deletion()
RETURNS trigger
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO activity_log (assistance_id, description, actor)
    VALUES (OLD.id, 'Tentativa de eliminação de assistência detectada', 'system');
    RETURN OLD;
END;
$$;
