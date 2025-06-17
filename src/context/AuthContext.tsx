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
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user.id)
      }
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
  }, [])

  const fetchUserProfile = async (userId: string) => {
    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return
    }

    if (profile) {
      // Usar o display_id se disponível, caso contrário extrair os últimos 5 dígitos do UUID
      const shortId = profile.display_id || profile.id.slice(-5).toUpperCase()

      setAuthState({
        user: {
          id: shortId, // ID curto para exibição
          uuid: profile.id, // UUID completo para operações internas
          name: profile.name,
          cpf: profile.cpf,
          email: profile.email,
          phone: profile.phone,
          birthDate: profile.birth_date,
          profession: profile.profession,
          paymentComplete: profile.payment_complete,
          registrationDate: profile.registration_date,
        },
        isAuthenticated: true,
      })
    }
  }

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }
    // O listener onAuthStateChange já vai atualizar o estado
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
      // Gerar ID curto para exibição
      const displayId = await generateShortId()

      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        name: userData.name,
        cpf: userData.cpf,
        phone: userData.phone,
        birth_date: userData.birthDate,
        profession: userData.profession,
        payment_complete: userData.skipOnboarding || false,
        registration_date: new Date().toISOString(),
        activation_date: userData.skipOnboarding ? new Date().toISOString() : null,
        display_id: displayId,
      })

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

