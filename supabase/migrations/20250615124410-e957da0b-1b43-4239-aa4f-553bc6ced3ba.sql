
-- Cria o bucket de armazenamento para as fotos das assistências, se ainda não existir.
-- O bucket é definido como público para que as fotos possam ser visualizadas facilmente na aplicação.
INSERT INTO storage.buckets (id, name, public)
VALUES ('assistance-photos', 'assistance-photos', true)
ON CONFLICT (id) DO NOTHING;
