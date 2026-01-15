"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Save, RefreshCw } from "lucide-react"
import { supabase } from "../../lib/supabase"

interface UserEditModalProps {
  userId: string
  onClose: () => void
  onSave: () => void
}

interface UserData {
  id: string
  name: string
  email: string
  cpf: string
  phone: string
  birth_date: string
  profession: string
  payment_complete: boolean
  role?: string
}

const UserEditModal: React.FC<UserEditModalProps> = ({ userId, onClose, onSave }) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [userData, setUserData] = useState<UserData | null>(null)
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    fetchUserData()
  }, [userId])

  // Função para formatar CPF (000.000.000-00)
  const formatCPF = (value: string): string => {
    if (!value) return ""
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
  }

  // Função para formatar Telefone ((00) 00000-0000 ou (00) 0000-0000)
  const formatPhone = (value: string): string => {
    if (!value) return ""
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
  }

  const [previousPaymentStatus, setPreviousPaymentStatus] = useState<boolean>(false)

  const fetchUserData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) throw error
      
      // Guardar o status anterior para detectar ativação
      setPreviousPaymentStatus(data.payment_complete || false)
      
      // Garantir que os valores nunca sejam null e formatar CPF e telefone
      setUserData({
        ...data,
        name: data.name || "",
        cpf: formatCPF(data.cpf || ""),
        phone: formatPhone(data.phone || ""),
        birth_date: data.birth_date || "",
        profession: data.profession || "",
        email: data.email || "",
      })

    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error)
      setError("Erro ao carregar dados do usuário")
    } finally {
      setLoading(false)
    }
  }


  // Função para remover formatação (apenas números)
  const removeFormatting = (value: string): string => {
    return value.replace(/\D/g, "")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (!userData) return

    // Aplicar formatação apenas para CPF e Telefone
    if (name === "cpf") {
      const formatted = formatCPF(value)
      setUserData({
        ...userData,
        [name]: formatted,
      })
    } else if (name === "phone") {
      const formatted = formatPhone(value)
      setUserData({
        ...userData,
        [name]: formatted,
      })
    } else {
      setUserData({
        ...userData,
        [name]: value,
      })
    }
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    if (!userData) return

    setUserData({
      ...userData,
      [name]: checked,
    })
  }

  // Substitua o método handleSubmit para remover referências a activation_date
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData) return

    setSaving(true)
    setError("")
    setSuccessMessage("")

    try {
      // Remover formatação do CPF e Telefone antes de salvar
      const cpfClean = removeFormatting(userData.cpf)
      const phoneClean = removeFormatting(userData.phone)

      // Validar CPF (deve ter 11 dígitos)
      if (cpfClean.length !== 11) {
        throw new Error("CPF deve conter 11 dígitos")
      }

      // Verificar se o CPF já existe em outro usuário
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("id, cpf")
        .eq("cpf", cpfClean)
        .neq("id", userId)
        .maybeSingle()

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 é "not found", que é esperado quando não há duplicata
        throw checkError
      }

      if (existingUser) {
        throw new Error("Este CPF já está cadastrado para outro usuário")
      }

      // Detectar se estamos ativando o usuário (mudou de false para true)
      const isActivating = !previousPaymentStatus && userData.payment_complete

      // Atualizar o perfil do usuário (sem activation_date)
      // Salvar CPF e Telefone sem formatação
      const { error } = await supabase
        .from("profiles")
        .update({
          name: userData.name,
          cpf: cpfClean,
          phone: phoneClean,
          birth_date: userData.birth_date || null,
          profession: userData.profession,
          payment_complete: userData.payment_complete,
          // Removemos a referência a activation_date
        })
        .eq("id", userId)

      if (error) throw error

      // Se estamos ativando o usuário, criar registro de onboarding e carteirinha se não existir
      if (isActivating) {
        // Verificar se já existe um registro de onboarding
        try {
          const { data: existingOnboarding, error: checkError } = await supabase
            .from("onboarding")
            .select("id")
            .eq("user_id", userId)

          // Se houver erro que não seja relacionado a "tabela não existe", ignorar
          if (checkError && checkError.code !== "42P01") {
            console.warn("Aviso ao verificar onboarding:", checkError)
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

            if (onboardingError && onboardingError.code !== "42P01") {
              console.warn("Aviso ao criar registro de onboarding:", onboardingError)
            }
          }
        } catch (err) {
          console.warn("Aviso: não foi possível criar registro de onboarding:", err)
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
      }

      setSuccessMessage("Usuário atualizado com sucesso!")
      setTimeout(() => {
        onSave()
      }, 1500)
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      setError("Erro ao salvar alterações: " + (error.message || "Erro desconhecido"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 mx-auto text-blue-600 animate-spin" />
            <p className="mt-2 text-gray-600">Carregando dados do usuário...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="text-center py-8">
            <p className="text-red-600">Erro ao carregar dados do usuário</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800">
              Fechar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-900">Editar Usuário</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">{error}</div>}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={userData.name || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={userData.email}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado.</p>
            </div>

            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">
                CPF
              </label>
              <input
                type="text"
                id="cpf"
                name="cpf"
                value={userData.cpf || ""}
                onChange={handleInputChange}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Formato: 000.000.000-00</p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={userData.phone || ""}
                onChange={handleInputChange}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Formato: (00) 00000-0000 ou (00) 0000-0000</p>
            </div>

            <div>
              <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                id="birth_date"
                name="birth_date"
                value={userData.birth_date || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-1">
                Profissão
              </label>
              <select
                id="profession"
                name="profession"
                value={userData.profession || ""}
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

            <div className="flex items-center">
              <input
                type="checkbox"
                id="payment_complete"
                name="payment_complete"
                checked={userData.payment_complete}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="payment_complete" className="ml-2 block text-sm text-gray-700">
                Usuário ativo
              </label>
            </div>

            {!userData.payment_complete && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-700">
                <p>
                  <strong>Nota:</strong> Ao ativar este usuário, ele terá acesso imediato ao dashboard sem precisar
                  completar o processo de onboarding.
                </p>
              </div>
            )}

          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-50"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 flex items-center"
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserEditModal
