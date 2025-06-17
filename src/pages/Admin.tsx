"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { supabase } from "../lib/supabase"
import { generateShortId } from "../lib/idGenerator"
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
} from "lucide-react"

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
  const [activeTab, setActiveTab] = useState("users")
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
      const { data, error } = await supabase.from("profiles").select("*").order("name")

      if (error) throw error
      setUsers(data || [])
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

      // Se estiver ativando o usuário, verificar e criar registro de onboarding se necessário
      if (!currentStatus) {
        // Verificar se já existe um registro de onboarding
        const { data: existingOnboarding, error: checkError } = await supabase
          .from("onboarding")
          .select("id")
          .eq("user_id", userId)

        // Se houver erro que não seja "não encontrado", lançar erro
        if (checkError) {
          console.error("Erro ao verificar onboarding:", checkError)
          throw checkError
        }

        // Se não existir registro ou a lista estiver vazia, criar um novo
        if (!existingOnboarding || existingOnboarding.length === 0) {
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

          if (onboardingError) {
            console.error("Erro ao criar registro de onboarding:", onboardingError)
            throw onboardingError
          }
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

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${userName}? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      // 1. Excluir registros de onboarding
      const { error: onboardingError } = await supabase.from("onboarding").delete().eq("user_id", userId)

      if (onboardingError) throw onboardingError

      // 2. Excluir perfil
      const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId)

      if (profileError) throw profileError

      // 3. Excluir usuário da autenticação
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)

      if (authError) throw authError

      // Atualizar lista de usuários
      fetchUsers()
    } catch (error: any) {
      console.error("Erro ao excluir usuário:", error)
      alert(`Erro ao excluir usuário: ${error.message}`)
    }
  }

  const exportUsersToCsv = () => {
    // Criar cabeçalho CSV
    const headers = ["ID", "Nome", "Email", "CPF", "Telefone", "Profissão", "Status", "Data de Registro"]

    // Converter dados dos usuários para linhas CSV
    const userRows = users.map((user) => [
      user.display_id,
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
      user.display_id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Adicionar useEffect para carregar administradores quando a aba "settings" estiver ativa
  useEffect(() => {
    if (activeTab === "settings" && isAdmin) {
      fetchAdminUsers()
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
            activeTab === "users"
              ? "Gerenciamento de Usuários"
              : activeTab === "stats"
                ? "Estatísticas"
                : activeTab === "cards"
                  ? "Gerenciamento de Carteirinhas"
                  : "Configurações"
          }
        />

        <main className="flex-1 p-6">
          {activeTab === "users" && (
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
                              {user.display_id}
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
