-- Criar tabela member_cards para armazenar as carteirinhas dos associados

CREATE TABLE IF NOT EXISTS public.member_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_number text NOT NULL UNIQUE,
  delivery_date timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'production', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_member_cards_user_id ON public.member_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_member_cards_status ON public.member_cards(status);
CREATE INDEX IF NOT EXISTS idx_member_cards_card_number ON public.member_cards(card_number);

-- Habilitar RLS
ALTER TABLE public.member_cards ENABLE ROW LEVEL SECURITY;

-- Política para usuários lerem sua própria carteirinha
CREATE POLICY "Users can read own card"
  ON public.member_cards
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Política para admins lerem todas as carteirinhas
CREATE POLICY "Admins can read all cards"
  ON public.member_cards
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- Política para admins atualizarem carteirinhas
CREATE POLICY "Admins can update cards"
  ON public.member_cards
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- Política para admins inserirem carteirinhas
CREATE POLICY "Admins can insert cards"
  ON public.member_cards
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));

-- Política para admins excluírem carteirinhas
CREATE POLICY "Admins can delete cards"
  ON public.member_cards
  FOR DELETE
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- Função para atualizar updated_at
CREATE TRIGGER update_member_cards_updated_at
  BEFORE UPDATE ON public.member_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

