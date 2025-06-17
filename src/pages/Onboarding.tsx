"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { supabase } from "../lib/supabase"
import { Upload, FileText, CreditCard, CheckCircle, ArrowRight } from "lucide-react"
import DocumentUpload from "../components/onboarding/DocumentUpload"
import PaymentStep from "../components/onboarding/PaymentStep"
import SignatureStep from "../components/onboarding/SignatureStep"
import OnboardingProgress from "../components/onboarding/OnboardingProgress"

const steps = [
  { id: "documents", title: "Documentos", icon: <Upload className="h-5 w-5" /> },
  { id: "payment", title: "Pagamento", icon: <CreditCard className="h-5 w-5" /> },
  { id: "signature", title: "Assinatura", icon: <FileText className="h-5 w-5" /> },
  { id: "complete", title: "Concluído", icon: <CheckCircle className="h-5 w-5" /> },
]

const Onboarding = () => {
  const { user, isAuthenticated, updateUser } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState("documents")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [onboardingData, setOnboardingData] = useState({
    idDocumentUrl: "",
    addressDocumentUrl: "",
    paymentId: "",
    signatureUrl: "",
  })

  useEffect(() => {
    // Verificar se o usuário está autenticado
    if (!isAuthenticated) {
      navigate("/login")
      return
    }

    // Verificar se o usuário já completou o onboarding
    if (user?.paymentComplete) {
      navigate("/dashboard")
      return
    }

    // Carregar dados de onboarding existentes, se houver
    const fetchOnboardingData = async () => {
      try {
        const { data, error } = await supabase.from("onboarding").select("*").eq("user_id", user?.uuid).single()

        if (error) {
          console.error("Erro ao buscar dados de onboarding:", error)
          return
        }

        if (data) {
          // Determinar em qual etapa o usuário parou
          let nextStep = "documents"

          if (data.id_document_url && data.address_document_url) {
            nextStep = "payment"
          }

          if (data.payment_id) {
            nextStep = "signature"
          }

          if (data.signature_url) {
            nextStep = "complete"
          }

          setCurrentStep(nextStep)
          setOnboardingData({
            idDocumentUrl: data.id_document_url || "",
            addressDocumentUrl: data.address_document_url || "",
            paymentId: data.payment_id || "",
            signatureUrl: data.signature_url || "",
          })
        }
      } catch (err) {
        console.error("Erro ao buscar dados de onboarding:", err)
      }
    }

    fetchOnboardingData()
  }, [isAuthenticated, user, navigate])

  const handleDocumentsSubmit = async (idDocUrl: string, addressDocUrl: string) => {
    setLoading(true)
    setError("")

    try {
      // Salvar URLs dos documentos no Supabase
      const { error } = await supabase.from("onboarding").upsert(
        {
          user_id: user?.uuid,
          id_document_url: idDocUrl,
          address_document_url: addressDocUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )

      if (error) throw error

      // Atualizar estado local
      setOnboardingData((prev) => ({
        ...prev,
        idDocumentUrl: idDocUrl,
        addressDocumentUrl: addressDocUrl,
      }))

      // Avançar para a próxima etapa
      setCurrentStep("payment")
    } catch (err: any) {
      console.error("Erro ao salvar documentos:", err)
      setError(err.message || "Erro ao salvar documentos. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentComplete = async (paymentId: string) => {
    setLoading(true)
    setError("")

    try {
      // Salvar ID do pagamento no Supabase
      const { error } = await supabase
        .from("onboarding")
        .update({
          payment_id: paymentId,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user?.uuid)

      if (error) throw error

      // Atualizar estado local
      setOnboardingData((prev) => ({
        ...prev,
        paymentId,
      }))

      // Avançar para a próxima etapa
      setCurrentStep("signature")
    } catch (err: any) {
      console.error("Erro ao processar pagamento:", err)
      setError(err.message || "Erro ao processar pagamento. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignatureComplete = async (signatureUrl: string) => {
    setLoading(true)
    setError("")

    try {
      // Salvar URL da assinatura no Supabase
      const { error: onboardingError } = await supabase
        .from("onboarding")
        .update({
          signature_url: signatureUrl,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user?.uuid)

      if (onboardingError) throw onboardingError

      // Atualizar perfil do usuário para ativo
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          payment_complete: true,
          activation_date: new Date().toISOString(),
        })
        .eq("id", user?.uuid)

      if (profileError) throw profileError

      // Atualizar estado local
      setOnboardingData((prev) => ({
        ...prev,
        signatureUrl,
      }))

      // Atualizar contexto de autenticação
      if (user) {
        await updateUser({
          ...user,
          paymentComplete: true,
        })
      }

      // Avançar para a etapa final
      setCurrentStep("complete")
    } catch (err: any) {
      console.error("Erro ao salvar assinatura:", err)
      setError(err.message || "Erro ao salvar assinatura. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const goToDashboard = () => {
    navigate("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-blue-900 mb-2">Complete seu cadastro</h1>
            <p className="text-gray-600">
              Siga as etapas abaixo para ativar sua conta e acessar todos os benefícios da AEDUC.
            </p>
          </div>

          {/* Barra de progresso */}
          <OnboardingProgress steps={steps} currentStep={currentStep} />

          {/* Mensagem de erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">{error}</div>
          )}

          {/* Etapa de documentos */}
          {currentStep === "documents" && (
            <DocumentUpload
              onSubmit={handleDocumentsSubmit}
              loading={loading}
              initialIdDocUrl={onboardingData.idDocumentUrl}
              initialAddressDocUrl={onboardingData.addressDocumentUrl}
            />
          )}

          {/* Etapa de pagamento */}
          {currentStep === "payment" && (
            <PaymentStep onComplete={handlePaymentComplete} loading={loading} userId={user?.uuid || ""} />
          )}

          {/* Etapa de assinatura */}
          {currentStep === "signature" && (
            <SignatureStep onComplete={handleSignatureComplete} loading={loading} userName={user?.name || ""} />
          )}

          {/* Etapa de conclusão */}
          {currentStep === "complete" && (
            <div className="text-center py-8">
              <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Cadastro concluído com sucesso!</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Parabéns! Você agora é um associado AEDUC e pode acessar todos os benefícios exclusivos.
              </p>
              <button
                onClick={goToDashboard}
                className="px-6 py-3 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors flex items-center mx-auto"
              >
                Ir para o Dashboard <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Onboarding

