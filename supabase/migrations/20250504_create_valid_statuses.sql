
-- Create a table to store valid status values
CREATE TABLE IF NOT EXISTS public.valid_statuses (
  id SERIAL PRIMARY KEY,
  status_value TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the valid status values
INSERT INTO public.valid_statuses (status_value, display_order) VALUES
('Pendente Resposta Inicial', 10),
('Pendente Aceitação', 20),
('Recusada', 30),
('Pendente Agendamento', 40),
('Agendado', 50),
('Em Andamento', 60),
('Pendente Validação', 70),
('Concluído', 80),
('Reagendamento Solicitado', 90),
('Cancelado', 100)
ON CONFLICT (status_value) DO NOTHING;

-- Note: We cannot use subquery in check constraints, so this is handled in the application code instead
-- ALTER TABLE public.assistances ADD CONSTRAINT assistances_status_check CHECK (status IN (...));
