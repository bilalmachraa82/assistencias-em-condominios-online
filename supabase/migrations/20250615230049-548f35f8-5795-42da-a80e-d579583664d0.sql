
-- Add public read policies for buildings table
CREATE POLICY "Public read access for buildings" ON public.buildings
FOR SELECT USING (true);

-- Add public read policies for suppliers table  
CREATE POLICY "Public read access for suppliers" ON public.suppliers
FOR SELECT USING (true);

-- Ensure we have some basic intervention types if they don't exist
INSERT INTO public.intervention_types (name, description) 
VALUES 
  ('Manutenção Preventiva', 'Manutenção preventiva regular'),
  ('Reparação de Emergência', 'Reparação urgente necessária'),
  ('Instalação', 'Instalação de novos equipamentos')
ON CONFLICT DO NOTHING;

-- Ensure we have some basic valid statuses if they don't exist
INSERT INTO public.valid_statuses (status_value, label_pt, label_en, hex_color, sort_order, display_order)
VALUES 
  ('Pendente Resposta Inicial', 'Pendente Resposta Inicial', 'Pending Initial Response', '#f59e0b', 1, 1),
  ('Aceite', 'Aceite', 'Accepted', '#10b981', 2, 2),
  ('Agendado', 'Agendado', 'Scheduled', '#3b82f6', 3, 3),
  ('Concluído', 'Concluído', 'Completed', '#059669', 4, 4),
  ('Rejeitado', 'Rejeitado', 'Rejected', '#ef4444', 5, 5)
ON CONFLICT (status_value) DO NOTHING;
