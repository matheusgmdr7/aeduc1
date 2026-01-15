import { supabase } from "./supabase"
import { generateShortId } from "./idGenerator"

/**
 * Identifica usuários órfãos (existem em auth.users mas não em profiles)
 * Nota: Esta função requer permissões de admin no Supabase (service role key)
 * IMPORTANTE: Esta função só funciona com service role key, não com anon key
 */
export async function findOrphanUsers(): Promise<Array<{ id: string; email: string; created_at: string }>> {
  try {
    // Buscar todos os usuários autenticados
    // NOTA: Isso requer service role key, não anon key
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error("Erro ao listar usuários:", authError)
      // Se o erro for de permissão, fornecer mensagem mais clara
      if (authError.message?.includes("permission") || authError.message?.includes("admin")) {
        throw new Error(
          "Esta função requer permissões de administrador. Certifique-se de usar a service role key do Supabase.",
        )
      }
      throw authError
    }

    // Buscar todos os IDs de profiles existentes
    const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id")

    if (profilesError) {
      console.error("Erro ao buscar profiles:", profilesError)
      throw profilesError
    }

    const profileIds = new Set(profiles?.map((p) => p.id) || [])

    // Encontrar usuários que não têm perfil
    const orphanUsers = authUsers.users.filter((user) => !profileIds.has(user.id))

    return orphanUsers.map((user) => ({
      id: user.id,
      email: user.email || "",
      created_at: user.created_at || "",
    }))
  } catch (error) {
    console.error("Erro ao identificar usuários órfãos:", error)
    throw error
  }
}

/**
 * Cria perfis para usuários órfãos
 * Nota: Esta função requer dados mínimos. Se não houver dados, cria com valores padrão
 */
export async function fixOrphanUser(
  userId: string,
  userData?: {
    name?: string
    cpf?: string
    phone?: string
    birthDate?: string
    profession?: string
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar se o perfil já existe
    const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", userId).single()

    if (existingProfile) {
      return { success: true } // Perfil já existe
    }

    // Tentar buscar dados do usuário em auth.users (pode falhar sem service role key)
    let userEmail: string | undefined = undefined
    let userCreatedAt: string | undefined = undefined

    try {
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
      if (!authError && authUser?.user) {
        userEmail = authUser.user.email
        userCreatedAt = authUser.user.created_at
      }
    } catch (error) {
      // Ignorar erro se não tiver permissões - continuaremos sem o email
      console.log("Não foi possível buscar email do usuário (normal se não tiver service role key)")
    }

    // Verificar se a coluna display_id existe antes de tentar gerar
    let displayIdColumnExists = false
    let displayId: string | null = null
    
    try {
      // Tentar fazer uma query simples para verificar se a coluna existe
      const { error: testError } = await supabase
        .from("profiles")
        .select("display_id")
        .limit(0)
      
      if (!testError) {
        displayIdColumnExists = true
        // Se a coluna existe, tentar gerar o ID
        try {
          displayId = await generateShortId()
        } catch (error: any) {
          console.log("Não foi possível gerar display_id:", error.message)
          displayId = null
        }
      } else {
        // Se o erro for sobre a coluna não existir, não usar display_id
        if (testError.code === "PGRST204" || testError.message?.includes("display_id")) {
          console.log("Coluna display_id não existe no banco, pulando geração")
          displayIdColumnExists = false
        } else {
          // Outro tipo de erro, tentar mesmo assim
          displayIdColumnExists = true
          try {
            displayId = await generateShortId()
          } catch (error: any) {
            console.log("Não foi possível gerar display_id:", error.message)
            displayId = null
          }
        }
      }
    } catch (error: any) {
      console.log("Erro ao verificar se display_id existe:", error.message)
      displayIdColumnExists = false
    }

    // Gerar CPF temporário único se não fornecido (cpf é NOT NULL UNIQUE)
    const tempCpf = userData?.cpf || `TEMP-${userId.slice(0, 8).toUpperCase()}`

    // Criar perfil com dados fornecidos ou valores padrão
    const profileData: any = {
      id: userId,
      name: userData?.name || userEmail?.split("@")[0] || "Usuário",
      cpf: tempCpf,
      phone: userData?.phone || "",
      birth_date: userData?.birthDate || null,
      profession: userData?.profession || "",
      payment_complete: false,
      registration_date: userCreatedAt || new Date().toISOString(),
    }

    // Adicionar display_id apenas se a coluna existe E foi gerado com sucesso
    if (displayIdColumnExists && displayId) {
      profileData.display_id = displayId
    }

    console.log("📝 Criando perfil com dados:", { ...profileData, cpf: "TEMP-***" })

    // Inserir perfil e retornar os dados criados
    const { data: createdProfile, error: profileError } = await supabase
      .from("profiles")
      .insert(profileData)
      .select()
      .single()

    if (profileError) {
      console.error("❌ Erro ao criar perfil:", profileError)
      console.error("Detalhes do erro:", {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
      })
      return { success: false, error: profileError.message }
    }

    if (!createdProfile) {
      console.error("❌ Perfil não foi retornado após criação")
      // Tentar buscar o perfil criado
      const { data: fetchedProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("id, name, display_id, cpf")
        .eq("id", userId)
        .single()

      if (fetchError || !fetchedProfile) {
        console.error("❌ Erro ao verificar perfil criado:", fetchError)
        return { success: false, error: "Perfil criado mas não foi possível verificar" }
      }

      console.log("✅ Perfil criado e verificado:", {
        id: fetchedProfile.id,
        name: fetchedProfile.name,
        display_id: fetchedProfile.display_id,
      })
      return { success: true }
    }

    console.log("✅ Perfil criado com sucesso:", {
      id: createdProfile.id,
      name: createdProfile.name,
      display_id: createdProfile.display_id,
      cpf: createdProfile.cpf ? "TEMP-***" : "N/A",
    })
    return { success: true }
  } catch (error: any) {
    console.error("Erro ao corrigir usuário órfão:", error)
    return { success: false, error: error.message || "Erro desconhecido" }
  }
}

/**
 * Corrige todos os usuários órfãos de uma vez
 */
export async function fixAllOrphanUsers(): Promise<{
  total: number
  fixed: number
  errors: Array<{ userId: string; error: string }>
}> {
  const orphanUsers = await findOrphanUsers()
  const errors: Array<{ userId: string; error: string }> = []
  let fixed = 0

  for (const user of orphanUsers) {
    const result = await fixOrphanUser(user.id)
    if (result.success) {
      fixed++
    } else {
      errors.push({ userId: user.id, error: result.error || "Erro desconhecido" })
    }
  }

  return {
    total: orphanUsers.length,
    fixed,
    errors,
  }
}

/**
 * Corrige usuários órfãos a partir de uma lista de IDs fornecida
 * Útil quando a função findOrphanUsers não funciona por falta de permissões
 */
export async function fixOrphanUsersByIds(
  userIds: string[],
): Promise<{
  total: number
  fixed: number
  errors: Array<{ userId: string; error: string }>
}> {
  const errors: Array<{ userId: string; error: string }> = []
  let fixed = 0

  for (const userId of userIds) {
    const result = await fixOrphanUser(userId)
    if (result.success) {
      fixed++
    } else {
      errors.push({ userId, error: result.error || "Erro desconhecido" })
    }
  }

  return {
    total: userIds.length,
    fixed,
    errors,
  }
}

