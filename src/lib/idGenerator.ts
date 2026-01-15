import { supabase } from "./supabase"

/**
 * Gera um ID curto e único para exibição
 * Formato: AEDUC-XXXXX (onde X é alfanumérico)
 */
export const generateShortId = async (): Promise<string> => {
  // Caracteres permitidos (sem caracteres ambíguos como 0/O, 1/I/l)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let isUnique = false
  let shortId = ""

  // Tenta até encontrar um ID único
  while (!isUnique) {
    // Gera um ID de 5 caracteres
    shortId = "AEDUC-"
    for (let i = 0; i < 5; i++) {
      shortId += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // Verifica se o ID já existe no banco (pode falhar se a coluna não existir)
    try {
      const { data, error } = await supabase.from("profiles").select("display_id").eq("display_id", shortId)

      if (error) {
        // Se o erro for porque a coluna não existe, usar fallback
        if (error.message?.includes("display_id") || error.code === "42703") {
          console.log("Coluna display_id não existe, usando fallback")
          return `AEDUC-${Date.now().toString(36).slice(-5).toUpperCase()}`
        }
        console.error("Erro ao verificar ID:", error)
        // Em caso de outro erro, gera um ID baseado em timestamp como fallback
        return `AEDUC-${Date.now().toString(36).slice(-5).toUpperCase()}`
      }

      // Se não encontrou nenhum registro com esse ID, então é único
      isUnique = data.length === 0
    } catch (err: any) {
      // Se houver exceção, usar fallback
      console.log("Exceção ao verificar ID, usando fallback:", err.message)
      return `AEDUC-${Date.now().toString(36).slice(-5).toUpperCase()}`
    }
  }

  return shortId
}

/**
 * Gera um ID curto a partir de um UUID
 * Usado como fallback quando não há display_id
 */
export const shortIdFromUuid = (uuid: string): string => {
  // Pega os últimos 5 caracteres do UUID e converte para maiúsculas
  return `AEDUC-${uuid.slice(-5).toUpperCase()}`
}
