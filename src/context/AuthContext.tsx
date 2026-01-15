"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { AuthState, User } from "../types"
import { supabase } from "../lib/supabase"
import { generateShortId } from "../lib/idGenerator"

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (userData: {
    email: string
    password: string
    name: string
    cpf: string
    phone: string
    birthDate: string
    profession: string
    skipOnboarding?: boolean
  }) => Promise<void>
  updateUser: (user: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  })

  useEffect(() => {
    // Verificar se o Supabase está configurado antes de tentar usar
    try {
      // Check active session
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error("Erro ao verificar sessão:", error)
          return
        }
        if (session) {
          fetchUserProfile(session.user.id)
        }
      }).catch((err) => {
        console.error("Erro ao inicializar sessão:", err)
      })

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          fetchUserProfile(session.user.id)
        } else {
          setAuthState({ user: null, isAuthenticated: false })
        }
      })

      // Adicionar um mecanismo para verificar e renovar a sessão periodicamente
      const sessionCheckInterval = setInterval(
        async () => {
          try {
            const { data, error } = await supabase.auth.getSession()
            if (error || !data.session) {
              // Se houver erro ou não houver sessão, fazer logout
              setAuthState({ user: null, isAuthenticated: false })
            }
          } catch (err) {
            console.error("Erro ao verificar sessão:", err)
          }
        },
        10 * 60 * 1000,
      ) // 10 minutos

      return () => {
        subscription.unsubscribe()
        clearInterval(sessionCheckInterval)
      }
    } catch (err) {
      console.error("Erro ao inicializar autenticação:", err)
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      // Usar maybeSingle() para não dar erro se o perfil não existir
      const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()

      // Se o erro for porque o perfil não existe ou não foi encontrado, criar um perfil básico
      if (error || !profile) {
        // Código PGRST116 = nenhum resultado encontrado (com .single())
        // Com .maybeSingle(), profile será null se não existir
        if (!profile || error?.code === "PGRST116" || error?.message?.includes("No rows")) {
          console.log("Perfil não encontrado, criando perfil básico para usuário:", userId)
          
          // Tentar buscar email do usuário autenticado
          const { data: { user: authUser } } = await supabase.auth.getUser()
          let userEmail = authUser?.email || ""
          
          // NÃO gerar display_id por enquanto, pois a coluna não existe no banco
          // Isso será habilitado após executar a migração que adiciona a coluna display_id
          // Por enquanto, criamos o perfil sem display_id

          // Criar perfil básico (sem display_id por enquanto, já que a coluna não existe)
          // IMPORTANTE: Se o usuário se registrou normalmente, o CPF já deve estar no perfil
          // Este código só é executado para usuários órfãos (que não têm perfil)
          // Para usuários que se registram normalmente, o CPF já é salvo no método register()
          
          // Gerar CPF temporário apenas para usuários órfãos
          // Este CPF temporário deve ser atualizado quando o usuário completar o onboarding
          const tempCpf = `TEMP-${userId.slice(0, 8).toUpperCase()}`
          
          const profileData: any = {
            id: userId,
            name: userEmail?.split("@")[0] || "Usuário",
            cpf: tempCpf, // CPF temporário - será atualizado no onboarding se necessário
            phone: "",
            birth_date: null,
            profession: "",
            payment_complete: false,
            registration_date: new Date().toISOString(),
          }

          // NÃO incluir display_id - a coluna não existe no banco ainda
          // O display_id será adicionado quando a migração for executada

          console.log("Tentando criar perfil com dados:", { ...profileData, cpf: "TEMP-***" })
          const { error: createError, data: createdData } = await supabase.from("profiles").insert(profileData).select()

          if (createError) {
            console.error("Erro ao criar perfil automático:", createError)
            console.error("Detalhes do erro:", {
              code: createError.code,
              message: createError.message,
              details: createError.details,
              hint: createError.hint,
            })
            
            // Se o erro for sobre display_id, já não estamos incluindo, então pode ser outro problema
            // Verificar se o perfil já foi criado (pode ter sido criado em outra tentativa)
            const { data: existingProfile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()
            if (existingProfile) {
              console.log("Perfil já existe, processando...")
              return processProfile(existingProfile)
            }
            
            // Se não conseguiu criar e não existe, retornar sem autenticar
            setAuthState({ user: null, isAuthenticated: false })
            return
          }

          // Se criou com sucesso, usar os dados retornados
          if (createdData && createdData.length > 0) {
            console.log("Perfil criado com sucesso!")
            return processProfile(createdData[0])
          }

          // Se não retornou dados, buscar o perfil recém-criado
          const { data: newProfile, error: fetchError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle()

          if (fetchError) {
            console.error("Erro ao buscar perfil recém-criado:", fetchError)
            setAuthState({ user: null, isAuthenticated: false })
            return
          }

          if (newProfile) {
            return processProfile(newProfile)
          }

          // Se chegou aqui, algo deu errado
          console.error("Perfil não foi criado e não foi encontrado")
          setAuthState({ user: null, isAuthenticated: false })
        }

        // Outros erros (RLS, permissões, etc.)
        console.error("Error fetching user profile:", error)
        
        // Se for erro 406 (Not Acceptable), pode ser problema de RLS ou formato
        if (error.message?.includes("406") || error.code === "PGRST301") {
          console.error("Erro 406 - Possível problema de RLS ou formato de resposta")
        }
        
        setAuthState({ user: null, isAuthenticated: false })
        return
      }

      // Se encontrou o perfil, processar normalmente
      if (profile) {
        processProfile(profile)
      }
    } catch (err: any) {
      console.error("Exceção ao buscar perfil:", err)
      setAuthState({ user: null, isAuthenticated: false })
    }
  }

  // Função auxiliar para processar o perfil
  const processProfile = (profile: any) => {
    // Usar os últimos 4 caracteres do UUID para exibição na carteirinha
    const shortId = profile.id.slice(-4).toUpperCase()

    setAuthState({
      user: {
        id: shortId, // ID curto para exibição (últimos 4 caracteres do UUID, sem prefixo AE-)
        uuid: profile.id, // UUID completo para operações internas
        name: profile.name,
        cpf: profile.cpf,
        email: profile.email || "", // Email pode não existir em profiles
        phone: profile.phone,
        birthDate: profile.birth_date,
        profession: profile.profession,
        paymentComplete: profile.payment_complete,
        registrationDate: profile.registration_date,
      },
      isAuthenticated: true,
    })
  }

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Verificar se é um erro de configuração
        if (error.message?.includes("Invalid API key") || error.message?.includes("Failed to fetch")) {
          throw new Error(
            "Erro de configuração do Supabase. Verifique se as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão configuradas no arquivo .env"
          )
        }
        throw error
      }

      // O listener onAuthStateChange já vai atualizar o estado
      if (data.session) {
        await fetchUserProfile(data.session.user.id)
      }
    } catch (error: any) {
      console.error("Erro no login:", error)
      throw error
    }
  }

  const register = async (userData: {
    email: string
    password: string
    name: string
    cpf: string
    phone: string
    birthDate: string
    profession: string
    skipOnboarding?: boolean
  }) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    })

    if (authError || !authData.user) {
      throw authError || new Error("Registration failed")
    }

    try {
      // Gerar ID curto para exibição (pode falhar se coluna não existir)
      let displayId: string | null = null
      try {
        displayId = await generateShortId()
      } catch (err) {
        console.log("Não foi possível gerar display_id (coluna pode não existir), continuando sem ele")
        displayId = null
      }

      const profileData: any = {
        id: authData.user.id,
        name: userData.name,
        cpf: userData.cpf, // CPF do registro
        phone: userData.phone,
        birth_date: userData.birthDate,
        profession: userData.profession,
        payment_complete: userData.skipOnboarding || false,
        registration_date: new Date().toISOString(),
        activation_date: userData.skipOnboarding ? new Date().toISOString() : null,
      }

      // Adicionar display_id apenas se foi gerado com sucesso
      if (displayId) {
        profileData.display_id = displayId
      }

      const { error: profileError } = await supabase.from("profiles").insert(profileData)

      if (profileError) {
        // Cleanup: delete auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw profileError
      }

      // Se estiver pulando o onboarding, criar registro de onboarding completo
      if (userData.skipOnboarding) {
        const { error: onboardingError } = await supabase.from("onboarding").insert({
          user_id: authData.user.id,
          id_document_url: "admin_bypass",
          address_document_url: "admin_bypass",
          payment_id: "admin_bypass",
          signature_url: "admin_bypass",
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (onboardingError) {
          // Cleanup: delete auth user and profile if onboarding creation fails
          await supabase.auth.admin.deleteUser(authData.user.id)
          throw onboardingError
        }
      }
    } catch (error) {
      // Cleanup: delete auth user if any error occurs
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw error
    }
  }

  // Modificar a função logout para lidar melhor com tokens expirados
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Erro ao fazer logout:", error)
        // Mesmo com erro, forçamos o reset do estado de autenticação no frontend
      }
    } catch (error) {
      console.error("Exceção ao fazer logout:", error)
      // Mesmo com exceção, forçamos o reset do estado de autenticação no frontend
    } finally {
      // Sempre limpar o estado de autenticação, independente de erros
      setAuthState({ user: null, isAuthenticated: false })
    }
  }

  const updateUser = async (userData: Partial<User>) => {
    if (!authState.user?.uuid) return

    const { error } = await supabase
      .from("profiles")
      .update({
        name: userData.name,
        cpf: userData.cpf,
        phone: userData.phone,
        birth_date: userData.birthDate,
        profession: userData.profession,
        payment_complete: userData.paymentComplete,
      })
      .eq("id", authState.user.uuid) // Usar o UUID para operações no banco

    if (error) {
      throw error
    }

    setAuthState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null,
    }))
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

