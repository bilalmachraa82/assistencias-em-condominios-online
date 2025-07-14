-- NOVA ESTRUTURA DE BASE DE DADOS - GESTÃO DE CONDOMÍNIOS (CORREÇÃO)
-- Baseada em melhores práticas da indústria
-- Data: 2025-01-13

-- ========================================
-- FASE 1: BACKUP DOS DADOS EXISTENTES
-- ========================================

-- Criar tabela temporária para backup de edifícios
CREATE TEMP TABLE temp_buildings_backup AS 
SELECT id, name, address, nif, cadastral_code, admin_notes 
FROM buildings WHERE is_active = true;

-- Criar tabela temporária para backup de fornecedores
CREATE TEMP TABLE temp_suppliers_backup AS 
SELECT id, name, email, phone, specialization, address, nif, admin_notes 
FROM suppliers WHERE is_active = true;

-- Criar tabela temporária para backup de tipos de intervenção
CREATE TEMP TABLE temp_intervention_types_backup AS 
SELECT id, name, description, maps_to_urgency 
FROM intervention_types;

-- ========================================
-- FASE 2: ELIMINAÇÃO DA ESTRUTURA ANTIGA (CORRIGIDA)
-- ========================================

-- Desabilitar RLS em todas as tabelas
ALTER TABLE IF EXISTS activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assistance_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assistance_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assistances DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS buildings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS intervention_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS supplier_magic_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS valid_statuses DISABLE ROW LEVEL SECURITY;

-- Remover todas as policies RLS
DROP POLICY IF EXISTS "Admin full access to buildings" ON buildings;
DROP POLICY IF EXISTS "Authenticated admin access to buildings" ON buildings;
DROP POLICY IF EXISTS "Service role full access to buildings" ON buildings;
DROP POLICY IF EXISTS "Admin full access to suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated admin access to suppliers" ON suppliers;
DROP POLICY IF EXISTS "Service role full access to suppliers" ON suppliers;
DROP POLICY IF EXISTS "Admin modify intervention_types" ON intervention_types;
DROP POLICY IF EXISTS "Authenticated admin access to intervention_types" ON intervention_types;
DROP POLICY IF EXISTS "Service role full access to intervention_types" ON intervention_types;
DROP POLICY IF EXISTS "Authenticated admin access to assistance_messages" ON assistance_messages;
DROP POLICY IF EXISTS "Edge function message access" ON assistance_messages;
DROP POLICY IF EXISTS "Secure supplier message insert" ON assistance_messages;
DROP POLICY IF EXISTS "Service role full access to assistance_messages" ON assistance_messages;
DROP POLICY IF EXISTS "Token-validated supplier message access" ON assistance_messages;
DROP POLICY IF EXISTS "Edge functions can validate active codes" ON supplier_magic_codes;
DROP POLICY IF EXISTS "Service role full access to magic codes" ON supplier_magic_codes;
DROP POLICY IF EXISTS "Authenticated admin access to assistance_photos" ON assistance_photos;
DROP POLICY IF EXISTS "Edge function photo access" ON assistance_photos;
DROP POLICY IF EXISTS "Secure supplier photo insert" ON assistance_photos;
DROP POLICY IF EXISTS "Service role full access to assistance_photos" ON assistance_photos;
DROP POLICY IF EXISTS "Token-validated supplier photo access" ON assistance_photos;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON user_roles;
DROP POLICY IF EXISTS "Service role full access to user_roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Allow edge function token validation" ON assistances;
DROP POLICY IF EXISTS "Authenticated admin access to assistances" ON assistances;
DROP POLICY IF EXISTS "Secure assistance access with token validation" ON assistances;
DROP POLICY IF EXISTS "Service role full access to assistances" ON assistances;
DROP POLICY IF EXISTS "Admin user access to activity_log" ON activity_log;
DROP POLICY IF EXISTS "Authenticated admin access to activity_log" ON activity_log;
DROP POLICY IF EXISTS "Service role full access to activity_log" ON activity_log;
DROP POLICY IF EXISTS "Admin full access to email_logs" ON email_logs;
DROP POLICY IF EXISTS "Admin modify valid_statuses" ON valid_statuses;
DROP POLICY IF EXISTS "Authenticated admin access to valid_statuses" ON valid_statuses;
DROP POLICY IF EXISTS "Service role full access to valid_statuses" ON valid_statuses;

-- Remover triggers e functions com CASCADE
DROP TRIGGER IF EXISTS audit_assistances_access ON assistances;
DROP TRIGGER IF EXISTS assistance_deletion_audit ON assistances;
DROP TRIGGER IF EXISTS update_assistances_updated_at ON assistances;
DROP TRIGGER IF EXISTS update_buildings_updated_at ON buildings;
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
DROP TRIGGER IF EXISTS set_assistances_timestamp ON assistances;
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;

-- Remover functions com CASCADE
DROP FUNCTION IF EXISTS audit_security_event(text, text, bigint, text, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS audit_sensitive_operation(text, text, bigint, jsonb) CASCADE;
DROP FUNCTION IF EXISTS create_admin_user(text) CASCADE;
DROP FUNCTION IF EXISTS delete_assistance_safely(bigint) CASCADE;
DROP FUNCTION IF EXISTS generate_magic_code() CASCADE;
DROP FUNCTION IF EXISTS get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS log_assistance_deletion() CASCADE;
DROP FUNCTION IF EXISTS log_table_access() CASCADE;
DROP FUNCTION IF EXISTS trigger_set_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_assistance_by_token(bigint, text, text, timestamptz, text, text) CASCADE;
DROP FUNCTION IF EXISTS update_assistance_status(bigint, text, timestamptz) CASCADE;
DROP FUNCTION IF EXISTS validate_edge_function_access(text, text) CASCADE;
DROP FUNCTION IF EXISTS validate_magic_code(text) CASCADE;
DROP FUNCTION IF EXISTS validate_supplier_token(text, bigint, text) CASCADE;
DROP FUNCTION IF EXISTS validate_token_access(bigint, text, text) CASCADE;
DROP FUNCTION IF EXISTS validate_token_with_audit(bigint, text, text, text) CASCADE;

-- Eliminar tabelas antigas (ordem de dependências)
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS assistance_messages CASCADE;
DROP TABLE IF EXISTS assistance_photos CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS supplier_magic_codes CASCADE;
DROP TABLE IF EXISTS assistances CASCADE;
DROP TABLE IF EXISTS valid_statuses CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS intervention_types CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;

-- ========================================
-- FASE 3: NOVA ESTRUTURA - CORE ENTITIES
-- ========================================

-- 1. ORGANIZAÇÕES (Multi-tenant ready)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_number TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 2. CATEGORIAS DE SERVIÇOS (Padronizado)
CREATE TABLE service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color_code TEXT DEFAULT '#6366f1',
    urgency_level INTEGER NOT NULL DEFAULT 1 CHECK (urgency_level BETWEEN 1 AND 5),
    estimated_duration_hours INTEGER,
    requires_photo BOOLEAN DEFAULT false,
    requires_access_permission BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(organization_id, name)
);

-- 3. PRIORIDADES DE SERVIÇO (Enum standardizado)
CREATE TYPE service_priority AS ENUM ('low', 'normal', 'high', 'urgent', 'emergency');

-- 4. EDIFÍCIOS (Melhorado)
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    postal_code TEXT,
    city TEXT,
    country TEXT DEFAULT 'Portugal',
    tax_number TEXT,
    cadastral_reference TEXT,
    coordinates POINT,
    total_units INTEGER,
    building_type TEXT,
    construction_year INTEGER,
    insurance_info JSONB DEFAULT '{}',
    emergency_contacts JSONB DEFAULT '[]',
    access_instructions TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(organization_id, name)
);

-- 5. FORNECEDORES/CONTRATADORES (Melhorado)
CREATE TABLE contractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    mobile_phone TEXT,
    address TEXT,
    postal_code TEXT,
    city TEXT,
    tax_number TEXT,
    license_number TEXT,
    insurance_info JSONB DEFAULT '{}',
    certifications TEXT[],
    specializations UUID[] DEFAULT '{}',
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    total_jobs_completed INTEGER DEFAULT 0,
    response_time_hours DECIMAL(5,2),
    hourly_rate DECIMAL(10,2),
    emergency_available BOOLEAN DEFAULT false,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(organization_id, email)
);

-- ========================================
-- FASE 4: SISTEMA DE SOLICITAÇÕES DE SERVIÇO
-- ========================================

-- Estados do serviço (State Machine Pattern)
CREATE TYPE service_status AS ENUM (
    'submitted',        -- Submetido
    'assigned',         -- Atribuído
    'scheduled',        -- Agendado
    'in_progress',      -- Em progresso
    'completed',        -- Concluído
    'cancelled'         -- Cancelado
);

-- 6. SOLICITAÇÕES DE SERVIÇO (Core Business)
CREATE TABLE service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE RESTRICT,
    contractor_id UUID REFERENCES contractors(id) ON DELETE SET NULL,
    
    -- Identificação
    request_number TEXT NOT NULL, -- Auto-gerado: SRV-2025-0001
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location_details TEXT,
    
    -- Classificação
    priority service_priority NOT NULL DEFAULT 'normal',
    status service_status NOT NULL DEFAULT 'submitted',
    urgency_score INTEGER NOT NULL DEFAULT 1 CHECK (urgency_score BETWEEN 1 AND 10),
    
    -- Agendamento
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    estimated_duration_hours DECIMAL(5,2),
    
    -- Tracking
    submitted_by TEXT, -- Nome do solicitante
    submitted_contact TEXT, -- Email/telefone
    access_token TEXT UNIQUE NOT NULL, -- Token único para acesso
    
    -- Datas importantes
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    assigned_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    
    UNIQUE(organization_id, request_number)
);

-- 7. COMUNICAÇÕES (Event Sourcing)
CREATE TABLE service_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    
    -- Conteúdo
    message TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'comment', -- comment, status_change, assignment, etc
    
    -- Autor
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL, -- admin, contractor, tenant, system
    author_contact TEXT,
    
    -- Visibilidade
    is_internal BOOLEAN DEFAULT false,
    is_visible_to_contractor BOOLEAN DEFAULT true,
    is_visible_to_tenant BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Metadados
    metadata JSONB DEFAULT '{}'
);

-- 8. ANEXOS/FOTOS
CREATE TABLE service_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    
    -- Arquivo
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Storage path
    file_size INTEGER,
    file_type TEXT NOT NULL,
    mime_type TEXT,
    
    -- Categorização
    attachment_type TEXT NOT NULL DEFAULT 'photo', -- photo, document, receipt, etc
    category TEXT, -- before, during, after, invoice, etc
    description TEXT,
    
    -- Autor
    uploaded_by TEXT NOT NULL,
    uploaded_role TEXT NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Metadados
    metadata JSONB DEFAULT '{}'
);

-- 9. AUDITORIA COMPLETA (Event Sourcing)
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Contexto
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    service_request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
    
    -- Evento
    event_type TEXT NOT NULL, -- create, update, delete, status_change, assignment, etc
    entity_type TEXT NOT NULL, -- service_request, communication, attachment, etc
    entity_id UUID,
    
    -- Ator
    actor_id TEXT, -- UUID do user ou 'system'
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    actor_ip TEXT,
    
    -- Dados
    old_values JSONB,
    new_values JSONB,
    changes JSONB, -- Computed diff
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Metadados
    metadata JSONB DEFAULT '{}'
);

-- ========================================
-- FASE 5: ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para service_requests (queries mais comuns)
CREATE INDEX idx_service_requests_organization ON service_requests(organization_id);
CREATE INDEX idx_service_requests_building ON service_requests(building_id);
CREATE INDEX idx_service_requests_contractor ON service_requests(contractor_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_priority ON service_requests(priority);
CREATE INDEX idx_service_requests_created_at ON service_requests(created_at DESC);
CREATE INDEX idx_service_requests_access_token ON service_requests(access_token);
CREATE INDEX idx_service_requests_number ON service_requests(organization_id, request_number);

-- Índices para communications
CREATE INDEX idx_communications_service_request ON service_communications(service_request_id);
CREATE INDEX idx_communications_created_at ON service_communications(created_at DESC);
CREATE INDEX idx_communications_type ON service_communications(message_type);

-- Índices para attachments
CREATE INDEX idx_attachments_service_request ON service_attachments(service_request_id);
CREATE INDEX idx_attachments_type ON service_attachments(attachment_type);
CREATE INDEX idx_attachments_created_at ON service_attachments(created_at DESC);

-- Índices para audit
CREATE INDEX idx_audit_organization ON audit_events(organization_id);
CREATE INDEX idx_audit_service_request ON audit_events(service_request_id);
CREATE INDEX idx_audit_created_at ON audit_events(created_at DESC);
CREATE INDEX idx_audit_actor ON audit_events(actor_id);
CREATE INDEX idx_audit_event_type ON audit_events(event_type);

-- Índices para buildings
CREATE INDEX idx_buildings_organization ON buildings(organization_id);
CREATE INDEX idx_buildings_active ON buildings(organization_id, is_active);

-- Índices para contractors
CREATE INDEX idx_contractors_organization ON contractors(organization_id);
CREATE INDEX idx_contractors_active ON contractors(organization_id, is_active);
CREATE INDEX idx_contractors_specializations ON contractors USING GIN(specializations);

-- ========================================
-- FASE 6: TRIGGERS E FUNCTIONS
-- ========================================

-- Function para updated_at automático
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER set_timestamp_organizations BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_buildings BEFORE UPDATE ON buildings FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_contractors BEFORE UPDATE ON contractors FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_service_categories BEFORE UPDATE ON service_categories FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_service_requests BEFORE UPDATE ON service_requests FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Function para gerar números de solicitação
CREATE OR REPLACE FUNCTION generate_request_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    current_year INTEGER := EXTRACT(year FROM NOW());
    sequence_num INTEGER;
BEGIN
    -- Obter próximo número da sequência para o ano atual
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(request_number FROM 'SRV-\d{4}-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM service_requests 
    WHERE organization_id = org_id
    AND request_number LIKE 'SRV-' || current_year || '-%';
    
    RETURN 'SRV-' || current_year || '-' || LPAD(sequence_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function para gerar tokens de acesso seguros
CREATE OR REPLACE FUNCTION generate_access_token()
RETURNS TEXT AS $$
DECLARE
    new_token TEXT;
    token_exists BOOLEAN;
BEGIN
    LOOP
        -- Gerar token alfanumérico de 16 caracteres
        new_token := array_to_string(
            ARRAY(
                SELECT substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 
                             floor(random() * 36)::int + 1, 1)
                FROM generate_series(1, 16)
            ), 
            ''
        );
        
        -- Verificar se já existe
        SELECT EXISTS(
            SELECT 1 FROM service_requests WHERE access_token = new_token
        ) INTO token_exists;
        
        IF NOT token_exists THEN
            RETURN new_token;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function para auditoria automática
CREATE OR REPLACE FUNCTION audit_service_request_changes()
RETURNS TRIGGER AS $$
DECLARE
    changes JSONB := '{}';
    actor_name TEXT := 'system';
BEGIN
    -- Determinar nome do ator
    IF auth.jwt() IS NOT NULL THEN
        actor_name := COALESCE(auth.jwt() ->> 'email', 'authenticated_user');
    END IF;
    
    -- Calcular mudanças (apenas para UPDATE)
    IF TG_OP = 'UPDATE' THEN
        SELECT jsonb_object_agg(key, value) INTO changes
        FROM (
            SELECT key, jsonb_build_object('old', OLD_VALUE, 'new', NEW_VALUE) as value
            FROM jsonb_each_text(to_jsonb(OLD)) o(key, OLD_VALUE)
            FULL OUTER JOIN jsonb_each_text(to_jsonb(NEW)) n(key, NEW_VALUE) USING (key)
            WHERE o.OLD_VALUE IS DISTINCT FROM n.NEW_VALUE
        ) t;
    END IF;
    
    -- Inserir evento de auditoria
    INSERT INTO audit_events (
        organization_id,
        service_request_id,
        event_type,
        entity_type,
        entity_id,
        actor_name,
        actor_role,
        old_values,
        new_values,
        changes
    ) VALUES (
        COALESCE(NEW.organization_id, OLD.organization_id),
        COALESCE(NEW.id, OLD.id),
        LOWER(TG_OP),
        'service_request',
        COALESCE(NEW.id, OLD.id),
        actor_name,
        COALESCE(auth.jwt() ->> 'role', 'system'),
        CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
        changes
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auditoria de service_requests
CREATE TRIGGER audit_service_requests
    AFTER INSERT OR UPDATE OR DELETE ON service_requests
    FOR EACH ROW EXECUTE FUNCTION audit_service_request_changes();

-- ========================================
-- FASE 7: ROW LEVEL SECURITY (MODERNO)
-- ========================================

-- Function para obter user role (security definer)
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(auth.jwt() ->> 'role', 'anonymous');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function para validar acesso por token
CREATE OR REPLACE FUNCTION validate_access_token(token TEXT)
RETURNS UUID AS $$
DECLARE
    request_id UUID;
BEGIN
    SELECT id INTO request_id 
    FROM service_requests 
    WHERE access_token = token;
    
    RETURN request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Habilitar RLS em todas as tabelas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Policies para Organizations (Admin only)
CREATE POLICY "Admin full access to organizations" ON organizations
    FOR ALL TO authenticated
    USING (get_current_user_role() = 'admin')
    WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Service role access to organizations" ON organizations
    FOR ALL TO service_role
    USING (true);

-- Policies para Buildings
CREATE POLICY "Admin access to buildings" ON buildings
    FOR ALL TO authenticated
    USING (get_current_user_role() = 'admin')
    WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Service role access to buildings" ON buildings
    FOR ALL TO service_role
    USING (true);

-- Policies para Contractors
CREATE POLICY "Admin access to contractors" ON contractors
    FOR ALL TO authenticated
    USING (get_current_user_role() = 'admin')
    WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Service role access to contractors" ON contractors
    FOR ALL TO service_role
    USING (true);

-- Policies para Service Categories
CREATE POLICY "Admin access to service_categories" ON service_categories
    FOR ALL TO authenticated
    USING (get_current_user_role() = 'admin')
    WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Service role access to service_categories" ON service_categories
    FOR ALL TO service_role
    USING (true);

-- Policies para Service Requests (Mais complexas)
CREATE POLICY "Admin access to service_requests" ON service_requests
    FOR ALL TO authenticated
    USING (get_current_user_role() = 'admin')
    WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Token access to service_requests" ON service_requests
    FOR SELECT TO anon
    USING (validate_access_token(access_token) = id);

CREATE POLICY "Service role access to service_requests" ON service_requests
    FOR ALL TO service_role
    USING (true);

-- Policies para Communications
CREATE POLICY "Admin access to communications" ON service_communications
    FOR ALL TO authenticated
    USING (get_current_user_role() = 'admin')
    WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Token access to communications" ON service_communications
    FOR SELECT TO anon
    USING (
        validate_access_token(
            (SELECT access_token FROM service_requests WHERE id = service_request_id)
        ) IS NOT NULL
    );

CREATE POLICY "Service role access to communications" ON service_communications
    FOR ALL TO service_role
    USING (true);

-- Policies para Attachments
CREATE POLICY "Admin access to attachments" ON service_attachments
    FOR ALL TO authenticated
    USING (get_current_user_role() = 'admin')
    WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Token access to attachments" ON service_attachments
    FOR SELECT TO anon
    USING (
        validate_access_token(
            (SELECT access_token FROM service_requests WHERE id = service_request_id)
        ) IS NOT NULL
    );

CREATE POLICY "Service role access to attachments" ON service_attachments
    FOR ALL TO service_role
    USING (true);

-- Policies para Audit Events (Admin only)
CREATE POLICY "Admin access to audit_events" ON audit_events
    FOR ALL TO authenticated
    USING (get_current_user_role() = 'admin')
    WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Service role access to audit_events" ON audit_events
    FOR ALL TO service_role
    USING (true);

-- ========================================
-- FASE 8: MIGRAÇÃO DOS DADOS EXISTENTES
-- ========================================

-- Criar organização padrão
INSERT INTO organizations (
    id,
    name, 
    slug,
    email,
    settings
) VALUES (
    'b8f1c2e0-4b3a-4d5f-8c7e-9d0a1b2c3d4e',
    'Gestão de Condomínios',
    'gestao-condominios',
    'admin@condominio.pt',
    '{"default_priority": "normal", "auto_assign": false}'
);

-- Migrar categorias de serviço (baseado nos intervention_types)
INSERT INTO service_categories (
    organization_id,
    name,
    description,
    urgency_level,
    color_code
)
SELECT 
    'b8f1c2e0-4b3a-4d5f-8c7e-9d0a1b2c3d4e',
    name,
    description,
    CASE 
        WHEN maps_to_urgency = 'emergency' THEN 5
        WHEN maps_to_urgency = 'urgent' THEN 4
        WHEN maps_to_urgency = 'high' THEN 3
        WHEN maps_to_urgency = 'medium' THEN 2
        ELSE 1
    END,
    CASE 
        WHEN maps_to_urgency = 'emergency' THEN '#ef4444'
        WHEN maps_to_urgency = 'urgent' THEN '#f97316'
        WHEN maps_to_urgency = 'high' THEN '#eab308'
        WHEN maps_to_urgency = 'medium' THEN '#3b82f6'
        ELSE '#6366f1'
    END
FROM temp_intervention_types_backup;

-- Migrar edifícios
INSERT INTO buildings (
    organization_id,
    name,
    address,
    tax_number,
    cadastral_reference,
    admin_notes
)
SELECT 
    'b8f1c2e0-4b3a-4d5f-8c7e-9d0a1b2c3d4e',
    name,
    address,
    nif,
    cadastral_code,
    admin_notes
FROM temp_buildings_backup;

-- Migrar fornecedores
INSERT INTO contractors (
    organization_id,
    name,
    email,
    phone,
    address,
    tax_number,
    admin_notes,
    specializations
)
SELECT 
    'b8f1c2e0-4b3a-4d5f-8c7e-9d0a1b2c3d4e',
    name,
    email,
    phone,
    address,
    nif,
    admin_notes,
    ARRAY[]::UUID[]
FROM temp_suppliers_backup;

-- ========================================
-- FASE 9: CONFIGURAÇÕES FINAIS
-- ========================================

-- Criar user_roles compatível
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, organization_id, role)
);

-- Habilitar RLS para user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin access to user_roles" ON user_roles
    FOR ALL TO authenticated
    USING (get_current_user_role() = 'admin')
    WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Service role access to user_roles" ON user_roles
    FOR ALL TO service_role
    USING (true);

-- Function para criar admin user (compatibilidade)
CREATE OR REPLACE FUNCTION create_admin_user(admin_email TEXT)
RETURNS TEXT AS $$
DECLARE
    admin_user_id UUID;
    default_org_id UUID := 'b8f1c2e0-4b3a-4d5f-8c7e-9d0a1b2c3d4e';
BEGIN
    -- Obter user ID do auth.users
    SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;
    
    IF admin_user_id IS NULL THEN
        RETURN 'User with email ' || admin_email || ' not found';
    END IF;
    
    -- Inserir role de admin
    INSERT INTO user_roles (user_id, role, organization_id) 
    VALUES (admin_user_id, 'admin', default_org_id)
    ON CONFLICT (user_id, organization_id, role) DO NOTHING;
    
    RETURN 'Admin role granted to user: ' || admin_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function melhorada para get_user_role (compatibilidade)
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    IF user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    SELECT role INTO user_role 
    FROM user_roles 
    WHERE user_roles.user_id = $1 
    AND role = 'admin' 
    LIMIT 1;
    
    RETURN user_role;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ========================================
-- COMPLETADO: NOVA ESTRUTURA IMPLEMENTADA
-- ========================================

-- Registrar migração completa no audit
INSERT INTO audit_events (
    organization_id,
    event_type,
    entity_type,
    actor_name,
    actor_role,
    new_values,
    metadata
) VALUES (
    'b8f1c2e0-4b3a-4d5f-8c7e-9d0a1b2c3d4e',
    'migration',
    'database',
    'system',
    'system',
    '{"status": "completed", "version": "v2.0"}',
    jsonb_build_object(
        'migration_date', now(),
        'migrated_buildings', (SELECT count(*) FROM buildings),
        'migrated_contractors', (SELECT count(*) FROM contractors),
        'migrated_categories', (SELECT count(*) FROM service_categories),
        'description', 'Complete database restructure with industry best practices'
    )
);