"use client"

import type React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { Building, Users, Mail, Phone, CheckCircle, ArrowRight, Briefcase, Shield } from "lucide-react"

// Importe o cliente Supabase no topo do arquivo
import { supabase } from "../lib/supabase"

const Partnership: React.FC = () => {
  const [formData, setFormData] = useState({
    cnpj: "",
    name: "",
    email: "",
    phone: "",
    employees: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.cnpj) newErrors.cnpj = "CNPJ é obrigatório"
    else if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(formData.cnpj) && !/^\d{14}$/.test(formData.cnpj))
      newErrors.cnpj = "CNPJ inválido"

    if (!formData.name) newErrors.name = "Nome da instituição é obrigatório"

    if (!formData.email) newErrors.email = "E-mail é obrigatório"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "E-mail inválido"

    if (!formData.phone) newErrors.phone = "Telefone é obrigatório"

    if (!formData.employees) newErrors.employees = "Quantidade de colaboradores é obrigatória"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Adicione um estado para mensagens de erro gerais
  const [error, setError] = useState("")

  // Substitua a função handleSubmit existente pelo código abaixo:
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      setIsSubmitting(true)
      setError("")

      try {
        // Inserir dados no Supabase
        const { data, error } = await supabase.from("partnership_requests").insert([
          {
            cnpj: formData.cnpj,
            institution_name: formData.name,
            email: formData.email,
            phone: formData.phone,
            employees_range: formData.employees,
            status: "pending",
            created_at: new Date().toISOString(),
          },
        ])

        if (error) throw error

        // Sucesso
        setIsSubmitted(true)

        // Reset form
        setFormData({
          cnpj: "",
          name: "",
          email: "",
          phone: "",
          employees: "",
        })
      } catch (err: any) {
        console.error("Erro ao salvar dados:", err)
        setError(err.message || "Ocorreu um erro ao enviar sua solicitação. Por favor, tente novamente.")
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const formatCNPJ = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, "")

    // Apply CNPJ mask (XX.XXX.XXX/XXXX-XX)
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
    if (digits.length <= 12)
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`
  }

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    const formattedValue = formatCNPJ(value)
    setFormData((prev) => ({ ...prev, cnpj: formattedValue }))

    if (errors.cnpj) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.cnpj
        return newErrors
      })
    }
  }

  const formatPhone = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, "")

    // Apply phone mask
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    const formattedValue = formatPhone(value)
    setFormData((prev) => ({ ...prev, phone: formattedValue }))

    if (errors.phone) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.phone
        return newErrors
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">Seja um Parceiro</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tenha acesso a todos os benefícios da AEDUC por um preço exclusivo para sua instituição a partir de 200
            beneficiários!
          </p>
          {error && (
            <div className="max-w-3xl mx-auto mb-8">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            {isSubmitted ? (
              <div className="text-center py-8">
                <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Solicitação enviada com sucesso!</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Agradecemos seu interesse em se tornar um parceiro AEDUC. Nossa equipe entrará em contato em breve
                  para discutir os próximos passos.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="px-6 py-3 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
                >
                  Enviar nova solicitação
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-blue-900 mb-6">Solicite uma Proposta</h2>
                <p className="text-gray-600 mb-6">
                  Preencha o formulário abaixo e nossa equipe entrará em contato para apresentar uma proposta
                  personalizada para sua instituição.
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">
                        CNPJ da Instituição*
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="cnpj"
                          name="cnpj"
                          value={formData.cnpj}
                          onChange={handleCNPJChange}
                          className={`w-full pl-10 pr-4 py-2 border ${errors.cnpj ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500`}
                          placeholder="XX.XXX.XXX/XXXX-XX"
                        />
                      </div>
                      {errors.cnpj && <p className="mt-1 text-sm text-red-600">{errors.cnpj}</p>}
                    </div>

                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nome da Instituição*
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Briefcase className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-2 border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500`}
                          placeholder="Nome da sua instituição"
                        />
                      </div>
                      {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        E-mail para Contato*
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-2 border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500`}
                          placeholder="contato@instituicao.com.br"
                        />
                      </div>
                      {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone para Contato*
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          className={`w-full pl-10 pr-4 py-2 border ${errors.phone ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500`}
                          placeholder="(XX) XXXXX-XXXX"
                        />
                      </div>
                      {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                    </div>

                    <div>
                      <label htmlFor="employees" className="block text-sm font-medium text-gray-700 mb-1">
                        Quantidade de Colaboradores*
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Users className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          id="employees"
                          name="employees"
                          value={formData.employees}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-2 border ${errors.employees ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white`}
                        >
                          <option value="">Selecione uma opção</option>
                          <option value="200-300">200-300 colaboradores</option>
                          <option value="301-500">301-500 colaboradores</option>
                          <option value="501-1000">501-1000 colaboradores</option>
                          <option value="1001+">Mais de 1000 colaboradores</option>
                        </select>
                      </div>
                      {errors.employees && <p className="mt-1 text-sm text-red-600">{errors.employees}</p>}
                    </div>
                  </div>

                  <div className="mt-8">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-900 text-white py-3 px-4 rounded-md hover:bg-blue-800 transition-colors flex items-center justify-center disabled:bg-blue-400"
                    >
                      {isSubmitting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Enviando...
                        </>
                      ) : (
                        <>
                          Solicitar Proposta <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Benefits Section */}
          <div>
            <div className="bg-blue-900 text-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">Benefícios para Parceiros</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-blue-800 p-2 rounded-full mr-3 mt-1">
                    <CheckCircle className="h-5 w-5 text-blue-200" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Preços Especiais</h3>
                    <p className="text-blue-100">Valores diferenciados para grupos de colaboradores.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-blue-800 p-2 rounded-full mr-3 mt-1">
                    <CheckCircle className="h-5 w-5 text-blue-200" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Gestão Simplificada</h3>
                    <p className="text-blue-100">Portal exclusivo para gerenciar benefícios dos colaboradores.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-blue-800 p-2 rounded-full mr-3 mt-1">
                    <CheckCircle className="h-5 w-5 text-blue-200" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Atendimento Dedicado</h3>
                    <p className="text-blue-100">Equipe exclusiva para atender às necessidades da sua instituição.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-blue-800 p-2 rounded-full mr-3 mt-1">
                    <CheckCircle className="h-5 w-5 text-blue-200" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Eventos Exclusivos</h3>
                    <p className="text-blue-100">
                      Acesso a eventos e workshops exclusivos para instituições parceiras.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Depoimentos de Parceiros</h2>
              <div className="space-y-6">
                <div className="border-l-4 border-blue-900 pl-4 py-2">
                  <p className="italic text-gray-700 mb-2">
                    "A parceria com a AEDUC trouxe benefícios significativos para nossos professores e colaboradores,
                    aumentando a satisfação e retenção de talentos."
                  </p>
                  <p className="font-semibold text-blue-900">Maria Silva</p>
                  <p className="text-sm text-gray-600">Diretora de RH - Colégio Exemplo</p>
                </div>

                <div className="border-l-4 border-blue-900 pl-4 py-2">
                  <p className="italic text-gray-700 mb-2">
                    "O atendimento personalizado e os preços diferenciados fizeram toda a diferença para nossa
                    instituição. Recomendo fortemente a parceria."
                  </p>
                  <p className="font-semibold text-blue-900">João Santos</p>
                  <p className="text-sm text-gray-600">Reitor - Universidade Inovação</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">Perguntas Frequentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Qual o investimento necessário?</h3>
              <p className="text-gray-700">
                O investimento varia de acordo com o número de colaboradores e os benefícios escolhidos. Após o
                preenchimento do formulário, nossa equipe entrará em contato com uma proposta personalizada.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Quais instituições podem se tornar parceiras?
              </h3>
              <p className="text-gray-700">
                Escolas, faculdades, universidades e outras instituições educacionais podem se tornar parceiras da
                AEDUC.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Como funciona o processo de adesão?</h3>
              <p className="text-gray-700">
                Após o envio do formulário, nossa equipe entrará em contato para entender melhor as necessidades da sua
                instituição e apresentar uma proposta. Após a aprovação, o contrato é assinado e os benefícios são
                disponibilizados.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Qual o prazo para implementação?</h3>
              <p className="text-gray-700">
                Após a assinatura do contrato, os benefícios são disponibilizados em até 15 dias úteis.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-xl shadow-lg p-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-12 w-12 mr-4" />
            <h2 className="text-2xl font-bold">Fortaleça sua instituição com a AEDUC</h2>
          </div>
          <p className="text-lg mb-6 max-w-3xl mx-auto">
            Ofereça benefícios exclusivos para seus colaboradores e fortaleça sua instituição. Torne-se um parceiro
            AEDUC hoje mesmo.
          </p>
          <Link
            to="#form"
            className="px-8 py-3 bg-white text-blue-900 hover:bg-blue-100 rounded-md font-medium text-lg inline-block transition-colors"
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }}
          >
            Solicitar Proposta
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Partnership

