"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { RefreshCw, Search, CreditCard, Calendar, XCircle, Edit, Trash2, AlertTriangle, Download } from "lucide-react"

interface MemberCard {
  id: string
  user_id: string
  user_name: string
  user_email: string
  card_number: string
  delivery_date: string
  status: string
  created_at: string
  updated_at: string
}

const MemberCardsTab: React.FC = () => {
  const [cards, setCards] = useState<MemberCard[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [error, setError] = useState("")
  const [editingCard, setEditingCard] = useState<MemberCard | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    fetchCards()
  }, [])

  const fetchCards = async () => {
    setLoading(true)
    setError("")
    try {
      // Buscar carteirinhas
      const { data: cardsData, error: cardsError } = await supabase
        .from("member_cards")
        .select("*")
        .order("created_at", { ascending: false })

      if (cardsError) throw cardsError

      if (!cardsData || cardsData.length === 0) {
        setCards([])
        return
      }

      // Buscar informações dos usuários separadamente
      const userIds = [...new Set(cardsData.map((card) => card.user_id))]
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds)

      if (profilesError) {
        console.warn("Erro ao buscar perfis:", profilesError)
      }

      // Criar um mapa de user_id -> profile para lookup rápido
      const profilesMap = new Map()
      if (profilesData) {
        profilesData.forEach((profile) => {
          profilesMap.set(profile.id, profile)
        })
      }

      // Formatar dados para exibição
      const formattedCards = cardsData.map((card) => {
        const profile = profilesMap.get(card.user_id)
        return {
          id: card.id,
          user_id: card.user_id,
          user_name: profile?.name || "Nome não disponível",
          user_email: profile?.email || "Email não disponível",
          card_number: card.card_number || "N/A",
          delivery_date: card.delivery_date || new Date().toISOString(),
          status: card.status || "pending",
          created_at: card.created_at,
          updated_at: card.updated_at,
        }
      })

      setCards(formattedCards)
    } catch (err: any) {
      console.error("Erro ao buscar carteirinhas:", err)
      setError("Erro ao carregar carteirinhas: " + (err.message || "Erro desconhecido"))
    } finally {
      setLoading(false)
    }
  }

  const updateCardStatus = async (cardId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("member_cards")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cardId)

      if (error) throw error

      // Atualizar lista local
      setCards((prevCards) => prevCards.map((card) => (card.id === cardId ? { ...card, status: newStatus } : card)))
    } catch (err: any) {
      console.error("Erro ao atualizar status da carteirinha:", err)
      setError("Erro ao atualizar status: " + (err.message || "Erro desconhecido"))
    }
  }

  const deleteCard = async (cardId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta carteirinha? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      const { error } = await supabase.from("member_cards").delete().eq("id", cardId)

      if (error) throw error

      // Remover da lista local
      setCards((prevCards) => prevCards.filter((card) => card.id !== cardId))
    } catch (err: any) {
      console.error("Erro ao excluir carteirinha:", err)
      setError("Erro ao excluir carteirinha: " + (err.message || "Erro desconhecido"))
    }
  }

  // Filtrar carteirinhas com base no termo de busca e filtro de status
  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.card_number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || card.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800"
      case "production":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente"
      case "production":
        return "Em Produção"
      case "shipped":
        return "Enviada"
      case "delivered":
        return "Entregue"
      case "cancelled":
        return "Cancelada"
      default:
        return "Desconhecido"
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto text-red-700 hover:text-red-900">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Cabeçalho com ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Buscar carteirinhas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="production">Em Produção</option>
            <option value="shipped">Enviada</option>
            <option value="delivered">Entregue</option>
            <option value="cancelled">Cancelada</option>
          </select>

          <button
            onClick={fetchCards}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className="h-5 w-5" />
          </button>

          <button
            onClick={() => {
              /* Implementar exportação */
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Download className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Tabela de carteirinhas */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Associado
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Número da Carteirinha
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Data de Entrega
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
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
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <RefreshCw className="h-6 w-6 mx-auto animate-spin text-blue-600" />
                    <p className="mt-2 text-gray-500">Carregando carteirinhas...</p>
                  </td>
                </tr>
              ) : filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Nenhuma carteirinha encontrada
                  </td>
                </tr>
              ) : (
                filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{card.user_name}</span>
                        <span className="text-sm text-gray-500">{card.user_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{card.card_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {new Date(card.delivery_date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(card.status)}`}
                      >
                        {getStatusLabel(card.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingCard(card)
                            setShowEditModal(true)
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded-full"
                          title="Editar carteirinha"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteCard(card.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded-full"
                          title="Excluir carteirinha"
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

      {/* Modal de edição (implementar quando necessário) */}
      {showEditModal && editingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Editar Carteirinha</h3>

            {/* Formulário de edição */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Associado</label>
                <input
                  type="text"
                  value={editingCard.user_name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número da Carteirinha</label>
                <input
                  type="text"
                  value={editingCard.card_number}
                  onChange={(e) => setEditingCard({ ...editingCard, card_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Entrega</label>
                <input
                  type="date"
                  value={new Date(editingCard.delivery_date).toISOString().split("T")[0]}
                  onChange={(e) =>
                    setEditingCard({ ...editingCard, delivery_date: new Date(e.target.value).toISOString() })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editingCard.status}
                  onChange={(e) => setEditingCard({ ...editingCard, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pendente</option>
                  <option value="production">Em Produção</option>
                  <option value="shipped">Enviada</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Implementar atualização
                  updateCardStatus(editingCard.id, editingCard.status)
                  setShowEditModal(false)
                }}
                className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MemberCardsTab

