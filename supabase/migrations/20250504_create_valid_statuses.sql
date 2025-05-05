
-- Create a table to store valid status values
CREATE TABLE IF NOT EXISTS public.valid_statuses (
  id SERIAL PRIMARY KEY,
  status_value TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Use TRUNCATE to ensure clean values
TRUNCATE TABLE public.valid_statuses;

-- Insert the valid status values
INSERT INTO public.valid_statuses (status_value, display_order) VALUES
('Pendente Resposta Inicial', 10),
('Pendente Aceitação', 20),
('Recusada Fornecedor', 30),
('Pendente Agendamento', 40),
('Agendado', 50),
('Em Progresso', 60),
('Pendente Validação', 70),
('Concluído', 80),
('Reagendamento Solicitado', 90),
('Validação Expirada', 95),
('Cancelado', 100);

-- Comment out the constraint since we've already seen it causes issues
-- ALTER TABLE public.assistances ADD CONSTRAINT assistances_status_check 
--   CHECK (status IN (SELECT status_value FROM public.valid_statuses));

