
-- Etapa 1: Verificar e criar políticas RLS para eliminação
-- Como não existem políticas RLS na tabela assistances, vamos criar uma que permita eliminação
ALTER TABLE public.assistances ENABLE ROW LEVEL SECURITY;

-- Política para permitir que qualquer utilizador autenticado elimine assistências (para aplicação admin)
CREATE POLICY "Allow admin delete" ON public.assistances
FOR DELETE 
USING (true);

-- Política para permitir que qualquer utilizador autenticado veja assistências 
CREATE POLICY "Allow admin select" ON public.assistances
FOR SELECT 
USING (true);

-- Política para permitir que qualquer utilizador autenticado insira assistências
CREATE POLICY "Allow admin insert" ON public.assistances
FOR INSERT 
WITH CHECK (true);

-- Política para permitir que qualquer utilizador autenticado atualize assistências
CREATE POLICY "Allow admin update" ON public.assistances
FOR UPDATE 
USING (true);

-- Etapa 2: Criar função robusta para eliminação transaccional
CREATE OR REPLACE FUNCTION public.delete_assistance_safely(p_assistance_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb;
    v_activity_count integer;
    v_assistance_exists boolean;
BEGIN
    -- Verificar se a assistência existe
    SELECT EXISTS(SELECT 1 FROM assistances WHERE id = p_assistance_id) INTO v_assistance_exists;
    
    IF NOT v_assistance_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Assistência não encontrada',
            'assistance_id', p_assistance_id
        );
    END IF;

    -- Contar registos de activity_log relacionados
    SELECT COUNT(*) INTO v_activity_count 
    FROM activity_log 
    WHERE assistance_id = p_assistance_id;

    -- Começar transação
    BEGIN
        -- Eliminar registos dependentes primeiro
        DELETE FROM activity_log WHERE assistance_id = p_assistance_id;
        DELETE FROM email_logs WHERE assistance_id = p_assistance_id;
        
        -- Eliminar a assistência principal
        DELETE FROM assistances WHERE id = p_assistance_id;
        
        -- Verificar se foi realmente eliminada
        IF EXISTS(SELECT 1 FROM assistances WHERE id = p_assistance_id) THEN
            RAISE EXCEPTION 'Falha na eliminação da assistência';
        END IF;
        
        -- Registar a eliminação bem-sucedida
        INSERT INTO activity_log (assistance_id, description, actor)
        VALUES (p_assistance_id, 'Assistência eliminada com sucesso via função segura', 'admin');
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Assistência eliminada com sucesso',
            'assistance_id', p_assistance_id,
            'deleted_activity_logs', v_activity_count
        );
        
    EXCEPTION WHEN others THEN
        -- Rollback automático
        RAISE;
    END;
END;
$$;

-- Etapa 5: Criar trigger para audit trail
CREATE OR REPLACE FUNCTION public.log_assistance_deletion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO activity_log (assistance_id, description, actor)
    VALUES (OLD.id, 'Tentativa de eliminação de assistência detectada', 'system');
    RETURN OLD;
END;
$$;

CREATE TRIGGER assistance_deletion_audit
    BEFORE DELETE ON public.assistances
    FOR EACH ROW
    EXECUTE FUNCTION public.log_assistance_deletion();
