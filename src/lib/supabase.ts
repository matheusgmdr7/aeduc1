import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validação das variáveis de ambiente
if (!supabaseUrl) {
  console.error(
    "❌ Erro: VITE_SUPABASE_URL não está configurada. Por favor, crie um arquivo .env na raiz do projeto com:",
    "\nVITE_SUPABASE_URL=sua_url_do_supabase"
  )
  throw new Error(
    "Configuração do Supabase incompleta: VITE_SUPABASE_URL não encontrada. Verifique o arquivo .env"
  )
}

if (!supabaseAnonKey) {
  console.error(
    "❌ Erro: VITE_SUPABASE_ANON_KEY não está configurada. Por favor, crie um arquivo .env na raiz do projeto com:",
    "\nVITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase"
  )
  throw new Error(
    "Configuração do Supabase incompleta: VITE_SUPABASE_ANON_KEY não encontrada. Verifique o arquivo .env"
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

