-- NOVA TABELA: Sistema Magic Link (padrão da indústria)
CREATE TABLE public.supplier_magic_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  magic_code TEXT NOT NULL UNIQUE,
  assistance_id BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  CONSTRAINT fk_assistance FOREIGN KEY (assistance_id) REFERENCES assistances(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_magic_code_lookup ON supplier_magic_codes(magic_code) WHERE is_active = true;
CREATE INDEX idx_assistance_magic_codes ON supplier_magic_codes(assistance_id);
CREATE INDEX idx_active_codes ON supplier_magic_codes(is_active, expires_at);

-- RLS para segurança
ALTER TABLE public.supplier_magic_codes ENABLE ROW LEVEL SECURITY;

-- Política: Service role tem acesso total
CREATE POLICY "Service role full access to magic codes" 
ON public.supplier_magic_codes 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Política: Edge functions podem validar códigos ativos
CREATE POLICY "Edge functions can validate active codes" 
ON public.supplier_magic_codes 
FOR SELECT 
USING (is_active = true AND expires_at > now());

-- Função para gerar magic codes únicos (6 caracteres, fácil de digitar)
CREATE OR REPLACE FUNCTION public.generate_magic_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Gera código de 6 caracteres: letras maiúsculas + números (sem confusão: 0,O,1,I,L)
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', floor(random() * 29 + 1)::int, 1);
    END LOOP;
    
    -- Verifica se já existe
    SELECT EXISTS(
      SELECT 1 FROM supplier_magic_codes 
      WHERE magic_code = code AND is_active = true
    ) INTO exists_check;
    
    -- Se não existe, retorna
    IF NOT exists_check THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Função para validar magic code e obter dados da assistência
CREATE OR REPLACE FUNCTION public.validate_magic_code(input_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  assistance_data RECORD;
BEGIN
  -- Valida o código e obtém dados da assistência
  SELECT 
    a.*,
    b.name as building_name,
    b.address as building_address,
    s.name as supplier_name,
    s.email as supplier_email,
    it.name as intervention_type_name,
    smc.created_at as magic_code_created_at
  INTO assistance_data
  FROM supplier_magic_codes smc
  JOIN assistances a ON a.id = smc.assistance_id
  LEFT JOIN buildings b ON b.id = a.building_id
  LEFT JOIN suppliers s ON s.id = a.supplier_id
  LEFT JOIN intervention_types it ON it.id = a.intervention_type_id
  WHERE smc.magic_code = input_code 
    AND smc.is_active = true 
    AND smc.expires_at > now();
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Código inválido ou expirado',
      'code', 'INVALID_MAGIC_CODE'
    );
  END IF;
  
  -- Marca como usado (opcional - para tracking)
  UPDATE supplier_magic_codes 
  SET used_at = now() 
  WHERE magic_code = input_code AND used_at IS NULL;
  
  -- Log de auditoria
  PERFORM audit_security_event(
    'MAGIC_CODE_ACCESS',
    'assistances', 
    assistance_data.id,
    NULL,
    NULL,
    jsonb_build_object('magic_code', input_code)
  );
  
  -- Retorna dados completos
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'id', assistance_data.id,
      'type', assistance_data.type,
      'description', assistance_data.description,
      'status', assistance_data.status,
      'admin_notes', assistance_data.admin_notes,
      'scheduled_datetime', assistance_data.scheduled_datetime,
      'created_at', assistance_data.created_at,
      'building', jsonb_build_object(
        'name', assistance_data.building_name,
        'address', assistance_data.building_address
      ),
      'supplier', jsonb_build_object(
        'name', assistance_data.supplier_name,
        'email', assistance_data.supplier_email
      ),
      'intervention_type', jsonb_build_object(
        'name', assistance_data.intervention_type_name
      ),
      'tokens', jsonb_build_object(
        'interaction', assistance_data.interaction_token,
        'acceptance', assistance_data.acceptance_token,
        'scheduling', assistance_data.scheduling_token,
        'validation', assistance_data.validation_token
      )
    )
  );
END;
$$;