"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { Navigate, useNavigate } from "react-router-dom"
import MemberCard from "../components/MemberCard"
import {
  CreditCard,
  FileText,
  Phone,
  Award,
  User,
  ChevronRight,
  Zap,
  Clock,
  AlertTriangle,
  ExternalLink,
  Download,
  Mail,
  MapPin,
  Home,
} from "lucide-react"
import { updateUser } from "../services/user"
import type { User as UserType } from "../types"
import { supabase } from "../lib/supabase"
import CardSilhouette from "../components/CardSilhouette"

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState("profile")
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState<UserType | null>(null)
  const [updateError, setUpdateError] = useState("")
  const [updateSuccess, setUpdateSuccess] = useState("")
  const [cardDeliveryDate, setCardDeliveryDate] = useState<string | null>(null)
  const [cardStatus, setCardStatus] = useState<string | null>(null)

  // Estados para a aba de documentos
  const [documents, setDocuments] = useState<{
    idDocumentUrl: string
    addressDocumentUrl: string
    signatureUrl: string
  }>({
    idDocumentUrl: "",
    addressDocumentUrl: "",
    signatureUrl: "",
  })
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [documentError, setDocumentError] = useState("")

  useEffect(() => {
    // Se o usuário está autenticado mas não completou o onboarding, redirecionar
    if (isAuthenticated && user && !user.paymentComplete) {
      navigate("/onboarding")
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    if (user) {
      setEditedUser({ ...user })
      // Buscar informações da carteirinha
      fetchCardInfo()
    }
  }, [user])

  const fetchCardInfo = async () => {
    if (!user?.uuid) return

    try {
      // Buscar informações da carteirinha do usuário
      const { data, error } = await supabase
        .from("member_cards")
        .select("delivery_date, status")
        .eq("user_id", user.uuid)
        .single()

      if (error) {
        // Se não encontrar registro, verificar as configurações globais
        if (error.code === "PGRST116") {
          const { data: settingsData, error: settingsError } = await supabase
            .from("card_settings")
            .select("default_delivery_days")
            .single()

          if (!settingsError && settingsData) {
            // Calcular data de entrega baseada na data de ativação + dias padrão
            const activationDate = new Date(user.registrationDate)
            activationDate.setDate(activationDate.getDate() + (settingsData.default_delivery_days || 7))
            setCardDeliveryDate(activationDate.toISOString())
            setCardStatus("pending")
          }
        }
        return
      }

      if (data) {
        setCardDeliveryDate(data.delivery_date)
        setCardStatus(data.status)
      }
    } catch (err) {
      console.error("Erro ao buscar informações da carteirinha:", err)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (!editedUser) return

    setEditedUser({
      ...editedUser,
      [name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editedUser) return

    setUpdateError("")
    setUpdateSuccess("")

    try {
      await updateUser(editedUser)
      setUpdateSuccess("Informações atualizadas com sucesso!")
      setIsEditing(false)

      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setUpdateSuccess("")
      }, 3000)
    } catch (error: any) {
      console.error("Erro ao atualizar informações:", error)
      setUpdateError(error.message || "Erro ao atualizar informações. Tente novamente.")
    }
  }

  // Função para buscar documentos do usuário
  const fetchUserDocuments = async () => {
    if (!user?.uuid) return

    setLoadingDocuments(true)
    setDocumentError("")

    try {
      const { data, error } = await supabase
        .from("onboarding")
        .select("id_document_url, address_document_url, signature_url")
        .eq("user_id", user.uuid)
        .single()

      if (error) throw error

      if (data) {
        setDocuments({
          idDocumentUrl: data.id_document_url,
          addressDocumentUrl: data.address_document_url,
          signatureUrl: data.signature_url,
        })
      }
    } catch (err: any) {
      console.error("Erro ao buscar documentos:", err)
      setDocumentError("Não foi possível carregar seus documentos. Tente novamente mais tarde.")
    } finally {
      setLoadingDocuments(false)
    }
  }

  // Carregar documentos quando a aba for selecionada
  useEffect(() => {
    if (activeTab === "documents" && user?.paymentComplete) {
      fetchUserDocuments()
    }
  }, [activeTab, user])

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with welcome message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Olá, {user.name.split(" ")[0]}!</h1>
          <p className="text-gray-600">Bem-vindo à sua área do associado</p>
        </div>

        {/* Status card for non-paying members */}
        {!user.paymentComplete && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="flex items-center mb-3 sm:mb-0">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">Cadastro incompleto</p>
                <p className="text-sm text-amber-700">Complete seu cadastro para acessar todos os benefícios</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/onboarding")}
              className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors text-sm w-full sm:w-auto"
            >
              Continuar cadastro
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-4">
              <div className="p-4 bg-blue-900 text-white">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-800 p-2 rounded-full">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Área do Associado</p>
                    <p className="text-xs text-blue-200">ID: AE-{user.id}</p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between ${
                      activeTab === "profile"
                        ? "bg-blue-50 text-blue-900 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-3" />
                      <span>Carteirinha</span>
                    </div>
                    {activeTab === "profile" && <ChevronRight className="h-4 w-4" />}
                  </button>

                  <button
                    onClick={() => setActiveTab("benefits")}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between ${
                      activeTab === "benefits"
                        ? "bg-blue-50 text-blue-900 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    disabled={!user.paymentComplete}
                  >
                    <div className="flex items-center">
                      <Award className="h-5 w-5 mr-3" />
                      <span>Benefícios</span>
                    </div>
                    {activeTab === "benefits" && <ChevronRight className="h-4 w-4" />}
                  </button>

                  <button
                    onClick={() => setActiveTab("documents")}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between ${
                      activeTab === "documents"
                        ? "bg-blue-50 text-blue-900 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    disabled={!user.paymentComplete}
                  >
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-3" />
                      <span>Documentos</span>
                    </div>
                    {activeTab === "documents" && <ChevronRight className="h-4 w-4" />}
                  </button>

                  <button
                    onClick={() => setActiveTab("contact")}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between ${
                      activeTab === "contact"
                        ? "bg-blue-50 text-blue-900 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-3" />
                      <span>Contato</span>
                    </div>
                    {activeTab === "contact" && <ChevronRight className="h-4 w-4" />}
                  </button>
                </nav>
              </div>

              {/* Quick stats */}
              <div className="border-t border-gray-100 p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Status da Associação</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Associado desde</span>
                    </div>
                    <span className="text-sm font-medium">
                      {new Date(user.registrationDate).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Zap className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Status</span>
                    </div>
                    <span
                      className={`text-sm font-medium ${user.paymentComplete ? "text-green-600" : "text-amber-600"}`}
                    >
                      {user.paymentComplete ? "Ativo" : "Pendente"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-blue-900 mb-6">Carteirinha do Associado</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <MemberCard user={user} />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Status da Associação</h3>

                      {user.paymentComplete ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                          <div className="flex items-start">
                            <div className="bg-green-100 p-2 rounded-full mr-3 mt-1">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-green-600"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-green-800">Associação Ativa</p>
                              <p className="text-sm text-green-700">Você tem acesso a todos os benefícios da AEDUC.</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                          <div className="flex items-start">
                            <div className="bg-amber-100 p-2 rounded-full mr-3 mt-1">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-amber-600"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-amber-800">Cadastro Incompleto</p>
                              <p className="text-sm text-amber-700">
                                Complete seu cadastro para ativar sua associação.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {!user.paymentComplete && (
                        <div>
                          <button
                            onClick={() => navigate("/onboarding")}
                            className="w-full bg-blue-900 text-white py-2 px-4 rounded-md hover:bg-blue-800 transition-colors"
                          >
                            Continuar Cadastro
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  {updateSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
                      {updateSuccess}
                    </div>
                  )}
                  {updateError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                      {updateError}
                    </div>
                  )}
                  {isEditing && editedUser ? (
                    <form onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <label htmlFor="name" className="block text-sm text-gray-500 mb-1">
                            Nome Completo
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={editedUser.name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="cpf" className="block text-sm text-gray-500 mb-1">
                            CPF
                          </label>
                          <input
                            type="text"
                            id="cpf"
                            name="cpf"
                            value={editedUser.cpf}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-sm text-gray-500 mb-1">
                            E-mail
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={editedUser.email}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="phone" className="block text-sm text-gray-500 mb-1">
                            Telefone
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={editedUser.phone}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="birthDate" className="block text-sm text-gray-500 mb-1">
                            Data de Nascimento
                          </label>
                          <input
                            type="date"
                            id="birthDate"
                            name="birthDate"
                            value={editedUser.birthDate.split("T")[0]}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="profession" className="block text-sm text-gray-500 mb-1">
                            Profissão
                          </label>
                          <select
                            id="profession"
                            name="profession"
                            value={editedUser.profession}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="Professor">Professor</option>
                            <option value="Diretor">Diretor</option>
                            <option value="Reitor">Reitor</option>
                            <option value="Estudante Universitário">Estudante Universitário</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false)
                            setEditedUser(user) // Reset to original values
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
                        >
                          Salvar Alterações
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Nome Completo</p>
                        <p className="font-medium">{user?.name}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-1">CPF</p>
                        <p className="font-medium">{user?.cpf}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-1">E-mail</p>
                        <p className="font-medium">{user?.email}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-1">Telefone</p>
                        <p className="font-medium">{user?.phone}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-1">Data de Nascimento</p>
                        <p className="font-medium">{new Date(user?.birthDate || "").toLocaleDateString("pt-BR")}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-1">Profissão</p>
                        <p className="font-medium">{user?.profession}</p>
                      </div>
                    </div>
                  )}
                  {!isEditing && (
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
                      >
                        Editar Informações
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Benefits Tab */}
            {activeTab === "benefits" && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-blue-900 mb-6">Benefícios do Associado</h2>

                  {!user.paymentComplete ? (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6">
                      <div className="flex">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <div>
                          <p className="font-medium">Acesso Limitado</p>
                          <p className="text-sm">Complete seu cadastro para ter acesso a todos os benefícios.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 mb-8">
                      {/* Carteirinha em produção */}
                      {cardDeliveryDate && cardStatus === "pending" && (
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Carteirinha Física</h3>
                          <CardSilhouette deliveryDate={cardDeliveryDate} userName={user.name} />
                        </div>
                      )}

                      <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center mb-4">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <Award className="h-5 w-5 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800">Cartão de Benefícios</h3>
                        </div>
                        <ul className="space-y-2 mb-4">
                          <li className="flex items-start">
                            <div className="min-w-[20px] text-green-500 mr-2">✓</div>
                            <span>Plano odontológico</span>
                          </li>
                          <li className="flex items-start">
                            <div className="min-w-[20px] text-green-500 mr-2">✓</div>
                            <span>Seguro de vida (R$ 10.000,00)</span>
                          </li>
                          <li className="flex items-start">
                            <div className="min-w-[20px] text-green-500 mr-2">✓</div>
                            <span>Invalidez Permanente (R$ 10.000,00)</span>
                          </li>
                          <li className="flex items-start">
                            <div className="min-w-[20px] text-green-500 mr-2">✓</div>
                            <span>Acidentes Pessoais (R$ 10.000,00)</span>
                          </li>
                          <li className="flex items-start">
                            <div className="min-w-[20px] text-green-500 mr-2">✓</div>
                            <span>Assistência Funeral (R$ 7.000,00)</span>
                          </li>
                          <li className="flex items-start">
                            <div className="min-w-[20px] text-green-500 mr-2">✓</div>
                            <span>Telemedicina</span>
                          </li>
                          <li className="flex items-start">
                            <div className="min-w-[20px] text-green-500 mr-2">✓</div>
                            <span>Assistência Jurídica</span>
                          </li>
                          <li className="flex items-start">
                            <div className="min-w-[20px] text-green-500 mr-2">✓</div>
                            <span>Desconto em lojas Parceiras</span>
                          </li>
                        </ul>
                        <a href="/benefits" className="text-blue-700 hover:underline text-sm flex items-center">
                          Ver detalhes <span className="ml-1">→</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-blue-900 mb-6">Meus Documentos</h2>

                  {!user.paymentComplete ? (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6">
                      <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Acesso Limitado</p>
                          <p className="text-sm">Complete seu cadastro para visualizar seus documentos.</p>
                        </div>
                      </div>
                    </div>
                  ) : documentError ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                      {documentError}
                    </div>
                  ) : loadingDocuments ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="border border-gray-200 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Documento de Identificação</h3>
                          </div>
                          <div className="flex space-x-2">
                            <a
                              href={documents.idDocumentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-700 hover:bg-blue-50 rounded-full"
                              title="Visualizar"
                            >
                              <ExternalLink className="h-5 w-5" />
                            </a>
                            <a
                              href={documents.idDocumentUrl}
                              download
                              className="p-2 text-blue-700 hover:bg-blue-50 rounded-full"
                              title="Baixar"
                            >
                              <Download className="h-5 w-5" />
                            </a>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          Documento de identificação enviado durante seu cadastro.
                        </p>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                              <Home className="h-5 w-5 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Comprovante de Residência</h3>
                          </div>
                          <div className="flex space-x-2">
                            <a
                              href={documents.addressDocumentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-700 hover:bg-blue-50 rounded-full"
                              title="Visualizar"
                            >
                              <ExternalLink className="h-5 w-5" />
                            </a>
                            <a
                              href={documents.addressDocumentUrl}
                              download
                              className="p-2 text-blue-700 hover:bg-blue-50 rounded-full"
                              title="Baixar"
                            >
                              <Download className="h-5 w-5" />
                            </a>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">Comprovante de residência enviado durante seu cadastro.</p>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Ficha de Adesão Assinada</h3>
                          </div>
                          <div className="flex space-x-2">
                            <a
                              href={documents.signatureUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-700 hover:bg-blue-50 rounded-full"
                              title="Visualizar"
                            >
                              <ExternalLink className="h-5 w-5" />
                            </a>
                            <a
                              href={documents.signatureUrl}
                              download
                              className="p-2 text-blue-700 hover:bg-blue-50 rounded-full"
                              title="Baixar"
                            >
                              <Download className="h-5 w-5" />
                            </a>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">Ficha de adesão com sua assinatura digital.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === "contact" && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-blue-900 mb-6">Fale Conosco</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-center mb-4">
                        <div className="bg-green-100 p-2 rounded-full mr-3">
                          <Phone className="h-5 w-5 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">WhatsApp</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Entre em contato diretamente pelo WhatsApp para um atendimento mais rápido.
                      </p>
                      <a
                        href="https://wa.me/551126267663"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-5 h-5 mr-2"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                          <path
                            d="M12 0C5.373 0 0 5.373 0 12c0 1.86.42 3.632 1.17 5.213L.058 22.57c-.11.31.11.61.401.701.052.01.105.02.158.02.247 0 .481-.13.61-.35l3.96-5.07C7.157 19.866 9.5 21 12 21c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 19c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"
                            fillRule="nonzero"
                          />
                        </svg>
                        Falar no WhatsApp
                      </a>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-center mb-4">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">E-mail</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">Envie um e-mail para nossa equipe de atendimento.</p>
                      <a
                        href="mailto:contato@aeducbrasil.com.br"
                        className="inline-flex items-center px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
                      >
                        <Mail className="h-5 w-5 mr-2" />
                        Enviar E-mail
                      </a>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-5 mb-6">
                    <div className="flex items-start mb-4">
                      <div className="bg-blue-100 p-2 rounded-full mr-3 mt-1">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Endereço</h3>
                        <p className="text-gray-600">Rua Roberto Simonsen, 72</p>
                        <p className="text-gray-600">Sé, São Paulo - SP</p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Horário de Atendimento</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-600">Segunda a Sexta</span>
                        <span className="font-medium">9h às 18h</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-600">Sábado</span>
                        <span className="font-medium">9h às 13h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Domingo e Feriados</span>
                        <span className="font-medium">Fechado</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

