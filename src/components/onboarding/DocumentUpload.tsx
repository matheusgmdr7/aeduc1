"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { Upload, X, Check, FileText, Home, ArrowRight } from "lucide-react"

interface DocumentUploadProps {
  onSubmit: (idDocUrl: string, addressDocUrl: string) => Promise<void>
  loading: boolean
  initialIdDocUrl?: string
  initialAddressDocUrl?: string
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onSubmit,
  loading,
  initialIdDocUrl = "",
  initialAddressDocUrl = "",
}) => {
  const [idDocument, setIdDocument] = useState<File | null>(null)
  const [addressDocument, setAddressDocument] = useState<File | null>(null)
  const [idDocumentUrl, setIdDocumentUrl] = useState(initialIdDocUrl)
  const [addressDocumentUrl, setAddressDocumentUrl] = useState(initialAddressDocUrl)
  const [uploadingId, setUploadingId] = useState(false)
  const [uploadingAddress, setUploadingAddress] = useState(false)
  const [error, setError] = useState("")

  const handleIdDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      // Verificar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("O documento de identificação deve ter no máximo 5MB")
        return
      }
      setIdDocument(file)
    }
  }

  const handleAddressDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      // Verificar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("O comprovante de residência deve ter no máximo 5MB")
        return
      }
      setAddressDocument(file)
    }
  }

  const uploadIdDocument = async () => {
    if (!idDocument) return

    setUploadingId(true)
    setError("")

    try {
      // Gerar nome único para o arquivo
      const fileExt = idDocument.name.split(".").pop()
      const fileName = `${Date.now()}-id-document.${fileExt}`
      const filePath = `documents/${fileName}`

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage.from("user-documents").upload(filePath, idDocument)

      if (uploadError) throw uploadError

      // Obter URL pública do arquivo
      const { data } = supabase.storage.from("user-documents").getPublicUrl(filePath)

      setIdDocumentUrl(data.publicUrl)
    } catch (err: any) {
      console.error("Erro ao fazer upload do documento de identificação:", err)
      setError(err.message || "Erro ao fazer upload do documento de identificação")
    } finally {
      setUploadingId(false)
    }
  }

  const uploadAddressDocument = async () => {
    if (!addressDocument) return

    setUploadingAddress(true)
    setError("")

    try {
      // Gerar nome único para o arquivo
      const fileExt = addressDocument.name.split(".").pop()
      const fileName = `${Date.now()}-address-document.${fileExt}`
      const filePath = `documents/${fileName}`

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage.from("user-documents").upload(filePath, addressDocument)

      if (uploadError) throw uploadError

      // Obter URL pública do arquivo
      const { data } = supabase.storage.from("user-documents").getPublicUrl(filePath)

      setAddressDocumentUrl(data.publicUrl)
    } catch (err: any) {
      console.error("Erro ao fazer upload do comprovante de residência:", err)
      setError(err.message || "Erro ao fazer upload do comprovante de residência")
    } finally {
      setUploadingAddress(false)
    }
  }

  // Fazer upload automático quando um arquivo for selecionado
  useEffect(() => {
    if (idDocument) {
      uploadIdDocument()
    }
  }, [idDocument])

  useEffect(() => {
    if (addressDocument) {
      uploadAddressDocument()
    }
  }, [addressDocument])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!idDocumentUrl || !addressDocumentUrl) {
      setError("Por favor, faça o upload de ambos os documentos")
      return
    }

    await onSubmit(idDocumentUrl, addressDocumentUrl)
  }

  const removeIdDocument = () => {
    setIdDocument(null)
    setIdDocumentUrl("")
  }

  const removeAddressDocument = () => {
    setAddressDocument(null)
    setAddressDocumentUrl("")
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload de Documentos</h2>
      <p className="text-gray-600 mb-6">
        Para verificarmos sua identidade, precisamos que você envie os seguintes documentos:
      </p>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Documento de identificação */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start mb-4">
            <FileText className="h-6 w-6 text-blue-900 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-gray-800">Documento de Identificação</h3>
              <p className="text-sm text-gray-600">RG, CNH ou Passaporte (frente e verso em um único arquivo)</p>
            </div>
          </div>

          {idDocumentUrl ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 flex justify-between items-center">
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 text-sm">Documento enviado com sucesso</span>
              </div>
              <button
                type="button"
                onClick={removeIdDocument}
                className="text-red-600 hover:text-red-800"
                disabled={loading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="mt-2">
              <label
                htmlFor="id-document"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                  </p>
                  <p className="text-xs text-gray-500">PDF, PNG ou JPG (máx. 5MB)</p>
                </div>
                <input
                  id="id-document"
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleIdDocumentChange}
                  disabled={uploadingId || loading}
                />
              </label>
              {uploadingId && <p className="text-sm text-blue-600 mt-2 text-center">Enviando documento...</p>}
            </div>
          )}
        </div>

        {/* Comprovante de residência */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start mb-4">
            <Home className="h-6 w-6 text-blue-900 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-gray-800">Comprovante de Residência</h3>
              <p className="text-sm text-gray-600">
                Conta de luz, água, telefone ou internet (emitido nos últimos 3 meses)
              </p>
            </div>
          </div>

          {addressDocumentUrl ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 flex justify-between items-center">
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 text-sm">Documento enviado com sucesso</span>
              </div>
              <button
                type="button"
                onClick={removeAddressDocument}
                className="text-red-600 hover:text-red-800"
                disabled={loading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="mt-2">
              <label
                htmlFor="address-document"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                  </p>
                  <p className="text-xs text-gray-500">PDF, PNG ou JPG (máx. 5MB)</p>
                </div>
                <input
                  id="address-document"
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleAddressDocumentChange}
                  disabled={uploadingAddress || loading}
                />
              </label>
              {uploadingAddress && <p className="text-sm text-blue-600 mt-2 text-center">Enviando documento...</p>}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors flex items-center"
            disabled={!idDocumentUrl || !addressDocumentUrl || loading || uploadingId || uploadingAddress}
          >
            {loading ? "Processando..." : "Continuar"}
            {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
          </button>
        </div>
      </form>
    </div>
  )
}

export default DocumentUpload

