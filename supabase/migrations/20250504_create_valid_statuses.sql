
-- Create a table to store valid status values
CREATE TABLE IF NOT EXISTS public.valid_statuses (
  id SERIAL PRIMARY KEY,
  status_value TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,
  label_pt TEXT,
  label_en TEXT,
  hex_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Use TRUNCATE to ensure clean values
TRUNCATE TABLE public.valid_statuses;

-- Insert the valid status values with colors
INSERT INTO public.valid_statuses (status_value, display_order, sort_order, label_pt, hex_color) VALUES
('Pendente Resposta Inicial', 10, 10, 'Pendente Resposta Inicial', '#f59e0b'),
('Pendente Aceitação', 20, 20, 'Pendente Aceitação', '#3b82f6'),
('Recusada Fornecedor', 30, 30, 'Recusada Fornecedor', '#ef4444'),
('Pendente Agendamento', 40, 40, 'Pendente Agendamento', '#8b5cf6'),
('Agendado', 50, 50, 'Agendado', '#6366f1'),
('Em Progresso', 60, 60, 'Em Progresso', '#06b6d4'),
('Pendente Validação', 70, 70, 'Pendente Validação', '#14b8a6'),
('Concluído', 80, 80, 'Concluído', '#10b981'),
('Reagendamento Solicitado', 90, 90, 'Reagendamento Solicitado', '#eab308'),
('Validação Expirada', 95, 95, 'Validação Expirada', '#f97316'),
('Cancelado', 100, 100, 'Cancelado', '#6b7280');

-- Comment out the constraint since we've already seen it causes issues
-- ALTER TABLE public.assistances ADD CONSTRAINT assistances_status_check 
--   CHECK (status IN (SELECT status_value FROM public.valid_statuses));
