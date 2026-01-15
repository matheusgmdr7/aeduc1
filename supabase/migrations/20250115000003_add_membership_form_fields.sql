-- Adicionar campos adicionais da ficha cadastral à tabela profiles

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS mother_name text,
ADD COLUMN IF NOT EXISTS rg text,
ADD COLUMN IF NOT EXISTS marital_status text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS address_number text,
ADD COLUMN IF NOT EXISTS address_complement text,
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS zip_code text,
ADD COLUMN IF NOT EXISTS home_phone text,
ADD COLUMN IF NOT EXISTS mobile_phone text,
ADD COLUMN IF NOT EXISTS commercial_phone text,
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS has_dependents boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS membership_form_local text,
ADD COLUMN IF NOT EXISTS membership_form_date text;

-- Adicionar campo para PDF da ficha cadastral na tabela onboarding
ALTER TABLE public.onboarding
ADD COLUMN IF NOT EXISTS membership_form_pdf_url text;

-- Criar índices para melhorar buscas
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_state ON public.profiles(state);
CREATE INDEX IF NOT EXISTS idx_profiles_zip_code ON public.profiles(zip_code);
