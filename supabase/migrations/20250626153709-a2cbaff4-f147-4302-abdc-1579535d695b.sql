
-- FASE 1: Corrigir o Constraint da Base de Dados

-- 1. Remover o constraint antigo que está a causar problemas
ALTER TABLE public.assistances DROP CONSTRAINT IF EXISTS assistances_status_check;

-- 2. Atualizar a tabela valid_statuses com apenas os status essenciais e corretos
TRUNCATE TABLE public.valid_statuses;

-- 3. Inserir apenas os status essenciais (8 status principais)
INSERT INTO public.valid_statuses (status_value, display_order, sort_order, label_pt, hex_color) VALUES
('Pendente Resposta Inicial', 10, 10, 'Pendente Resposta Inicial', '#f59e0b'),
('Pendente Aceitação', 20, 20, 'Pendente Aceitação', '#3b82f6'),
('Recusada Fornecedor', 30, 30, 'Recusada Fornecedor', '#ef4444'),
('Agendado', 40, 40, 'Agendado', '#6366f1'),
('Em Progresso', 50, 50, 'Em Progresso', '#06b6d4'),
('Pendente Validação', 60, 60, 'Pendente Validação', '#14b8a6'),
('Concluído', 70, 70, 'Concluído', '#10b981'),
('Cancelado', 80, 80, 'Cancelado', '#6b7280');

-- 4. Criar novo constraint com todos os status válidos
ALTER TABLE public.assistances 
ADD CONSTRAINT assistances_status_check 
CHECK (status IN (
  'Pendente Resposta Inicial',
  'Pendente Aceitação', 
  'Recusada Fornecedor',
  'Agendado',
  'Em Progresso',
  'Pendente Validação',
  'Concluído',
  'Cancelado'
));

-- 5. Atualizar qualquer status existente que não seja válido para um status válido
UPDATE public.assistances 
SET status = 'Agendado' 
WHERE status = 'Pendente Agendamento';

UPDATE public.assistances 
SET status = 'Pendente Validação' 
WHERE status IN ('Reagendamento Solicitado', 'Validação Expirada');
