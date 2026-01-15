"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { FileText, ArrowRight } from "lucide-react"
import SignatureCanvas from "react-signature-canvas"
import { useAuth } from "../../context/AuthContext"

interface SignatureStepProps {
  onComplete: (signatureUrl: string) => Promise<void>
  loading: boolean
  userName: string
}

const SignatureStep: React.FC<SignatureStepProps> = ({ onComplete, loading, userName }) => {
  const { user } = useAuth()
  const [error, setError] = useState("")
  const [signatureUrl, setSignatureUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const signatureRef = useRef<SignatureCanvas | null>(null)

  // Buscar dados completos do perfil do usuário
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uuid) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.uuid)
            .single()

          if (!error && data) {
            setUserProfile(data)
          }
        } catch (err) {
          console.warn("Erro ao buscar perfil do usuário:", err)
        }
      }
    }

    fetchUserProfile()
  }, [user])

  // Gerar texto da proposta de adesão
  const membershipProposal = `
PROPOSTA DE ADESÃO À ASSOCIAÇÃO AEDUC

Eu, ${userName}, solicito minha adesão como associado à Associação de Reitores, Diretores e Professores de Instituições Educacionais (AEDUC), declarando conhecer e aceitar o Estatuto Social e o Regimento Interno da entidade.

Comprometo-me a:
1. Cumprir as disposições estatutárias e regimentais da AEDUC;
2. Acatar as decisões da Diretoria e das Assembleias;
3. Manter em dia minhas contribuições associativas;
4. Zelar pelo bom nome da Associação.

Estou ciente de que:
- A taxa associativa é de R$ 39,90 mensais;
- Os benefícios são válidos enquanto eu mantiver minha condição de associado ativo;
- Posso solicitar meu desligamento a qualquer momento, mediante comunicação por escrito.

Data: ${new Date().toLocaleDateString("pt-BR")}
  `

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear()
      setHasSignature(false)
    }
  }

  const checkSignature = () => {
    if (signatureRef.current) {
      setHasSignature(!signatureRef.current.isEmpty())
    }
  }

  const saveSignature = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setError("Por favor, assine o documento antes de continuar")
      return
    }

    setIsUploading(true)
    setError("")

    try {
      // Converter assinatura para imagem base64
      const signatureDataUrl = signatureRef.current.toDataURL("image/png")

      // Importar função para gerar PDF
      const { generateMembershipFormPDF } = await import("../../lib/generateMembershipFormPDF")

      // Formatar telefone para exibição
      const formatPhoneForDisplay = (phone: string) => {
        if (!phone) return ""
        const digits = phone.replace(/\D/g, "")
        if (digits.length === 10) {
          return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
        } else if (digits.length === 11) {
          return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
        }
        return phone
      }

      // Gerar ficha associativa completa em PDF (texto + assinatura)
      const pdfBlob = await generateMembershipFormPDF({
        userName: userProfile?.name || userName,
        signatureDataUrl,
        date: new Date().toLocaleDateString("pt-BR"),
        cpf: userProfile?.cpf || user?.cpf || "",
        email: userProfile?.email || user?.email || "",
        phone: userProfile?.phone || user?.phone || "",
        profession: userProfile?.profession || user?.profession || "",
        birthDate: userProfile?.birth_date || user?.birthDate || "",
        mobilePhone: formatPhoneForDisplay(userProfile?.phone || user?.phone || ""),
        homePhone: formatPhoneForDisplay(userProfile?.phone || user?.phone || ""),
        // Campos que não temos no sistema atual - deixar vazios
        motherName: "",
        rg: "",
        maritalStatus: "",
        address: "",
        addressNumber: "",
        addressComplement: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
        commercialPhone: "",
        whatsapp: formatPhoneForDisplay(userProfile?.phone || user?.phone || ""),
        hasDependents: false,
        cardNumber: userProfile?.id ? `AE-${userProfile.id.slice(-4).toUpperCase()}` : (user?.uuid ? `AE-${user.uuid.slice(-4).toUpperCase()}` : ""),
        // Logo da AEDUC
        logoUrl: "https://i.ibb.co/mr40xW7W/Captura-de-Tela-2025-03-01-a-s-00-56-14-removebg-preview.png",
      })

      // Gerar nome único para o arquivo PDF
      const timestamp = Date.now()
      const fileName = `ficha-adesao-${timestamp}.pdf`
      const filePath = `membership-forms/${fileName}`

      // Upload do PDF para o Supabase Storage
      const { error: uploadError } = await supabase.storage.from("user-documents").upload(filePath, pdfBlob, {
        contentType: "application/pdf",
      })

      if (uploadError) throw uploadError

      // Obter URL pública do arquivo PDF
      const { data } = supabase.storage.from("user-documents").getPublicUrl(filePath)

      // Também salvar apenas a assinatura para compatibilidade (caso necessário)
      const signatureBlob = await fetch(signatureDataUrl).then((r) => r.blob())
      const signatureFileName = `signature-${timestamp}.png`
      const signatureFilePath = `signatures/${signatureFileName}`

      await supabase.storage.from("user-documents").upload(signatureFilePath, signatureBlob)

      setSignatureUrl(data.publicUrl)
      await onComplete(data.publicUrl)
    } catch (err: any) {
      console.error("Erro ao salvar assinatura:", err)
      setError(err.message || "Erro ao salvar assinatura")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Assinatura da Proposta de Adesão</h2>
      <p className="text-gray-600 mb-6">
        Para finalizar seu cadastro, leia a proposta de adesão abaixo e assine no campo indicado.
      </p>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">{error}</div>}

      <div className="border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-start mb-4">
          <FileText className="h-6 w-6 text-blue-900 mr-3 flex-shrink-0 mt-1" />
          <h3 className="font-medium text-gray-800">Proposta de Adesão</h3>
        </div>

        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{membershipProposal}</pre>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-800 mb-4">Assinatura:</h3>

        <div className="border border-gray-300 rounded-md bg-white mb-4">
          <SignatureCanvas
            ref={signatureRef}
            canvasProps={{
              width: 500,
              height: 200,
              className: "w-full h-48 signature-canvas",
            }}
            onEnd={checkSignature}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={clearSignature}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors mr-2"
            disabled={loading || isUploading}
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveSignature}
          className="px-6 py-3 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors flex items-center"
          disabled={!hasSignature || loading || isUploading}
        >
          {loading || isUploading ? "Processando..." : "Finalizar Cadastro"}
          {!loading && !isUploading && <ArrowRight className="ml-2 h-5 w-5" />}
        </button>
      </div>
    </div>
  )
}

export default SignatureStep

