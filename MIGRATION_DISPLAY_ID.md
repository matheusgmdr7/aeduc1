# Migration: Adicionar coluna display_id

## Problema
A coluna `display_id` não existe no banco de dados, causando erros ao tentar gerar IDs para usuários.

## Solução

### Passo 1: Executar a Migration

Acesse o **SQL Editor** do Supabase:
1. Vá para https://app.supabase.com
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral
4. Execute o seguinte SQL:

```sql
-- Adicionar coluna display_id à tabela profiles se não existir
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS display_id text;

-- Criar índice único para display_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_display_id 
ON public.profiles(display_id) 
WHERE display_id IS NOT NULL;
```

### Passo 2: Verificar se a coluna foi criada

Execute esta query para verificar:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'display_id';
```

Se retornar uma linha, a coluna foi criada com sucesso.

### Passo 3: Gerar IDs para usuários existentes

Após executar a migration, você pode:
1. Usar o botão "Gerar IDs Faltantes" na página Admin
2. Ou gerar IDs individualmente clicando no botão ao lado de cada usuário sem ID

## Arquivo da Migration

O arquivo da migration está em:
`supabase/migrations/20250115000000_add_display_id.sql`

## Nota

Se você estiver usando Supabase CLI, pode executar:
```bash
supabase migration up
```

