"use client"

import type React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { Menu, X } from "lucide-react"
import { useAuth } from "../context/AuthContext"

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated, logout } = useAuth()

  // Modificar o handler de logout para lidar melhor com erros
  const handleLogout = async () => {
    try {
      await logout()
      // Não é necessário navegar aqui, pois o AuthContext já vai atualizar o estado
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      // Mesmo com erro, forçar navegação para a página inicial
      window.location.href = "/"
    }
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img
                src="https://i.ibb.co/mr40xW7W/Captura-de-Tela-2025-03-01-a-s-00-56-14-removebg-preview.png"
                alt="Logo AEDUC"
                className="h-10 w-auto sm:h-12"
              />
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <Link
              to="/"
              className="px-2 lg:px-3 py-2 rounded-md hover:bg-blue-800 hover:text-white transition-colors text-sm lg:text-base"
            >
              Início
            </Link>
            <Link
              to="/about"
              className="px-2 lg:px-3 py-2 rounded-md hover:bg-blue-800 hover:text-white transition-colors text-sm lg:text-base"
            >
              Sobre
            </Link>
            <Link
              to="/benefits"
              className="px-2 lg:px-3 py-2 rounded-md hover:bg-blue-800 hover:text-white transition-colors text-sm lg:text-base"
            >
              Benefícios
            </Link>
            <div className="relative group">
              <button className="px-2 lg:px-3 py-2 rounded-md hover:bg-blue-800 hover:text-white transition-colors text-sm lg:text-base">
                Parcerias
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <Link to="/partnership" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50">
                  Seja um Parceiro
                </Link>
                <Link to="/our-partnerships" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50">
                  Nossas Parcerias
                </Link>
              </div>
            </div>
            <Link
              to="/contact"
              className="px-2 lg:px-3 py-2 rounded-md hover:bg-blue-800 hover:text-white transition-colors text-sm lg:text-base"
            >
              Contato
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-2 lg:px-3 py-2 rounded-md hover:bg-blue-800 hover:text-white transition-colors text-sm lg:text-base"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 lg:px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors text-sm lg:text-base"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-3 lg:px-4 py-2 rounded-md bg-blue-900 text-white hover:bg-blue-800 transition-colors text-sm lg:text-base"
              >
                Área do Associado
              </Link>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-blue-900 hover:text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block px-3 py-2 rounded-md hover:bg-blue-800 hover:text-white transition-colors">
              Início
            </Link>
            <Link
              to="/about"
              className="block px-3 py-2 rounded-md hover:bg-blue-800 hover:text-white transition-colors"
            >
              Sobre
            </Link>
            <Link
              to="/benefits"
              className="block px-3 py-2 rounded-md hover:bg-blue-800 hover:text-white transition-colors"
            >
              Benefícios
            </Link>
            <Link
              to="/partnership"
              className="block px-3 py-2 rounded-md hover:bg-blue-800 hover:text-white transition-colors"
            >
              Seja um Parceiro
            </Link>
            <Link
              to="/our-partnerships"
              className="block px-3 py-2 rounded-md hover:bg-blue-800 hover:text-white transition-colors"
            >
              Nossas Parcerias
            </Link>
            <Link
              to="/contact"
              className="block px-3 py-2 rounded-md hover:bg-blue-800 hover:text-white transition-colors"
            >
              Contato
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 rounded-md hover:bg-blue-800 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link to="/login" className="block px-3 py-2 rounded-md bg-blue-900 text-white hover:bg-blue-800">
                Área do Associado
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar

