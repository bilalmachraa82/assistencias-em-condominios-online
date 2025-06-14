
-- 1. Mensagens internas nas assistências
CREATE TABLE public.assistance_messages (
  id BIGSERIAL PRIMARY KEY,
  assistance_id BIGINT NOT NULL REFERENCES assistances(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'supplier')),
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Políticas base (público total temporariamente)
ALTER TABLE public.assistance_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read assistance_messages" ON public.assistance_messages FOR SELECT USING (true);
CREATE POLICY "Public insert assistance_messages" ON public.assistance_messages FOR INSERT WITH CHECK (true);

-- 2. Fotos associadas à assistência (multi-upload, categorizadas)
CREATE TABLE public.assistance_photos (
  id BIGSERIAL PRIMARY KEY,
  assistance_id BIGINT NOT NULL REFERENCES assistances(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('diagnostico','progresso','resultado')),
  uploaded_by TEXT, -- opcional, para registo/futuro
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assistance_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read assistance_photos" ON public.assistance_photos FOR SELECT USING (true);
CREATE POLICY "Public insert assistance_photos" ON public.assistance_photos FOR INSERT WITH CHECK (true);

-- 3. Adicionar estados intermédios à tabela valid_statuses
INSERT INTO valid_statuses (status_value, label_pt, sort_order, display_order, hex_color)
VALUES
  ('Avaliação em Curso', 'Avaliação em Curso', 3, 3, '#6d28d9'),              -- roxo forte
  ('Aguarda Aprovação', 'Aguarda Aprovação', 4, 4, '#f59e42'),                -- laranja claro
  ('Trabalho Suspenso', 'Trabalho Suspenso', 5, 5, '#b91c1c');                -- vermelho escuro

-- Todos os comandos suportam rollback em caso de erro!
