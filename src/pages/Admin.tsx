"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { supabase } from "../lib/supabase"
import { generateShortId } from "../lib/idGenerator"
import { findOrphanUsers, fixOrphanUser, fixAllOrphanUsers, fixOrphanUsersByIds } from "../lib/fixOrphanUsers"
import AdminSidebar from "../components/admin/AdminSidebar"
import AdminHeader from "../components/admin/AdminHeader"
import UserEditModal from "../components/admin/UserEditModal"
import CardSettingsTab from "../components/admin/CardSettingsTab"
import MemberCardsTab from "../components/admin/MemberCardsTab"
import {
  Search,
  UserPlus,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Download,
  AlertTriangle,
  Shield,
  FileText,
  CreditCard,
} from "lucide-react"
import html2canvas from "html2canvas"

// Tipos
interface UserData {
  id: string
  name: string
  email: string
  cpf: string
  phone: string
  birth_date: string
  profession: string
  payment_complete: boolean
  registration_date: string
  activation_date: string | null
  display_id: string
  role?: string
}

const Admin: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("associates")
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null)

  const generateRandomPassword = () => {
    // Gerar senha aleatória com 10 caracteres incluindo letras, números e símbolos
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    cpf: "",
    phone: "",
    birthDate: "",
    profession: "Professor",
    password: generateRandomPassword(),
    skipOnboarding: true, // Por padrão, pular o onboarding para usuários criados pelo admin
  })

  // Adicionar estas funções antes do return
  const [adminUsers, setAdminUsers] = useState<UserData[]>([])
  const [selectedUserForAdmin, setSelectedUserForAdmin] = useState("")
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [adminError, setAdminError] = useState("")
  const [adminSuccess, setAdminSuccess] = useState("")

  // Estados para usuários órfãos
  const [orphanUsers, setOrphanUsers] = useState<Array<{ id: string; email: string; created_at: string }>>([])
  const [loadingOrphans, setLoadingOrphans] = useState(false)
  const [orphanError, setOrphanError] = useState("")
  const [orphanSuccess, setOrphanSuccess] = useState("")
  const [fixingOrphans, setFixingOrphans] = useState(false)
  const [manualIds, setManualIds] = useState("")
  const [fixingManualIds, setFixingManualIds] = useState(false)

  // Adicionar esta função para buscar o email do usuário a partir do UUID
  const getUserEmailById = async (userId: string) => {
    try {
      const { data, error } = await supabase.auth.admin.getUserById(userId)

      if (error || !data || !data.user) {
        console.error("Error fetching user email:", error)
        return null
      }

      return data.user.email
    } catch (error) {
      console.error("Error in getUserEmailById:", error)
      return null
    }
  }

  const fetchAdminUsers = async () => {
    setLoadingAdmins(true)
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("role", "admin").order("name")

      if (error) throw error
      setAdminUsers(data || [])
    } catch (error) {
      console.error("Erro ao buscar administradores:", error)
      setAdminError("Erro ao carregar administradores")
    } finally {
      setLoadingAdmins(false)
    }
  }

  const makeUserAdmin = async () => {
    if (!selectedUserForAdmin) {
      setAdminError("Selecione um usuário")
      return
    }

    setLoadingAdmins(true)
    setAdminError("")
    setAdminSuccess("")

    try {
      const { error } = await supabase.from("profiles").update({ role: "admin" }).eq("id", selectedUserForAdmin)

      if (error) throw error

      setAdminSuccess("Usuário promovido a administrador com sucesso!")
      setSelectedUserForAdmin("")
      fetchAdminUsers()
    } catch (error) {
      console.error("Erro ao promover usuário:", error)
      setAdminError("Erro ao promover usuário a administrador")
    } finally {
      setLoadingAdmins(false)
    }
  }

  const removeAdmin = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário como administrador?")) {
      return
    }

    setLoadingAdmins(true)
    setAdminError("")
    setAdminSuccess("")

    try {
      const { error } = await supabase.from("profiles").update({ role: "user" }).eq("id", userId)

      if (error) throw error

      setAdminSuccess("Permissões de administrador removidas com sucesso!")
      fetchAdminUsers()
    } catch (error) {
      console.error("Erro ao remover administrador:", error)
      setAdminError("Erro ao remover permissões de administrador")
    } finally {
      setLoadingAdmins(false)
    }
  }

  // Verificar se o usuário é administrador
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin-login")
      return
    }

    // Aqui você pode adicionar uma verificação para confirmar se o usuário tem permissões de admin
    checkAdminAccess()
  }, [isAuthenticated, navigate])

  // Substituir a função checkAdminAccess por esta versão mais robusta
  const checkAdminAccess = async () => {
    try {
      if (!user) {
        console.log("Admin check failed: No user found")
        navigate("/admin-login")
        return
      }

      console.log("User object for admin check:", user)

      // Primeiro, verificar se o usuário tem UUID
      if (!user.uuid) {
        console.log("Admin check failed: No UUID found in user object")
        navigate("/admin-login")
        return
      }

      // Verificar diretamente no banco de dados se o usuário é admin
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.uuid)
        .single()

      console.log("Profile data from database:", profileData)

      if (profileError) {
        console.error("Error fetching profile:", profileError)
        navigate("/admin-login")
        return
      }

      // Se o usuário já tem role = 'admin', conceder acesso
      if (profileData && profileData.role === "admin") {
        console.log("User is admin by role in database")
        setIsAdmin(true)
        fetchUsers()
        return
      }

      // Se não for admin por role, verificar se é admin por email
      // Buscar o email do usuário na tabela auth.users
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData || !userData.user) {
        console.error("Error fetching auth user:", userError)
        navigate("/admin-login")
        return
      }

      const userEmail = userData.user.email
      console.log("User email from auth:", userEmail)

      // Lista de emails de administradores
      const adminEmails = ["contato@aeducbrasil.com.br"]

      if (!adminEmails.includes(userEmail)) {
        console.log("User is not an admin by email check")
        navigate("/admin-login")
        return
      }

      // Se chegou aqui, o usuário é admin por email
      console.log("User is admin by email, granting access")
      setIsAdmin(true)
      fetchUsers()

      // Atualizar o campo role para este usuário
      try {
        const { error } = await supabase.from("profiles").update({ role: "admin" }).eq("id", user.uuid)

        if (error) {
          console.error("Failed to update role:", error)
        } else {
          console.log("Updated role to admin for user:", userEmail)
        }
      } catch (updateError) {
        console.error("Exception when updating role:", updateError)
      }
    } catch (error) {
      console.error("Error checking admin access:", error)
      navigate("/admin-login")
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      // Forçar uma nova busca sem cache
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("name", { ascending: true })

      if (error) {
        console.error("Erro ao buscar usuários:", error)
        throw error
      }

      // Mapear os dados para incluir email (que não existe em profiles)
      // Como não temos acesso direto ao email sem service role key, vamos usar um placeholder
      // O email será exibido como "N/A" se não estiver disponível
      const usersWithEmail = (data || []).map((profile: any) => {
        // Verificar se display_id existe e não está vazio
        // Pode ser undefined, null, ou string vazia
        let displayId = null
        if (profile.display_id !== undefined && profile.display_id !== null) {
          const trimmed = String(profile.display_id).trim()
          displayId = trimmed !== "" ? trimmed : null
        }
        
        return {
          ...profile,
          email: profile.email || "N/A", // Email não existe em profiles
          registration_date: profile.registration_date || profile.created_at,
          display_id: displayId, // Garantir que display_id seja null se não existir ou estiver vazio
        }
      })

      console.log(`✅ Usuários carregados: ${usersWithEmail.length}`)
      console.log("IDs dos usuários:", usersWithEmail.map((u: any) => ({ name: u.name, display_id: u.display_id, id: u.id })))
      setUsers(usersWithEmail)
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewUser((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setNewUser((prev) => ({ ...prev, [name]: checked }))
  }

  const regeneratePassword = () => {
    setNewUser((prev) => ({ ...prev, password: generateRandomPassword() }))
  }

  // Substitua a função addUser para remover referências a activation_date
  const addUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setSuccessMessage("")
    setLoading(true)

    try {
      // Validar dados
      if (
        !newUser.name ||
        !newUser.email ||
        !newUser.cpf ||
        !newUser.phone ||
        !newUser.birthDate ||
        !newUser.profession
      ) {
        throw new Error("Todos os campos são obrigatórios")
      }

      // 1. Criar usuário na autenticação do Supabase
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true, // Confirma o email automaticamente
      })

      if (authError) throw authError

      // 2. Gerar ID curto para exibição
      const displayId = await generateShortId()

      // 3. Criar perfil do usuário (sem activation_date)
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        name: newUser.name,
        cpf: newUser.cpf,
        phone: newUser.phone,
        birth_date: newUser.birthDate,
        profession: newUser.profession,
        payment_complete: newUser.skipOnboarding, // Marca como ativo se pular onboarding
        registration_date: new Date().toISOString(),
        // Removemos a referência a activation_date
        display_id: displayId,
      })

      if (profileError) throw profileError

      // 4. Criar registro de onboarding completo se estiver pulando o onboarding
      if (newUser.skipOnboarding) {
        const { error: onboardingError } = await supabase.from("onboarding").insert({
          user_id: authData.user.id,
          id_document_url: "admin_created",
          address_document_url: "admin_created",
          payment_id: "admin_created",
          signature_url: "admin_created",
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (onboardingError) throw onboardingError
      }

      setSuccessMessage(
        `Usuário ${newUser.name} adicionado com sucesso! ${
          newUser.skipOnboarding ? "Usuário ativado automaticamente." : "Usuário precisará completar o onboarding."
        } Senha: ${newUser.password}`,
      )

      // Limpar formulário
      setNewUser({
        name: "",
        email: "",
        cpf: "",
        phone: "",
        birthDate: "",
        profession: "Professor",
        password: generateRandomPassword(),
        skipOnboarding: true,
      })

      // Atualizar lista de usuários
      fetchUsers()

      // Fechar formulário após 5 segundos
      setTimeout(() => {
        setShowAddForm(false)
        setSuccessMessage("")
      }, 5000)
    } catch (error: any) {
      console.error("Erro ao adicionar usuário:", error)
      setFormError(error.message || "Erro ao adicionar usuário")
    } finally {
      setLoading(false)
    }
  }

  // Substitua a função toggleUserStatus por esta versão corrigida
  const toggleUserStatus = async (userId: string, currentStatus: boolean, userName: string) => {
    try {
      // Primeiro, atualizar o status do usuário (sem a coluna activation_date)
      const { error } = await supabase
        .from("profiles")
        .update({
          payment_complete: !currentStatus,
          // Removemos a referência a activation_date
        })
        .eq("id", userId)

      if (error) throw error

      // Se estiver ativando o usuário, verificar e criar registro de onboarding e carteirinha
      if (!currentStatus) {
        // Verificar se já existe um registro de onboarding
        const { data: existingOnboarding, error: checkError } = await supabase
          .from("onboarding")
          .select("id")
          .eq("user_id", userId)

        // Se houver erro que não seja "não encontrado", lançar erro
        if (checkError && checkError.code !== "42P01") {
          // 42P01 = tabela não existe, ignorar
          console.error("Erro ao verificar onboarding:", checkError)
        }

        // Se não existir registro ou a lista estiver vazia, criar um novo
        if (!existingOnboarding || existingOnboarding.length === 0) {
          try {
            const { error: onboardingError } = await supabase.from("onboarding").insert({
              user_id: userId,
              id_document_url: "admin_activated",
              address_document_url: "admin_activated",
              payment_id: "admin_activated",
              signature_url: "admin_activated",
              completed_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

            if (onboardingError && onboardingError.code !== "42P01") {
              console.warn("Aviso ao criar registro de onboarding:", onboardingError)
            }
          } catch (err) {
            console.warn("Aviso: não foi possível criar registro de onboarding:", err)
          }
        }

        // Criar carteirinha para o usuário ativado
        try {
          // Verificar se já existe uma carteirinha
          const { data: existingCard, error: cardCheckError } = await supabase
            .from("member_cards")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle()

          if (cardCheckError && cardCheckError.code !== "42P01") {
            // 42P01 = tabela não existe, ignorar
            console.warn("Aviso ao verificar carteirinha:", cardCheckError)
          }

          // Se não existir carteirinha, criar uma nova
          if (!existingCard) {
            // Gerar número da carteirinha (formato: AEDUC-YYYYMMDD-XXXXX)
            const year = new Date().getFullYear()
            const month = String(new Date().getMonth() + 1).padStart(2, "0")
            const day = String(new Date().getDate()).padStart(2, "0")
            const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase()
            const cardNumber = `AEDUC-${year}${month}${day}-${randomSuffix}`

            // Calcular data de entrega (7 dias a partir de hoje)
            const deliveryDate = new Date()
            deliveryDate.setDate(deliveryDate.getDate() + 7)

            const { error: cardError } = await supabase.from("member_cards").insert({
              user_id: userId,
              card_number: cardNumber,
              delivery_date: deliveryDate.toISOString(),
              status: "pending",
            })

            if (cardError && cardError.code !== "42P01") {
              console.warn("Aviso ao criar carteirinha:", cardError)
            } else {
              console.log("✅ Carteirinha criada:", cardNumber)
            }
          }
        } catch (err) {
          console.warn("Aviso: não foi possível criar carteirinha:", err)
        }

        // Mostrar mensagem de sucesso
        setActivationSuccess(`Usuário ${userName} ativado com sucesso!`)
        setTimeout(() => setActivationSuccess(null), 3000)
      }

      // Atualizar lista de usuários
      fetchUsers()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      alert("Erro ao atualizar status do usuário: " + (error.message || "Erro desconhecido"))
    }
  }

  // Função para gerar display_id para usuários que não têm
  const generateDisplayIdForUser = async (userId: string) => {
    try {
      // Verificar se o usuário já tem display_id
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("id, name, display_id")
        .eq("id", userId)
        .single()

      if (fetchError) {
        // Se o erro for porque a coluna não existe, informar o usuário
        if (fetchError.code === "42703" || fetchError.message?.includes("display_id")) {
          alert("A coluna display_id não existe no banco de dados. Por favor, execute a migration primeiro:\n\nsupabase/migrations/20250115000000_add_display_id.sql")
          return
        }
        throw fetchError
      }

      // Verificar se já tem display_id (não nulo e não vazio)
      if (profile?.display_id && profile.display_id.trim() !== "") {
        alert("Este usuário já possui um display_id: " + profile.display_id)
        return
      }

      // Gerar novo display_id
      const displayId = await generateShortId()

      // Atualizar o perfil com o novo display_id
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ display_id: displayId })
        .eq("id", userId)

      if (updateError) {
        // Se o erro for porque a coluna não existe
        if (updateError.code === "42703" || updateError.message?.includes("display_id")) {
          alert("A coluna display_id não existe no banco de dados. Por favor, execute a migration primeiro:\n\nsupabase/migrations/20250115000000_add_display_id.sql")
          return
        }
        throw updateError
      }

      alert(`Display ID gerado com sucesso: ${displayId}`)
      // Atualizar lista de usuários
      await fetchUsers()
    } catch (error: any) {
      console.error("Erro ao gerar display_id:", error)
      alert("Erro ao gerar display_id: " + (error.message || "Erro desconhecido"))
    }
  }

  // Função para gerar display_id para todos os usuários que não têm
  const generateDisplayIdsForAll = async () => {
    if (!confirm("Deseja gerar display_id para todos os usuários que não possuem? Esta ação pode levar alguns minutos.")) {
      return
    }

    try {
      // Primeiro, verificar se a coluna existe tentando buscar todos os usuários
      const { data: allUsers, error: testError } = await supabase
        .from("profiles")
        .select("id, name, display_id")
        .limit(1)

      if (testError) {
        // Se o erro for porque a coluna não existe
        if (testError.code === "42703" || testError.message?.includes("display_id")) {
          alert("A coluna display_id não existe no banco de dados.\n\nPor favor, execute a migration primeiro:\n\nsupabase/migrations/20250115000000_add_display_id.sql\n\nOu execute no SQL Editor do Supabase:\n\nALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_id text;")
          return
        }
        throw testError
      }

      // Buscar todos os usuários e filtrar os que não têm display_id
      const { data: allUsersData, error: fetchError } = await supabase
        .from("profiles")
        .select("id, name, display_id")

      if (fetchError) throw fetchError

      // Filtrar usuários sem display_id (null, undefined ou string vazia)
      const usersWithoutId = (allUsersData || []).filter(
        (user) => !user.display_id || user.display_id.trim() === ""
      )

      if (usersWithoutId.length === 0) {
        alert("Todos os usuários já possuem display_id!")
        return
      }

      alert(`Encontrados ${usersWithoutId.length} usuários sem display_id. Gerando IDs...`)

      let successCount = 0
      let errorCount = 0

      for (const user of usersWithoutId) {
        try {
          const displayId = await generateShortId()
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ display_id: displayId })
            .eq("id", user.id)

          if (updateError) {
            console.error(`Erro ao atualizar ${user.name}:`, updateError)
            errorCount++
          } else {
            successCount++
          }
        } catch (err) {
          console.error(`Erro ao gerar ID para ${user.name}:`, err)
          errorCount++
        }
      }

      alert(`Processo concluído!\n✅ ${successCount} IDs gerados com sucesso\n❌ ${errorCount} erros`)
      await fetchUsers()
    } catch (error: any) {
      console.error("Erro ao gerar display_ids:", error)
      if (error.code === "42703" || error.message?.includes("display_id")) {
        alert("A coluna display_id não existe no banco de dados.\n\nPor favor, execute a migration primeiro:\n\nsupabase/migrations/20250115000000_add_display_id.sql")
      } else {
        alert("Erro ao gerar display_ids: " + (error.message || "Erro desconhecido"))
      }
    }
  }

  // Função para baixar a ficha cadastral assinada do associado
  const downloadMembershipForm = async (userId: string, userName: string) => {
    try {
      // Buscar URL do PDF da ficha cadastral
      const { data: onboardingData, error } = await supabase
        .from("onboarding")
        .select("membership_form_pdf_url")
        .eq("user_id", userId)
        .maybeSingle()

      if (error) throw error

      if (!onboardingData?.membership_form_pdf_url) {
        alert("Ficha cadastral não encontrada para este associado.")
        return
      }

      const pdfUrl = onboardingData.membership_form_pdf_url

      // Se for uma URL completa, fazer download direto
      if (pdfUrl.startsWith("http")) {
        const link = document.createElement("a")
        link.href = pdfUrl
        link.download = `ficha-cadastral-${userName.replace(/\s+/g, "-")}.pdf`
        link.target = "_blank"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // Se for um caminho, gerar URL assinada
        const filePath = pdfUrl.replace("user-documents/", "")
        const { data: signedUrlData, error: signError } = await supabase.storage
          .from("user-documents")
          .createSignedUrl(filePath, 3600)

        if (signError || !signedUrlData) {
          throw new Error("Erro ao gerar URL do PDF")
        }

        const link = document.createElement("a")
        link.href = signedUrlData.signedUrl
        link.download = `ficha-cadastral-${userName.replace(/\s+/g, "-")}.pdf`
        link.target = "_blank"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error: any) {
      console.error("Erro ao baixar ficha cadastral:", error)
      alert("Erro ao baixar ficha cadastral: " + (error.message || "Erro desconhecido"))
    }
  }

  // Função para baixar a carteirinha do associado
  const downloadMemberCard = async (userData: UserData) => {
    try {
      // Criar um elemento temporário para renderizar a carteirinha
      const tempDiv = document.createElement("div")
      tempDiv.style.position = "absolute"
      tempDiv.style.left = "-9999px"
      tempDiv.style.top = "-9999px"
      document.body.appendChild(tempDiv)

      const cardContainer = document.createElement("div")
      cardContainer.className = "bg-white rounded-lg shadow-lg overflow-hidden border border-blue-200 max-w-sm"
      tempDiv.appendChild(cardContainer)

      const formatDate = (dateString: string) => {
        try {
          return new Date(dateString).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        } catch {
          return dateString
        }
      }

      // Usar os últimos 4 caracteres do UUID para o ID na carteirinha
      const cardId = `AE-${userData.id.slice(-4).toUpperCase()}`

      cardContainer.innerHTML = `
        <div class="bg-blue-900 text-white p-4 flex items-center justify-between">
          <div class="flex items-center">
            <img
              src="https://i.ibb.co/wFphQghp/AEDUC-CANECA-01071-AZUL-BOLETIM-45110-CURVAS.png"
              alt="Logo AEDUC"
              class="h-7 mr-2"
            />
            <h3 class="text-xl font-bold">Associação</h3>
          </div>
          <div class="text-sm">
            <p>ID: ${cardId}</p>
          </div>
        </div>
        <div class="p-6">
          <div class="mb-4 text-center">
            <h2 class="text-2xl font-bold text-blue-900">${userData.name}</h2>
            <p class="text-gray-600">${userData.profession}</p>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="font-semibold text-gray-600">CPF:</span>
              <span>${userData.cpf}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold text-gray-600">Data de Nascimento:</span>
              <span>${formatDate(userData.birth_date)}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold text-gray-600">Data de Registro:</span>
              <span>${formatDate(userData.registration_date)}</span>
            </div>
          </div>
        </div>
        <div class="bg-blue-100 p-4 text-center">
          <p class="text-blue-900 font-medium">
            ${userData.payment_complete ? "Associado Ativo" : "Pendente de Pagamento"}
          </p>
        </div>
      `

      // Aguardar carregamento da imagem
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Capturar como canvas
      const canvas = await html2canvas(cardContainer, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      })

      // Criar link de download
      const imgData = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = `carteirinha-${userData.name.replace(/\s+/g, "-")}-${cardId}.png`
      link.href = imgData
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Limpar elemento temporário
      document.body.removeChild(tempDiv)
    } catch (error: any) {
      console.error("Erro ao baixar carteirinha:", error)
      alert("Erro ao baixar carteirinha: " + (error.message || "Erro desconhecido"))
    }
  }

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${userName}? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      console.log("🗑️ Iniciando exclusão do usuário:", userId)

      // 1. Excluir registros de onboarding (se existir a tabela)
      try {
        const { error: onboardingError } = await supabase.from("onboarding").delete().eq("user_id", userId)
        if (onboardingError && onboardingError.code !== "42P01") {
          // 42P01 = tabela não existe, ignorar
          console.warn("Aviso ao excluir onboarding:", onboardingError)
        } else {
          console.log("✅ Registros de onboarding excluídos")
        }
      } catch (err) {
        console.warn("Aviso: não foi possível excluir onboarding:", err)
      }

      // 2. Excluir registros de member_cards (se existir a tabela)
      try {
        const { error: cardsError } = await supabase.from("member_cards").delete().eq("user_id", userId)
        if (cardsError && cardsError.code !== "42P01") {
          // 42P01 = tabela não existe, ignorar
          console.warn("Aviso ao excluir member_cards:", cardsError)
        } else {
          console.log("✅ Registros de member_cards excluídos")
        }
      } catch (err) {
        console.warn("Aviso: não foi possível excluir member_cards:", err)
      }

      // 3. Excluir perfil (isso remove o acesso do usuário ao sistema)
      const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId)

      if (profileError) {
        console.error("❌ Erro ao excluir perfil:", profileError)
        throw profileError
      }

      console.log("✅ Perfil excluído com sucesso")

      // Nota: Não podemos excluir o usuário de auth.users sem service_role key
      // Mas sem o perfil, o usuário não terá acesso ao sistema
      alert(`Usuário ${userName} foi excluído do sistema com sucesso.\n\nNota: O usuário ainda existe na autenticação, mas não terá acesso ao sistema por não possuir perfil.`)

      // Atualizar lista de usuários
      await fetchUsers()
    } catch (error: any) {
      console.error("❌ Erro ao excluir usuário:", error)
      
      // Mensagem de erro mais amigável
      let errorMessage = "Erro ao excluir usuário"
      if (error.message?.includes("permission") || error.message?.includes("policy")) {
        errorMessage = "Você não tem permissão para excluir usuários. Verifique as políticas RLS do banco de dados."
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`
      }
      
      alert(errorMessage)
    }
  }

  const exportUsersToCsv = () => {
    // Criar cabeçalho CSV
    const headers = ["ID", "Nome", "Email", "CPF", "Telefone", "Profissão", "Status", "Data de Registro"]

    // Converter dados dos usuários para linhas CSV
    const userRows = users.map((user) => [
      user.display_id || "Sem ID",
      user.name,
      user.email,
      user.cpf,
      user.phone,
      user.profession,
      user.payment_complete ? "Ativo" : "Inativo",
      new Date(user.registration_date).toLocaleDateString("pt-BR"),
    ])

    // Combinar cabeçalho e linhas
    const csvContent = [headers.join(","), ...userRows.map((row) => row.join(","))].join("\n")

    // Criar blob e link para download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `usuarios-aeduc-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filtrar usuários com base no termo de busca
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.cpf.includes(searchTerm) ||
      (user.display_id && user.display_id.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Adicionar useEffect para carregar administradores quando a aba "settings" estiver ativa
  useEffect(() => {
    if (activeTab === "settings" && isAdmin) {
      fetchAdminUsers()
    }
  }, [activeTab, isAdmin])

  // Funções para gerenciar usuários órfãos
  const fetchOrphanUsers = async () => {
    setLoadingOrphans(true)
    setOrphanError("")
    try {
      const orphans = await findOrphanUsers()
      setOrphanUsers(orphans)
    } catch (error: any) {
      console.error("Erro ao buscar usuários órfãos:", error)
      setOrphanError(error.message || "Erro ao buscar usuários órfãos. Verifique se você tem permissões de admin.")
    } finally {
      setLoadingOrphans(false)
    }
  }

  const handleFixOrphanUser = async (userId: string) => {
    setOrphanError("")
    setOrphanSuccess("")
    try {
      console.log("🔧 Corrigindo usuário órfão:", userId)
      const result = await fixOrphanUser(userId)
      if (result.success) {
        setOrphanSuccess("Perfil criado com sucesso!")
        
        // Aguardar um pouco mais para garantir que o banco processou a transação
        console.log("⏳ Aguardando sincronização do banco...")
        await new Promise((resolve) => setTimeout(resolve, 1000))
        
        // Recarregar lista de órfãos
        await fetchOrphanUsers()
        // Recarregar lista de usuários com delay adicional
        await new Promise((resolve) => setTimeout(resolve, 500))
        await fetchUsers()
        
        console.log("✅ Usuário corrigido e lista atualizada")
      } else {
        console.error("❌ Erro ao corrigir:", result.error)
        setOrphanError(result.error || "Erro ao corrigir usuário")
      }
    } catch (error: any) {
      console.error("Erro ao corrigir usuário órfão:", error)
      setOrphanError(error.message || "Erro ao corrigir usuário")
    }
  }

  const handleFixAllOrphans = async () => {
    if (!confirm("Tem certeza que deseja corrigir todos os usuários órfãos? Isso criará perfis para todos eles.")) {
      return
    }

    setFixingOrphans(true)
    setOrphanError("")
    setOrphanSuccess("")
    try {
      const result = await fixAllOrphanUsers()
      setOrphanSuccess(
        `Correção concluída! ${result.fixed} de ${result.total} usuários corrigidos.${result.errors.length > 0 ? ` ${result.errors.length} erros.` : ""}`,
      )
      // Recarregar lista de órfãos
      await fetchOrphanUsers()
      
      // Aguardar um pouco para garantir que o banco processou a transação
      console.log("⏳ Aguardando sincronização do banco...")
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      // Recarregar lista de usuários com delay adicional
      await new Promise((resolve) => setTimeout(resolve, 500))
      await fetchUsers()
      
      console.log("✅ Usuários corrigidos e lista atualizada")
    } catch (error: any) {
      console.error("Erro ao corrigir usuários órfãos:", error)
      setOrphanError(error.message || "Erro ao corrigir usuários")
    } finally {
      setFixingOrphans(false)
    }
  }

  const handleFixManualIds = async () => {
    if (!manualIds.trim()) {
      setOrphanError("Por favor, insira pelo menos um ID")
      return
    }

    // Separar IDs por linha, vírgula ou espaço
    const ids = manualIds
      .split(/[\n,\s]+/)
      .map((id) => id.trim())
      .filter((id) => id.length > 0)

    if (ids.length === 0) {
      setOrphanError("Nenhum ID válido encontrado")
      return
    }

    setFixingManualIds(true)
    setOrphanError("")
    setOrphanSuccess("")

    try {
      const result = await fixOrphanUsersByIds(ids)
      setOrphanSuccess(
        `Correção concluída! ${result.fixed} de ${result.total} usuários corrigidos.${result.errors.length > 0 ? ` ${result.errors.length} erros.` : ""}`,
      )

      if (result.errors.length > 0) {
        const errorDetails = result.errors.map((e) => `${e.userId}: ${e.error}`).join("\n")
        console.error("Erros ao corrigir usuários:", errorDetails)
        setOrphanError(`Alguns usuários tiveram erros: ${result.errors.length} de ${result.total}`)
      }

      // Aguardar um pouco mais para garantir que o banco processou a transação
      console.log("⏳ Aguardando sincronização do banco...")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Recarregar lista de usuários com delay adicional
      await new Promise((resolve) => setTimeout(resolve, 500))
      await fetchUsers()
      
      console.log("✅ Usuários corrigidos e lista atualizada")
      
      // Limpar campo
      setManualIds("")
    } catch (error: any) {
      console.error("Erro ao corrigir usuários órfãos:", error)
      setOrphanError(error.message || "Erro ao corrigir usuários")
    } finally {
      setFixingManualIds(false)
    }
  }

  // Carregar usuários órfãos quando a aba for ativada
  useEffect(() => {
    if (activeTab === "orphans" && isAdmin) {
      fetchOrphanUsers()
    }
  }, [activeTab, isAdmin])

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="flex items-center justify-center mb-6 text-amber-500">
            <AlertTriangle size={48} />
          </div>
          <h1 className="text-2xl font-bold text-center mb-4">Acesso Restrito</h1>
          <p className="text-gray-600 text-center mb-6">
            Você não tem permissão para acessar esta área. Esta página é restrita a administradores.
          </p>
          <button
            onClick={() => navigate("/admin-login")}
            className="w-full bg-blue-900 text-white py-2 px-4 rounded-md hover:bg-blue-800 transition-colors"
          >
            Voltar para o Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col">
        <AdminHeader
          title={
            activeTab === "associates"
              ? "Gerenciamento de Associados"
              : activeTab === "stats"
                ? "Estatísticas"
                : activeTab === "cards"
                  ? "Gerenciamento de Carteirinhas"
                  : activeTab === "orphans"
                    ? "Usuários Órfãos"
                    : "Configurações"
          }
        />

        <main className="flex-1 p-6">
          {activeTab === "associates" && (
            <div className="space-y-6">
              {/* Mensagem de sucesso para ativação de usuário */}
              {activationSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    {activationSuccess}
                  </div>
                  <button onClick={() => setActivationSuccess(null)} className="text-green-700 hover:text-green-900">
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Cabeçalho com ações */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                  >
                    <UserPlus className="h-5 w-5 mr-2" />
                    <span>Adicionar Usuário</span>
                  </button>

                  <button
                    onClick={fetchUsers}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    title="Atualizar lista"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </button>

                  <button
                    onClick={exportUsersToCsv}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    <span className="hidden sm:inline">Exportar</span>
                  </button>
                </div>
              </div>

              {/* Formulário de adição de usuário */}
              {showAddForm && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-blue-900">Adicionar Novo Usuário</h2>
                    <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-700">
                      <XCircle className="h-6 w-6" />
                    </button>
                  </div>

                  {formError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                      {formError}
                    </div>
                  )}

                  {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
                      {successMessage}
                    </div>
                  )}

                  <form onSubmit={addUser}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Nome Completo*
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={newUser.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email*
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={newUser.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">
                          CPF*
                        </label>
                        <input
                          type="text"
                          id="cpf"
                          name="cpf"
                          value={newUser.cpf}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Telefone*
                        </label>
                        <input
                          type="text"
                          id="phone"
                          name="phone"
                          value={newUser.phone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
                          Data de Nascimento*
                        </label>
                        <input
                          type="date"
                          id="birthDate"
                          name="birthDate"
                          value={newUser.birthDate}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-1">
                          Profissão*
                        </label>
                        <select
                          id="profession"
                          name="profession"
                          value={newUser.profession}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="Professor">Professor</option>
                          <option value="Diretor">Diretor</option>
                          <option value="Reitor">Reitor</option>
                          <option value="Estudante de Nível Superior">Estudante de Nível Superior</option>
                          <option value="Funcionários de Instituições Educacionais">
                            Funcionários de Instituições Educacionais
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Senha Gerada*</label>
                      <div className="flex">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newUser.password}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                          readOnly
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="px-3 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                        >
                          {showPassword ? "Ocultar" : "Mostrar"}
                        </button>
                        <button
                          type="button"
                          onClick={regeneratePassword}
                          className="px-3 py-2 bg-blue-900 text-white rounded-r-md hover:bg-blue-800 transition-colors"
                        >
                          Gerar Nova
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Esta senha será enviada ao usuário. Ele poderá alterá-la posteriormente.
                      </p>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="skipOnboarding"
                          name="skipOnboarding"
                          checked={newUser.skipOnboarding}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="skipOnboarding" className="ml-2 block text-sm text-gray-700">
                          Ativar usuário imediatamente (pular onboarding)
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-6">
                        Se marcado, o usuário será ativado imediatamente sem precisar passar pelo processo de
                        onboarding.
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-5 w-5 mr-2" />
                            Adicionar Usuário
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tabela de usuários */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          ID
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Nome
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Email
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          CPF
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Data de Registro
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center">
                            <RefreshCw className="h-6 w-6 mx-auto animate-spin text-blue-600" />
                            <p className="mt-2 text-gray-500">Carregando usuários...</p>
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                            Nenhum usuário encontrado
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              AE-{user.id.slice(-4).toUpperCase()}
                              {user.role === "admin" && (
                                <span className="ml-2 inline-flex items-center">
                                  <Shield className="h-4 w-4 text-blue-600" title="Administrador" />
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.cpf}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.payment_complete ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {user.payment_complete ? "Ativo" : "Inativo"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.registration_date).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => downloadMembershipForm(user.id, user.name)}
                                  className="p-1 text-purple-600 hover:bg-purple-100 rounded-full"
                                  title="Baixar Ficha Cadastral"
                                >
                                  <FileText className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => downloadMemberCard(user)}
                                  className="p-1 text-indigo-600 hover:bg-indigo-100 rounded-full"
                                  title="Baixar Carteirinha"
                                >
                                  <CreditCard className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => toggleUserStatus(user.id, user.payment_complete, user.name)}
                                  className={`p-1 rounded-full ${
                                    user.payment_complete
                                      ? "text-red-600 hover:bg-red-100"
                                      : "text-green-600 hover:bg-green-100"
                                  }`}
                                  title={user.payment_complete ? "Desativar usuário" : "Ativar usuário"}
                                >
                                  {user.payment_complete ? (
                                    <XCircle className="h-5 w-5" />
                                  ) : (
                                    <CheckCircle className="h-5 w-5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => setEditingUserId(user.id)}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded-full"
                                  title="Editar usuário"
                                >
                                  <Edit className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => deleteUser(user.id, user.name)}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded-full"
                                  title="Excluir usuário"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Aba de Carteirinhas */}
          {activeTab === "cards" && (
            <div className="space-y-8">
              <CardSettingsTab />
              <MemberCardsTab />
            </div>
          )}

          {/* Aba de Usuários Órfãos */}
          {activeTab === "orphans" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-blue-900">Usuários Órfãos</h2>
                    <p className="text-gray-600 mt-1">
                      Usuários que existem na autenticação mas não têm perfil na tabela profiles
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={fetchOrphanUsers}
                      disabled={loadingOrphans}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loadingOrphans ? "animate-spin" : ""}`} />
                      Atualizar
                    </button>
                    {orphanUsers.length > 0 && (
                      <button
                        onClick={handleFixAllOrphans}
                        disabled={fixingOrphans}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
                      >
                        {fixingOrphans ? "Corrigindo..." : `Corrigir Todos (${orphanUsers.length})`}
                      </button>
                    )}
                  </div>
                </div>

                {orphanError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                    {orphanError}
                  </div>
                )}

                {orphanSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
                    {orphanSuccess}
                  </div>
                )}

                {/* Seção para inserir IDs manualmente */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Corrigir Usuários por ID</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Se você conhece os IDs dos usuários órfãos, cole-os aqui (um por linha, separados por vírgula ou espaço):
                  </p>
                  <div className="space-y-3">
                    <textarea
                      value={manualIds}
                      onChange={(e) => setManualIds(e.target.value)}
                      placeholder="Cole os IDs aqui, um por linha ou separados por vírgula/espaço&#10;Exemplo:&#10;uuid-1&#10;uuid-2&#10;uuid-3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      rows={6}
                    />
                    <button
                      onClick={handleFixManualIds}
                      disabled={fixingManualIds || !manualIds.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {fixingManualIds ? "Corrigindo..." : "Corrigir Usuários"}
                    </button>
                  </div>
                </div>

                {loadingOrphans ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
                  </div>
                ) : orphanUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Nenhum usuário órfão encontrado!</p>
                    <p className="text-gray-500 text-sm mt-2">Todos os usuários têm perfis correspondentes.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data de Criação
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orphanUsers.map((orphan) => (
                          <tr key={orphan.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{orphan.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                              {orphan.id.slice(0, 8)}...
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(orphan.created_at).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleFixOrphanUser(orphan.id)}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                              >
                                Criar Perfil
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modificar a seção de configurações no return */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-blue-900 mb-6">Configurações</h2>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Gerenciar Administradores</h3>

                {adminError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                    {adminError}
                  </div>
                )}

                {adminSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
                    {adminSuccess}
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-700 mb-2">Adicionar Administrador</h4>
                  <div className="flex gap-2">
                    <select
                      value={selectedUserForAdmin}
                      onChange={(e) => setSelectedUserForAdmin(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione um usuário</option>
                      {users
                        .filter((user) => !adminUsers.some((admin) => admin.id === user.id))
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={makeUserAdmin}
                      disabled={loadingAdmins || !selectedUserForAdmin}
                      className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors disabled:bg-blue-300"
                    >
                      {loadingAdmins ? "Processando..." : "Adicionar"}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-2">Administradores Atuais</h4>
                  {loadingAdmins ? (
                    <div className="text-center py-4">
                      <RefreshCw className="h-6 w-6 mx-auto animate-spin text-blue-600" />
                      <p className="mt-2 text-gray-500">Carregando administradores...</p>
                    </div>
                  ) : adminUsers.length === 0 ? (
                    <p className="text-gray-500 py-2">Nenhum administrador encontrado além de você.</p>
                  ) : (
                    <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                      {adminUsers.map((admin) => (
                        <li key={admin.id} className="flex justify-between items-center p-3 hover:bg-gray-50">
                          <div>
                            <p className="font-medium">{admin.name}</p>
                            <p className="text-sm text-gray-500">{admin.email}</p>
                          </div>
                          <button
                            onClick={() => removeAdmin(admin.id)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          >
                            Remover
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Outras Configurações</h3>
                <p className="text-gray-600">Outras configurações do sistema serão adicionadas aqui.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de edição de usuário */}
      {editingUserId && (
        <UserEditModal
          userId={editingUserId}
          onClose={() => setEditingUserId(null)}
          onSave={() => {
            setEditingUserId(null)
            fetchUsers()
          }}
        />
      )}
    </div>
  )
}

export default Admin
