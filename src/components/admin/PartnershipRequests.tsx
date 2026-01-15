"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { RefreshCw, Eye, Check, X, Mail, Phone, Calendar, MessageSquare, Download } from "lucide-react"

interface PartnershipRequest {
  id: string
  cnpj: string
  institution_name: string
  email: string
  phone: string
  employees_range: string
  status: "pending" | "contacted" | "approved" | "rejected"
  notes?: string
  created_at: string
  contacted_at?: string
  contacted_by?: string
}

const PartnershipRequests: React.FC = () => {
  const [requests, setRequests] = useState<PartnershipRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<PartnershipRequest | null>(null)
  const [notes, setNotes] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const fetchRequests = async () => {
    setLoading(true)
    try {
      let query = supabase.from("partnership_requests").select("*").order("created_at", { ascending: false })

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setRequests(data || [])
    } catch (err: any) {
      console.error("Erro ao buscar solicitações:", err)
      setError(err.message || "Erro ao carregar solicitações")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [statusFilter])

  const handleViewRequest = (request: PartnershipRequest) => {
    setSelectedRequest(request)
    setNotes(request.notes || "")
  }

  const handleUpdateStatus = async (id: string, status: "contacted" | "approved" | "rejected") => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (status === "contacted") {
        updateData.contacted_at = new Date().toISOString()
        // Idealmente, você pegaria o ID do usuário atual
        updateData.contacted_by = "admin"
      }

      if (selectedRequest && notes !== selectedRequest.notes) {
        updateData.notes = notes
      }

      const { error } = await supabase.from("partnership_requests").update(updateData).eq("id", id)

      if (error) throw error

      // Atualizar a lista
      fetchRequests()
      // Fechar o modal
      setSelectedRequest(null)
    } catch (err: any) {
      console.error("Erro ao atualizar status:", err)
      alert("Erro ao atualizar status: " + err.message)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pendente</span>
        )
      case "contacted":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Contatado</span>
      case "approved":
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Aprovado</span>
      case "rejected":
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Rejeitado</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>
    }
  }

  const exportToCSV = () => {
    if (requests.length === 0) return

    // Criar cabeçalho CSV
    const headers = [
      "Instituição",
      "CNPJ",
      "Email",
      "Telefone",
      "Colaboradores",
      "Status",
      "Data da Solicitação",
      "Notas",
    ]

    // Converter dados para linhas CSV
    const rows = requests.map((req) => [
      req.institution_name,
      req.cnpj,
      req.email,
      req.phone,
      req.employees_range,
      req.status,
      formatDate(req.created_at),
      req.notes || "",
    ])

    // Combinar cabeçalho e linhas
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Criar blob e link para download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `parceiros-aeduc-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Solicitações de Parceria</h2>
        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendentes</option>
            <option value="contacted">Contatados</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Rejeitados</option>
          </select>
          <button
            onClick={fetchRequests}
            className="p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            title="Atualizar"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button
            onClick={exportToCSV}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            disabled={requests.length === 0}
          >
            <Download className="h-5 w-5 mr-2" />
            Exportar CSV
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">Carregando solicitações...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">Nenhuma solicitação de parceria encontrada.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instituição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CNPJ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Colaboradores
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.institution_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{request.cnpj}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{request.email}</div>
                      <div className="text-sm text-gray-500">{request.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{request.employees_range}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(request.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(request.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewRequest(request)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de detalhes */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-900">Detalhes da Solicitação</h2>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Instituição</p>
                <p className="font-medium">{selectedRequest.institution_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">CNPJ</p>
                <p className="font-medium">{selectedRequest.cnpj}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <div className="flex items-center">
                  <p className="font-medium mr-2">{selectedRequest.email}</p>
                  <a
                    href={`mailto:${selectedRequest.email}`}
                    className="text-blue-600 hover:text-blue-800"
                    title="Enviar email"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Telefone</p>
                <div className="flex items-center">
                  <p className="font-medium mr-2">{selectedRequest.phone}</p>
                  <a href={`tel:${selectedRequest.phone}`} className="text-blue-600 hover:text-blue-800" title="Ligar">
                    <Phone className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Colaboradores</p>
                <p className="font-medium">{selectedRequest.employees_range}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Data da Solicitação</p>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                  <p className="font-medium">{formatDate(selectedRequest.created_at)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <p className="font-medium">{getStatusBadge(selectedRequest.status)}</p>
              </div>
              {selectedRequest.contacted_at && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Contatado em</p>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                    <p className="font-medium">{formatDate(selectedRequest.contacted_at)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  <span>Notas</span>
                </div>
              </label>
              <textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Adicione notas sobre esta solicitação..."
              ></textarea>
            </div>

            <div className="flex justify-end space-x-2">
              {selectedRequest.status === "pending" && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedRequest.id, "contacted")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Marcar como Contatado
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedRequest.id, "approved")}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedRequest.id, "rejected")}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Rejeitar
                  </button>
                </>
              )}
              {selectedRequest.status === "contacted" && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedRequest.id, "approved")}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedRequest.id, "rejected")}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Rejeitar
                  </button>
                </>
              )}
              {(selectedRequest.status === "approved" || selectedRequest.status === "rejected") && (
                <button
                  onClick={() => handleUpdateStatus(selectedRequest.id, "contacted")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Marcar como Contatado
                </button>
              )}
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PartnershipRequests

