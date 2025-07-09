-- 20250709_fix_assistance_delete_fk.sql
BEGIN;

-- A) FK activity_log.assistance_id
ALTER TABLE activity_log
  DROP CONSTRAINT IF EXISTS activity_log_assistance_id_fkey;
ALTER TABLE activity_log
  ADD CONSTRAINT activity_log_assistance_id_fkey
  FOREIGN KEY (assistance_id)
  REFERENCES assistances(id)
  ON DELETE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

-- B) Trigger de auditoria (AFTER DELETE)
DROP TRIGGER IF EXISTS assistance_deletion_audit ON public.assistances;
CREATE TRIGGER assistance_deletion_audit
AFTER DELETE ON public.assistances
FOR EACH ROW
EXECUTE FUNCTION public.log_assistance_deletion();

-- C) Função delete_assistance_safely actualizada
CREATE OR REPLACE FUNCTION public.delete_assistance_safely(p_assistance_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
    v_exists         boolean;
    v_activity_count int;
    v_photo_count    int;
    v_message_count  int;
    v_email_count    int;
    v_building_name  text;
    v_supplier_name  text;
    v_actor          text := (
      CASE
        WHEN get_user_role(auth.uid()) = 'admin' THEN 'admin'
        WHEN auth.uid() IS NOT NULL               THEN 'supplier'
        ELSE 'system'
      END
    );
BEGIN
    -- Confirma existência
    SELECT EXISTS (SELECT 1 FROM assistances WHERE id = p_assistance_id)
      INTO v_exists;
    IF NOT v_exists THEN
        RETURN jsonb_build_object('success', false, 'error',
                                  'Assistência não encontrada.',
                                  'assistance_id', p_assistance_id);
    END IF;

    -- Info contextual
    SELECT b.name, s.name
      INTO v_building_name, v_supplier_name
      FROM assistances a
      LEFT JOIN buildings  b ON b.id = a.building_id
      LEFT JOIN suppliers  s ON s.id = a.supplier_id
     WHERE a.id = p_assistance_id;

    -- Contagens pré-delete
    SELECT COUNT(*) INTO v_activity_count FROM activity_log        WHERE assistance_id = p_assistance_id;
    SELECT COUNT(*) INTO v_photo_count    FROM assistance_photos   WHERE assistance_id = p_assistance_id;
    SELECT COUNT(*) INTO v_message_count  FROM assistance_messages WHERE assistance_id = p_assistance_id;
    SELECT COUNT(*) INTO v_email_count    FROM email_logs          WHERE assistance_id = p_assistance_id;

    -- Log único
    INSERT INTO activity_log (assistance_id, description, actor)
    VALUES (
      p_assistance_id,
      format('ELIMINAÇÃO: Assistência #%s (%s - %s) removida permanentemente',
             p_assistance_id,
             COALESCE(v_building_name, 'N/A'),
             COALESCE(v_supplier_name, 'N/A')),
      v_actor
    );

    -- Limpeza do Storage (prefixo completo)
    BEGIN
      PERFORM storage.delete_objects(
        'assistance-photos',
        ARRAY[ format('assistances/%s/*', p_assistance_id) ]
      );
    EXCEPTION WHEN others THEN
      -- continua mesmo se falhar
      NULL;
    END;

    -- Cascata manual (activity_log sai via FK)
    DELETE FROM assistance_photos    WHERE assistance_id = p_assistance_id;
    DELETE FROM assistance_messages  WHERE assistance_id = p_assistance_id;
    DELETE FROM email_logs           WHERE assistance_id = p_assistance_id;

    -- Delete principal
    DELETE FROM assistances WHERE id = p_assistance_id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Assistência e dados associados eliminados com sucesso.',
      'assistance_id', p_assistance_id,
      'deleted_counts', jsonb_build_object(
        'activity_logs', v_activity_count,
        'photos',        v_photo_count,
        'messages',      v_message_count,
        'emails',        v_email_count)
    );
EXCEPTION WHEN others THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'Erro na eliminação da assistência: ' || SQLERRM,
      'assistance_id', p_assistance_id);
END;
$$;

COMMIT;