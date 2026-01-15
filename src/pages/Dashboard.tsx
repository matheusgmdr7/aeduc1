"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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
import SignatureCanvas from "react-signature-canvas"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

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
  }>({
    idDocumentUrl: "",
    addressDocumentUrl: "",
  })
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [documentError, setDocumentError] = useState("")

  // Estados para a aba de ficha cadastral
  const [membershipFormData, setMembershipFormData] = useState({
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
    homePhone: "",
    mobilePhone: "",
    commercialPhone: "",
    whatsapp: "",
    hasDependents: false,
    local: "",
    date: new Date().toISOString().split("T")[0], // Inicializar com data atual
  })
  const signatureRef = useRef<SignatureCanvas | null>(null)
  const memberCardRef = useRef<HTMLDivElement | null>(null)
  const [signatureDataUrl, setSignatureDataUrl] = useState("")
  const [isSigned, setIsSigned] = useState(false)
  const [membershipFormPdfUrl, setMembershipFormPdfUrl] = useState("")
  const [loadingMembershipForm, setLoadingMembershipForm] = useState(false)
  const [savingMembershipForm, setSavingMembershipForm] = useState(false)
  const [downloadingCard, setDownloadingCard] = useState(false)
  const [membershipFormError, setMembershipFormError] = useState("")
  const [membershipFormSuccess, setMembershipFormSuccess] = useState("")
  const [generatingPDF, setGeneratingPDF] = useState(false)

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
        .select("id_document_url, address_document_url")
        .eq("user_id", user.uuid)
        .single()

      if (error) throw error

      if (data) {
        setDocuments({
          idDocumentUrl: data.id_document_url,
          addressDocumentUrl: data.address_document_url,
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
    if (activeTab === "membership-form" && user?.paymentComplete) {
      fetchMembershipFormData()
    }
  }, [activeTab, user])

  // Função auxiliar para obter URL válida (pública ou assinada)
  const getValidStorageUrl = async (filePath: string): Promise<string> => {
    // Tentar URL pública primeiro
    const { data: publicUrlData } = supabase.storage
      .from("user-documents")
      .getPublicUrl(filePath)

    if (publicUrlData?.publicUrl) {
      // Verificar se a URL pública funciona (testando se é uma URL válida)
      // Se a URL contém '/object/public/', é uma URL pública válida
      if (publicUrlData.publicUrl.includes("/object/public/")) {
        return publicUrlData.publicUrl
      }
    }

    // Se URL pública não funcionar, gerar URL assinada (válida por 7 dias)
    console.log("⚠️ Gerando URL assinada para:", filePath)
    const { data: signedUrlData, error: signError } = await supabase.storage
      .from("user-documents")
      .createSignedUrl(filePath, 604800) // Válida por 7 dias

    if (signError || !signedUrlData) {
      throw new Error("Erro ao obter URL do arquivo: " + (signError?.message || "Erro desconhecido"))
    }

    return signedUrlData.signedUrl
  }

  // Buscar dados da ficha cadastral do perfil
  const fetchMembershipFormData = async () => {
    if (!user?.uuid) return

    setLoadingMembershipForm(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.uuid)
        .single()

      if (error) throw error

      if (data) {
        setMembershipFormData({
          motherName: data.mother_name || "",
          rg: data.rg || "",
          maritalStatus: data.marital_status || "",
          address: data.address || "",
          addressNumber: data.address_number || "",
          addressComplement: data.address_complement || "",
          neighborhood: data.neighborhood || "",
          city: data.city || "",
          state: data.state || "",
          zipCode: data.zip_code || "",
          homePhone: data.home_phone || "",
          mobilePhone: data.mobile_phone || data.phone || "",
          commercialPhone: data.commercial_phone || "",
          whatsapp: data.whatsapp || data.phone || "",
          hasDependents: data.has_dependents || false,
          local: data.membership_form_local || "",
          date: data.membership_form_date || "",
        })

        // Buscar assinatura e PDF da ficha cadastral (pode estar em onboarding ou em uma tabela específica)
        const { data: onboardingData } = await supabase
          .from("onboarding")
          .select("signature_url, membership_form_pdf_url")
          .eq("user_id", user.uuid)
          .maybeSingle()

        if (onboardingData) {
          // Verificar se tem assinatura específica da ficha cadastral (não do onboarding)
          // Por enquanto, vamos usar a mesma assinatura do onboarding se existir
          // Mas vamos verificar se tem PDF da ficha cadastral
          if (onboardingData.membership_form_pdf_url) {
            // Extrair o caminho do arquivo da URL salva
            const pdfUrl = onboardingData.membership_form_pdf_url
            // Se for uma URL completa, extrair o caminho do arquivo
            let filePath = ""
            if (pdfUrl.includes("/storage/v1/object/")) {
              // Extrair o caminho do arquivo da URL
              const match = pdfUrl.match(/user-documents\/(.+)/)
              if (match) {
                filePath = match[1]
              }
            } else {
              // Se já for um caminho relativo, usar diretamente
              filePath = pdfUrl.replace("user-documents/", "")
            }

            if (filePath) {
              // Obter URL válida (pública ou assinada)
              try {
                const validUrl = await getValidStorageUrl(filePath)
                setMembershipFormPdfUrl(validUrl)
              } catch (urlError) {
                console.error("Erro ao obter URL válida do PDF:", urlError)
                // Usar a URL original como fallback
                setMembershipFormPdfUrl(pdfUrl)
              }
            } else {
              setMembershipFormPdfUrl(pdfUrl)
            }

            // Se tem PDF da ficha, significa que foi assinada
            if (onboardingData.signature_url) {
              setSignatureDataUrl(onboardingData.signature_url)
              setIsSigned(true)
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Erro ao buscar dados da ficha:", error)
      setMembershipFormError("Erro ao carregar dados da ficha cadastral")
    } finally {
      setLoadingMembershipForm(false)
    }
  }

  // Função para baixar a carteirinha do associado
  const downloadMemberCard = async () => {
    if (!memberCardRef.current || !user) return

    setDownloadingCard(true)
    try {
      // Capturar o componente como canvas usando html2canvas
      const canvas = await html2canvas(memberCardRef.current, {
        backgroundColor: "#ffffff",
        scale: 2, // Maior qualidade
        logging: false,
        useCORS: true,
      })

      // Criar um link de download para a imagem PNG
      const imgData = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = `carteirinha-${user.name.replace(/\s+/g, "-")}-${user.id}.png`
      link.href = imgData
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Opcional: também gerar PDF
      // const pdf = new jsPDF({
      //   orientation: "portrait",
      //   unit: "mm",
      //   format: [canvas.width * 0.264583, canvas.height * 0.264583], // Converter pixels para mm
      // })
      // pdf.addImage(imgData, "PNG", 0, 0, canvas.width * 0.264583, canvas.height * 0.264583)
      // pdf.save(`carteirinha-${user.name.replace(/\s+/g, "-")}-${user.id}.pdf`)
    } catch (error) {
      console.error("Erro ao baixar carteirinha:", error)
      alert("Erro ao baixar carteirinha. Por favor, tente novamente.")
    } finally {
      setDownloadingCard(false)
    }
  }

  // Salvar dados da ficha cadastral
  const saveMembershipFormData = async () => {
    if (!user?.uuid) return

    setSavingMembershipForm(true)
    setMembershipFormError("")
    setMembershipFormSuccess("")

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          mother_name: membershipFormData.motherName || null,
          rg: membershipFormData.rg || null,
          marital_status: membershipFormData.maritalStatus || null,
          address: membershipFormData.address || null,
          address_number: membershipFormData.addressNumber || null,
          address_complement: membershipFormData.addressComplement || null,
          neighborhood: membershipFormData.neighborhood || null,
          city: membershipFormData.city || null,
          state: membershipFormData.state || null,
          zip_code: membershipFormData.zipCode || null,
          home_phone: membershipFormData.homePhone || null,
          mobile_phone: membershipFormData.mobilePhone || null,
          commercial_phone: membershipFormData.commercialPhone || null,
          whatsapp: membershipFormData.whatsapp || null,
          has_dependents: membershipFormData.hasDependents,
        })
        .eq("id", user.uuid)

      if (error) throw error

      setMembershipFormSuccess("Dados salvos com sucesso!")
      setTimeout(() => setMembershipFormSuccess(""), 3000)
    } catch (error: any) {
      console.error("Erro ao salvar dados da ficha:", error)
      setMembershipFormError(error.message || "Erro ao salvar dados")
    } finally {
      setSavingMembershipForm(false)
    }
  }

  // Assinar e salvar ficha cadastral (gera PDF automaticamente)
  const signAndSaveMembershipForm = async () => {
    console.log("🔵 Iniciando processo de assinatura e salvamento...")
    
    if (!user?.uuid) {
      console.error("❌ Usuário não encontrado")
      setMembershipFormError("Erro: Usuário não autenticado")
      return
    }

    if (!signatureRef.current) {
      console.error("❌ Referência do canvas de assinatura não encontrada")
      setMembershipFormError("Erro: Canvas de assinatura não inicializado")
      return
    }

    if (signatureRef.current.isEmpty()) {
      console.warn("⚠️ Assinatura vazia")
      setMembershipFormError("Por favor, assine o documento antes de continuar")
      return
    }

    if (!membershipFormData.local || membershipFormData.local.trim() === "") {
      console.warn("⚠️ Campo Local não preenchido")
      setMembershipFormError("Por favor, preencha o campo Local")
      return
    }

    console.log("✅ Validações passadas, iniciando salvamento...")
    setSavingMembershipForm(true)
    setGeneratingPDF(true)
    setMembershipFormError("")
    setMembershipFormSuccess("")

    try {
      console.log("📝 Convertendo assinatura para imagem...")
      // Converter assinatura para imagem (dataURL)
      const signatureDataUrl = signatureRef.current.toDataURL("image/png")
      console.log("✅ Assinatura convertida, tamanho:", signatureDataUrl.length, "caracteres")

      // Salvar assinatura no Supabase Storage (para referência futura)
      const fileName = `membership-form-signature-${Date.now()}.png`
      const filePath = `membership-forms/${fileName}`
      
      // Converter data URL para blob
      const response = await fetch(signatureDataUrl)
      if (!response.ok) {
        throw new Error("Erro ao converter assinatura para blob")
      }
      const blob = await response.blob()

      // Verificar se o bucket existe e tem permissões
      const { error: uploadError } = await supabase.storage
        .from("user-documents")
        .upload(filePath, blob, {
          contentType: "image/png",
          upsert: false, // Não sobrescrever se já existir
        })

      let signatureUrl = ""
      if (uploadError) {
        console.warn("⚠️ Erro no upload da assinatura (continuando mesmo assim):", uploadError)
        // Se houver erro no upload, continuar mesmo assim usando o dataURL
      } else {
        // Tentar obter URL pública primeiro, se falhar, usar URL assinada
        const { data: signatureUrlData } = supabase.storage
          .from("user-documents")
          .getPublicUrl(filePath)

        if (signatureUrlData?.publicUrl) {
          signatureUrl = signatureUrlData.publicUrl
          console.log("✅ Assinatura salva no Storage (URL pública):", signatureUrl)
        } else {
          // Se não conseguir URL pública, gerar URL assinada
          console.log("⚠️ URL pública não disponível, gerando URL assinada para assinatura...")
          const { data: signedUrlData, error: signError } = await supabase.storage
            .from("user-documents")
            .createSignedUrl(filePath, 3600) // Válida por 1 hora

          if (!signError && signedUrlData) {
            signatureUrl = signedUrlData.signedUrl
            console.log("✅ Assinatura salva no Storage (URL assinada):", signatureUrl.substring(0, 100) + "...")
          } else {
            console.warn("⚠️ Não foi possível gerar URL para assinatura, usando dataURL")
            signatureUrl = signatureDataUrl // Fallback para dataURL
          }
        }
      }

      // Importar função para gerar PDF
      console.log("📄 Importando função de geração de PDF...")
      const { generateMembershipFormPDF: generatePDF } = await import("../lib/generateMembershipFormPDF")
      console.log("✅ Função importada")

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

      // Converter data para formato brasileiro
      const formatDateToBR = (dateString: string) => {
        if (!dateString) return new Date().toLocaleDateString("pt-BR")
        const date = new Date(dateString)
        return date.toLocaleDateString("pt-BR")
      }

      // Gerar PDF usando o dataURL diretamente (não a URL do Storage)
      // Isso evita problemas de CORS e carregamento de imagem remota
      console.log("📄 Gerando PDF da ficha cadastral...")
      const pdfBlob = await generatePDF({
        userName: user.name,
        signatureDataUrl: signatureDataUrl, // Usar o dataURL original (base64), não a URL do Storage
        date: formatDateToBR(membershipFormData.date),
        local: membershipFormData.local,
        cpf: user.cpf || "",
        email: user.email || "",
        phone: user.phone || "",
        profession: user.profession || "",
        birthDate: user.birthDate || "",
        motherName: membershipFormData.motherName,
        rg: membershipFormData.rg,
        maritalStatus: membershipFormData.maritalStatus,
        address: membershipFormData.address,
        addressNumber: membershipFormData.addressNumber,
        addressComplement: membershipFormData.addressComplement,
        neighborhood: membershipFormData.neighborhood,
        city: membershipFormData.city,
        state: membershipFormData.state,
        zipCode: membershipFormData.zipCode,
        homePhone: formatPhoneForDisplay(membershipFormData.homePhone),
        mobilePhone: formatPhoneForDisplay(membershipFormData.mobilePhone),
        commercialPhone: formatPhoneForDisplay(membershipFormData.commercialPhone),
        whatsapp: formatPhoneForDisplay(membershipFormData.whatsapp),
        hasDependents: membershipFormData.hasDependents,
        cardNumber: `AE-${user.id}` || "",
        logoUrl: "https://i.ibb.co/mr40xW7W/Captura-de-Tela-2025-03-01-a-s-00-56-14-removebg-preview.png",
      })
      console.log("✅ PDF gerado, tamanho:", pdfBlob.size, "bytes")

      // Salvar PDF no Supabase Storage
      console.log("💾 Salvando PDF no Storage...")
      const pdfFileName = `ficha-cadastral-${user.uuid}-${Date.now()}.pdf`
      const pdfFilePath = `membership-forms/${pdfFileName}`

      const { error: pdfUploadError } = await supabase.storage
        .from("user-documents")
        .upload(pdfFilePath, pdfBlob, {
          contentType: "application/pdf",
          upsert: false,
        })

      if (pdfUploadError) {
        console.error("Erro no upload do PDF:", pdfUploadError)
        // Se o erro for de bucket não encontrado ou permissão
        if (pdfUploadError.message?.includes("bucket") || pdfUploadError.message?.includes("not found")) {
          throw new Error("Bucket 'user-documents' não encontrado. Verifique as configurações do Storage no Supabase.")
        }
        if (pdfUploadError.message?.includes("new row violates") || pdfUploadError.message?.includes("policy")) {
          throw new Error("Erro de permissão ao fazer upload do PDF. Verifique as políticas RLS do Storage.")
        }
        throw pdfUploadError
      }

      // Tentar obter URL pública primeiro, se falhar, usar URL assinada
      let pdfUrl = ""
      const { data: pdfUrlData } = supabase.storage
        .from("user-documents")
        .getPublicUrl(pdfFilePath)

      if (pdfUrlData?.publicUrl) {
        pdfUrl = pdfUrlData.publicUrl
        console.log("✅ URL pública obtida:", pdfUrl)
      } else {
        // Se não conseguir URL pública, gerar URL assinada (válida por 1 hora)
        console.log("⚠️ URL pública não disponível, gerando URL assinada...")
        const { data: signedUrlData, error: signError } = await supabase.storage
          .from("user-documents")
          .createSignedUrl(pdfFilePath, 3600) // Válida por 1 hora

        if (signError || !signedUrlData) {
          console.error("Erro ao gerar URL assinada:", signError)
          throw new Error("Erro ao obter URL do PDF: " + (signError?.message || "Erro desconhecido"))
        }

        pdfUrl = signedUrlData.signedUrl
        console.log("✅ URL assinada gerada:", pdfUrl.substring(0, 100) + "...")
      }
      console.log("✅ PDF salvo no Storage:", pdfUrl)

      // Salvar dados no perfil
      console.log("💾 Atualizando perfil do usuário...")
      const profileUpdateData: any = {
        mother_name: membershipFormData.motherName || null,
        rg: membershipFormData.rg || null,
        marital_status: membershipFormData.maritalStatus || null,
        address: membershipFormData.address || null,
        address_number: membershipFormData.addressNumber || null,
        address_complement: membershipFormData.addressComplement || null,
        neighborhood: membershipFormData.neighborhood || null,
        city: membershipFormData.city || null,
        state: membershipFormData.state || null,
        zip_code: membershipFormData.zipCode || null,
        home_phone: membershipFormData.homePhone || null,
        mobile_phone: membershipFormData.mobilePhone || null,
        commercial_phone: membershipFormData.commercialPhone || null,
        whatsapp: membershipFormData.whatsapp || null,
        has_dependents: membershipFormData.hasDependents,
      }

      // Adicionar campos de ficha cadastral apenas se existirem (podem não existir se migration não foi executada)
      try {
        profileUpdateData.membership_form_local = membershipFormData.local
        profileUpdateData.membership_form_date = membershipFormData.date || new Date().toISOString().split("T")[0]
      } catch (e) {
        console.warn("Campos membership_form_local/date podem não existir no banco:", e)
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdateData)
        .eq("id", user.uuid)

      if (profileError) {
        console.error("Erro ao atualizar perfil:", profileError)
        // Se o erro for sobre colunas que não existem, tentar sem esses campos
        if (profileError.message?.includes("column") || profileError.message?.includes("does not exist")) {
          console.warn("Alguns campos podem não existir no banco, tentando sem eles...")
          const { error: retryError } = await supabase
            .from("profiles")
            .update({
              mother_name: membershipFormData.motherName || null,
              rg: membershipFormData.rg || null,
              marital_status: membershipFormData.maritalStatus || null,
              address: membershipFormData.address || null,
              address_number: membershipFormData.addressNumber || null,
              address_complement: membershipFormData.addressComplement || null,
              neighborhood: membershipFormData.neighborhood || null,
              city: membershipFormData.city || null,
              state: membershipFormData.state || null,
              zip_code: membershipFormData.zipCode || null,
              home_phone: membershipFormData.homePhone || null,
              mobile_phone: membershipFormData.mobilePhone || null,
              commercial_phone: membershipFormData.commercialPhone || null,
              whatsapp: membershipFormData.whatsapp || null,
              has_dependents: membershipFormData.hasDependents,
            })
            .eq("id", user.uuid)
          if (retryError) throw retryError
        } else {
          throw profileError
        }
      }

      // Salvar assinatura e PDF no onboarding
      const onboardingData: any = {
        user_id: user.uuid,
        signature_url: signatureUrl || signatureDataUrl, // Usar URL do Storage se disponível, senão usar dataURL
        updated_at: new Date().toISOString(),
      }

      // Adicionar campo membership_form_pdf_url apenas se existir
      try {
        onboardingData.membership_form_pdf_url = pdfUrl
      } catch (e) {
        console.warn("Campo membership_form_pdf_url pode não existir no banco:", e)
      }

      // Usar upsert com onConflict para lidar com registros existentes
      console.log("💾 Salvando dados no onboarding...")
      const { error: onboardingError } = await supabase
        .from("onboarding")
        .upsert(onboardingData, { onConflict: "user_id" })

      if (onboardingError) {
        console.error("Erro ao salvar no onboarding:", onboardingError)
        console.error("Detalhes:", {
          message: onboardingError.message,
          code: onboardingError.code,
          details: onboardingError.details,
          hint: onboardingError.hint,
        })
        
        // Se o erro for sobre coluna que não existe, tentar sem esse campo
        if (onboardingError.message?.includes("column") || onboardingError.message?.includes("does not exist")) {
          console.warn("Campo membership_form_pdf_url pode não existir, tentando sem ele...")
          const retryData = {
            user_id: user.uuid,
            signature_url: signatureUrl || signatureDataUrl,
            updated_at: new Date().toISOString(),
          }
          
          const { error: retryError } = await supabase
            .from("onboarding")
            .upsert(retryData, { onConflict: "user_id" })
          
          if (retryError) {
            console.error("Erro ao tentar novamente:", retryError)
            throw retryError
          }
        } else if (onboardingError.code === "23505" || onboardingError.message?.includes("duplicate")) {
          // Erro de duplicata - tentar atualizar diretamente
          console.warn("Registro duplicado detectado, tentando atualizar diretamente...")
          const { error: updateError } = await supabase
            .from("onboarding")
            .update(onboardingData)
            .eq("user_id", user.uuid)
          
          if (updateError) throw updateError
        } else {
          throw onboardingError
        }
      }
      
      console.log("✅ Dados salvos no onboarding com sucesso")

      // Atualizar estados
      setSignatureDataUrl(signatureUrl)
      setMembershipFormPdfUrl(pdfUrl)
      setIsSigned(true)

      setMembershipFormSuccess("Ficha cadastral assinada e salva com sucesso!")
      setTimeout(() => setMembershipFormSuccess(""), 3000)
    } catch (error: any) {
      console.error("Erro ao assinar e salvar ficha:", error)
      console.error("Detalhes do erro:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })

      let errorMessage = "Erro ao assinar e salvar ficha cadastral"
      
      if (error.message?.includes("column") || error.message?.includes("does not exist")) {
        errorMessage = "Erro: Alguns campos não existem no banco de dados. Por favor, execute a migration primeiro."
      } else if (error.message?.includes("storage") || error.message?.includes("bucket")) {
        errorMessage = "Erro ao fazer upload dos arquivos. Verifique as permissões do Storage."
      } else if (error.message) {
        errorMessage = error.message
      }

      setMembershipFormError(errorMessage)
    } finally {
      setSavingMembershipForm(false)
      setGeneratingPDF(false)
    }
  }

  // Assinar novamente (remove blur e libera campos)
  const signAgain = () => {
    setIsSigned(false)
    setSignatureDataUrl("")
    setMembershipFormPdfUrl("")
    if (signatureRef.current) {
      signatureRef.current.clear()
    }
  }

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
                    onClick={() => setActiveTab("membership-form")}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between ${
                      activeTab === "membership-form"
                        ? "bg-blue-50 text-blue-900 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    disabled={!user.paymentComplete}
                  >
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-3" />
                      <span>Ficha Cadastral</span>
                    </div>
                    {activeTab === "membership-form" && <ChevronRight className="h-4 w-4" />}
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
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-blue-900">Carteirinha do Associado</h2>
                    <button
                      onClick={downloadMemberCard}
                      disabled={downloadingCard}
                      className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {downloadingCard ? "Baixando..." : "Baixar Carteirinha"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div ref={memberCardRef}>
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

                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Membership Form Tab */}
            {activeTab === "membership-form" && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-blue-900">Ficha Cadastral</h2>
                    <div className="flex space-x-3">
                      {isSigned && membershipFormPdfUrl && (
                        <>
                          <button
                            onClick={() => window.open(membershipFormPdfUrl, "_blank")}
                            className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors flex items-center"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Visualizar Ficha
                          </button>
                          <button
                            onClick={signAgain}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center"
                          >
                            Assinar Novamente
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {membershipFormError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                      {membershipFormError}
                    </div>
                  )}

                  {membershipFormSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
                      {membershipFormSuccess}
                    </div>
                  )}

                  {loadingMembershipForm ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
                    </div>
                  ) : (
                    <div className="relative">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          if (!isSigned) {
                            signAndSaveMembershipForm()
                          }
                        }}
                        className={`space-y-6 ${isSigned ? "pointer-events-none" : ""}`}
                      >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nome da Mãe */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            *Nome da Mãe
                          </label>
                          <input
                            type="text"
                            value={membershipFormData.motherName}
                            onChange={(e) =>
                              setMembershipFormData({ ...membershipFormData, motherName: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nome completo da mãe"
                          />
                        </div>

                        {/* RG */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">*RG</label>
                          <input
                            type="text"
                            value={membershipFormData.rg}
                            onChange={(e) =>
                              setMembershipFormData({ ...membershipFormData, rg: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="RG"
                          />
                        </div>

                        {/* Estado Civil */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">*Estado Civil</label>
                          <select
                            value={membershipFormData.maritalStatus}
                            onChange={(e) =>
                              setMembershipFormData({ ...membershipFormData, maritalStatus: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Selecione</option>
                            <option value="Solteiro(a)">Solteiro(a)</option>
                            <option value="Casado(a)">Casado(a)</option>
                            <option value="Divorciado(a)">Divorciado(a)</option>
                            <option value="Viúvo(a)">Viúvo(a)</option>
                            <option value="União Estável">União Estável</option>
                          </select>
                        </div>

                        {/* Endereço */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">*Endereço</label>
                          <input
                            type="text"
                            value={membershipFormData.address}
                            onChange={(e) =>
                              setMembershipFormData({ ...membershipFormData, address: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Rua, Avenida, etc."
                          />
                        </div>

                        {/* Número */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
                          <input
                            type="text"
                            value={membershipFormData.addressNumber}
                            onChange={(e) =>
                              setMembershipFormData({ ...membershipFormData, addressNumber: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Número"
                          />
                        </div>

                        {/* Complemento */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
                          <input
                            type="text"
                            value={membershipFormData.addressComplement}
                            onChange={(e) =>
                              setMembershipFormData({
                                ...membershipFormData,
                                addressComplement: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Apto, Bloco, etc."
                          />
                        </div>

                        {/* Bairro */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">*Bairro</label>
                          <input
                            type="text"
                            value={membershipFormData.neighborhood}
                            onChange={(e) =>
                              setMembershipFormData({ ...membershipFormData, neighborhood: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Bairro"
                          />
                        </div>

                        {/* Cidade */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">*Cidade</label>
                          <input
                            type="text"
                            value={membershipFormData.city}
                            onChange={(e) =>
                              setMembershipFormData({ ...membershipFormData, city: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Cidade"
                          />
                        </div>

                        {/* Estado/UF */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">*Estado/UF</label>
                          <input
                            type="text"
                            value={membershipFormData.state}
                            onChange={(e) =>
                              setMembershipFormData({ ...membershipFormData, state: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="UF"
                            maxLength={2}
                          />
                        </div>

                        {/* CEP */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">*CEP</label>
                          <input
                            type="text"
                            value={membershipFormData.zipCode}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "")
                              const formatted = value.replace(/(\d{5})(\d)/, "$1-$2")
                              setMembershipFormData({ ...membershipFormData, zipCode: formatted })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="00000-000"
                            maxLength={9}
                          />
                        </div>

                        {/* Telefone Residencial */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">*Telefone Residencial</label>
                          <input
                            type="text"
                            value={membershipFormData.homePhone}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "")
                              const formatted = value.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3")
                              setMembershipFormData({ ...membershipFormData, homePhone: formatted })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="(00) 0000-0000"
                          />
                        </div>

                        {/* Telefone Celular */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">*Telefone Celular</label>
                          <input
                            type="text"
                            value={membershipFormData.mobilePhone}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "")
                              const formatted = value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
                              setMembershipFormData({ ...membershipFormData, mobilePhone: formatted })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="(00) 00000-0000"
                          />
                        </div>

                        {/* Telefone Comercial */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Telefone Comercial</label>
                          <input
                            type="text"
                            value={membershipFormData.commercialPhone}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "")
                              const formatted = value.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3")
                              setMembershipFormData({ ...membershipFormData, commercialPhone: formatted })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="(00) 0000-0000"
                          />
                        </div>

                        {/* WhatsApp */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                          <input
                            type="text"
                            value={membershipFormData.whatsapp}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "")
                              const formatted = value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
                              setMembershipFormData({ ...membershipFormData, whatsapp: formatted })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="(00) 00000-0000"
                          />
                        </div>

                        {/* Possui Dependentes */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            *Possui Dependentes?
                          </label>
                          <div className="flex items-center space-x-6">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="hasDependents"
                                checked={membershipFormData.hasDependents === true}
                                onChange={() =>
                                  setMembershipFormData({ ...membershipFormData, hasDependents: true })
                                }
                                className="mr-2"
                              />
                              Sim
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="hasDependents"
                                checked={membershipFormData.hasDependents === false}
                                onChange={() =>
                                  setMembershipFormData({ ...membershipFormData, hasDependents: false })
                                }
                                className="mr-2"
                              />
                              Não
                            </label>
                          </div>
                        </div>

                        {/* Local e Data */}
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              *Local
                            </label>
                            <input
                              type="text"
                              value={membershipFormData.local}
                              onChange={(e) =>
                                setMembershipFormData({ ...membershipFormData, local: e.target.value })
                              }
                              disabled={isSigned}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              placeholder="Cidade, Estado"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Data
                            </label>
                            <input
                              type="date"
                              value={membershipFormData.date || new Date().toISOString().split("T")[0]}
                              onChange={(e) =>
                                setMembershipFormData({ ...membershipFormData, date: e.target.value })
                              }
                              disabled={isSigned}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>

                        {/* Canvas de Assinatura */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            *Assinatura
                          </label>
                          <div className="relative border-2 border-gray-300 rounded-md bg-white">
                            {isSigned && signatureDataUrl ? (
                              <div className="relative">
                                <img
                                  src={signatureDataUrl}
                                  alt="Assinatura"
                                  className="w-full h-48 object-contain"
                                />
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-900 mb-2">✓</div>
                                    <div className="text-lg font-semibold text-blue-900">Assinado</div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <SignatureCanvas
                                ref={signatureRef}
                                canvasProps={{
                                  className: "w-full h-48",
                                  style: { touchAction: "none" },
                                }}
                                backgroundColor="white"
                              />
                            )}
                          </div>
                          {!isSigned && (
                            <button
                              type="button"
                              onClick={() => {
                                if (signatureRef.current) {
                                  signatureRef.current.clear()
                                }
                              }}
                              className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                            >
                              Limpar assinatura
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end space-x-4 pt-4 border-t">
                        {!isSigned ? (
                          <>
                            <button
                              type="button"
                              onClick={() => fetchMembershipFormData()}
                              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={signAndSaveMembershipForm}
                              disabled={savingMembershipForm || generatingPDF}
                              className="px-6 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                              {savingMembershipForm || generatingPDF ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  {generatingPDF ? "Gerando PDF..." : "Salvando..."}
                                </>
                              ) : (
                                "Assinar e Salvar"
                              )}
                            </button>
                          </>
                        ) : (
                          <div className="w-full">
                            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md mb-4">
                              <p className="font-medium">Ficha cadastral assinada e salva com sucesso!</p>
                              <p className="text-sm mt-1">Você pode visualizar ou assinar novamente usando os botões acima.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </form>
                    {isSigned && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                        <div className="text-center bg-white px-8 py-6 rounded-lg shadow-lg border-2 border-blue-200">
                          <div className="text-4xl font-bold text-blue-900 mb-3">✓</div>
                          <div className="text-xl font-semibold text-blue-900 mb-2">Ficha Assinada</div>
                          <div className="text-sm text-gray-600">Os dados estão protegidos</div>
                        </div>
                      </div>
                    )}
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

