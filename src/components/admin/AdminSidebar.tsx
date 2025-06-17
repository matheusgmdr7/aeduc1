"use client"

import type React from "react"
import { Users, BarChart, Settings, LogOut, CreditCard } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

interface AdminSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab }) => {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      // Mesmo com erro, forçar navegação para a página de login
      window.location.href = "/login"
    }
  }

  return (
    <div className="w-64 bg-blue-900 text-white min-h-screen flex flex-col">
      <div className="p-4 border-b border-blue-800">
        <h1 className="text-xl font-bold">AEDUC Admin</h1>
        <p className="text-sm text-blue-300">Painel Administrativo</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center p-3 rounded-md transition-colors ${
                activeTab === "users" ? "bg-blue-800" : "hover:bg-blue-800/50"
              }`}
            >
              <Users className="h-5 w-5 mr-3" />
              <span>Usuários</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("cards")}
              className={`w-full flex items-center p-3 rounded-md transition-colors ${
                activeTab === "cards" ? "bg-blue-800" : "hover:bg-blue-800/50"
              }`}
            >
              <CreditCard className="h-5 w-5 mr-3" />
              <span>Carteirinhas</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("stats")}
              className={`w-full flex items-center p-3 rounded-md transition-colors ${
                activeTab === "stats" ? "bg-blue-800" : "hover:bg-blue-800/50"
              }`}
            >
              <BarChart className="h-5 w-5 mr-3" />
              <span>Estatísticas</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center p-3 rounded-md transition-colors ${
                activeTab === "settings" ? "bg-blue-800" : "hover:bg-blue-800/50"
              }`}
            >
              <Settings className="h-5 w-5 mr-3" />
              <span>Configurações</span>
            </button>
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t border-blue-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center p-3 rounded-md hover:bg-blue-800/50 transition-colors"
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  )
}

export default AdminSidebar
