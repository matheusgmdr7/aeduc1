-- Adicionar política RLS para permitir que usuários autenticados criem seu próprio perfil
-- Isso é necessário para a criação automática de perfis durante o login

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;

-- Criar política para permitir inserção do próprio perfil
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Criar política para permitir que admins criem perfis para qualquer usuário
-- Verifica se o usuário autenticado é admin (por role ou is_admin)
-- Usa uma função auxiliar para evitar problemas de dependência circular
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
    AND (role = 'admin' OR is_admin = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can insert any profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));

-- Garantir que a política de leitura permite ler o próprio perfil
-- (já deve existir, mas garantindo)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política para permitir que admins leiam todos os perfis
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- Política para permitir que admins excluam perfis
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

