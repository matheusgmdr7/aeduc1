-- Adicionar coluna display_id à tabela profiles se não existir
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS display_id text;

-- Criar índice único para display_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_display_id ON public.profiles(display_id) WHERE display_id IS NOT NULL;

