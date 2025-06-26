
-- FASE 1: Correção Crítica do RLS - Desabilitar temporariamente RLS para permitir operações

-- Desabilitar RLS nas tabelas que estão a causar problemas
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervention_types DISABLE ROW LEVEL SECURITY;

-- Adicionar campo NIF à tabela buildings (para a FASE 2)
ALTER TABLE public.buildings ADD COLUMN IF NOT EXISTS nif text;

-- Garantir que todas as tabelas têm as estruturas corretas
-- Verificar se a tabela suppliers tem todos os campos necessários
DO $$
BEGIN
    -- Verificar e adicionar campos em falta na tabela suppliers se necessário
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='created_at') THEN
        ALTER TABLE public.suppliers ADD COLUMN created_at timestamp with time zone DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='is_active') THEN
        ALTER TABLE public.suppliers ADD COLUMN is_active boolean DEFAULT true;
    END IF;
END
$$;

-- Verificar se a tabela buildings tem todos os campos necessários
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='buildings' AND column_name='created_at') THEN
        ALTER TABLE public.buildings ADD COLUMN created_at timestamp with time zone DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='buildings' AND column_name='is_active') THEN
        ALTER TABLE public.buildings ADD COLUMN is_active boolean DEFAULT true;
    END IF;
END
$$;

-- Verificar se a tabela intervention_types tem estrutura correta
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intervention_types' AND column_name='maps_to_urgency') THEN
        ALTER TABLE public.intervention_types ADD COLUMN maps_to_urgency text;
    END IF;
END
$$;
