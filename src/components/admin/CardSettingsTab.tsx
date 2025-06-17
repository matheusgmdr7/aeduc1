"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { Save, RefreshCw, Upload, AlertTriangle, CheckCircle, X, Info } from "lucide-react"

interface CardSettings {
  id?: number
  default_delivery_days: number
  card_template_url: string
  card_prefix: string
  updated_at?: string
}

const CardSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<CardSettings>({
    default_delivery_days: 7,
    card_template_url: "",
    card_prefix: "AEDUC-",
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [cardImage, setCardImage] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("card_settings").select("*").single()

      if (error) {
        if (error.code === "PGRST116") {
          // Não encontrou configurações, vamos criar uma padrão
          console.log("Nenhuma configuração encontrada, usando valores padrão")
        } else {
          throw error
        }
      }

      if (data) {
        setSettings(data)
        setPreviewUrl(data.card_template_url)
      }
    } catch (err: any) {
      console.error("Erro ao buscar configurações:", err)
      setError("Erro ao carregar configurações: " + (err.message || "Erro desconhecido"))
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: name === "default_delivery_days" ? Number.parseInt(value) : value,
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Verificar tamanho do arquivo (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("A imagem deve ter no máximo 2MB")
        return
      }

      setCardImage(file)

      // Criar URL para preview
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

      // Limpar URL quando o componente for desmontado
      return () => URL.revokeObjectURL(objectUrl)
    }
  }

  const uploadCardTemplate = async () => {
    if (!cardImage) return null

    setUploadingImage(true)
    try {
      // Gerar nome único para o arquivo
      const fileExt = cardImage.name.split(".").pop()
      const fileName = `card-template-${Date.now()}.${fileExt}`
      const filePath = `card-templates/${fileName}`

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage.from("card-templates").upload(filePath, cardImage)

      if (uploadError) throw uploadError

      // Obter URL pública do arquivo
      const { data } = supabase.storage.from("card-templates").getPublicUrl(filePath)

      return data.publicUrl
    } catch (err: any) {
      console.error("Erro ao fazer upload da imagem:", err)
      throw err
    } finally {
      setUploadingImage(false)
    }
  }

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      // Se tiver uma nova imagem, fazer upload
      let cardTemplateUrl = settings.card_template_url
      if (cardImage) {
        const uploadedUrl = await uploadCardTemplate()
        if (uploadedUrl) {
          cardTemplateUrl = uploadedUrl
        }
      }

      // Verificar se já existe configuração
      const { data: existingData, error: checkError } = await supabase.from("card_settings").select("id").single()

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError
      }

      const updatedSettings = {
        ...settings,
        card_template_url: cardTemplateUrl,
        updated_at: new Date().toISOString(),
      }

      let error

      if (existingData?.id) {
        // Atualizar configuração existente
        const { error: updateError } = await supabase
          .from("card_settings")
          .update(updatedSettings)
          .eq("id", existingData.id)

        error = updateError
      } else {
        // Criar nova configuração
        const { error: insertError } = await supabase.from("card_settings").insert([updatedSettings])

        error = insertError
      }

      if (error) throw error

      setSettings((prev) => ({
        ...prev,
        card_template_url: cardTemplateUrl,
      }))

      setSuccess("Configurações salvas com sucesso!")

      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess("")
      }, 3000)
    } catch (err: any) {
      console.error("Erro ao salvar configurações:", err)
      setError("Erro ao salvar configurações: " + (err.message || "Erro desconhecido"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Carregando configurações...</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-blue-900">Configurações de Carteirinhas</h2>
        <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
          <Info className="h-4 w-4 mr-1" />
          Configurações Globais
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-red-700 hover:text-red-900">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={saveSettings} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="default_delivery_days" className="block text-sm font-medium text-gray-700 mb-1">
              Tempo de Entrega Padrão (dias)
            </label>
            <input
              type="number"
              id="default_delivery_days"
              name="default_delivery_days"
              min="1"
              max="90"
              value={settings.default_delivery_days}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Número de dias após a ativação para entrega da carteirinha física.
            </p>
          </div>

          <div>
            <label htmlFor="card_prefix" className="block text-sm font-medium text-gray-700 mb-1">
              Prefixo do Código da Carteirinha
            </label>
            <input
              type="text"
              id="card_prefix"
              name="card_prefix"
              value={settings.card_prefix}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">Prefixo usado nos códigos das carteirinhas (ex: AEDUC-).</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template da Carteirinha</label>

          <div className="border border-gray-300 rounded-md p-4">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="mb-4">
                  <label htmlFor="card_template" className="block text-sm font-medium text-gray-700 mb-2">
                    Imagem da Carteirinha
                  </label>
                  <div className="flex items-center">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                        </p>
                        <p className="text-xs text-gray-500">PNG ou JPG (máx. 2MB)</p>
                      </div>
                      <input
                        id="card_template"
                        type="file"
                        className="hidden"
                        accept=".png,.jpg,.jpeg"
                        onChange={handleImageChange}
                        disabled={uploadingImage || saving}
                      />
                    </label>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Esta imagem será usada como template para todas as carteirinhas.
                  </p>
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Pré-visualização</label>
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 h-48 flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl || "/placeholder.svg"}
                      alt="Template da carteirinha"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm">Nenhuma imagem selecionada</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors flex items-center"
            disabled={saving || uploadingImage}
          >
            {saving || uploadingImage ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Salvar Configurações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CardSettingsTab

