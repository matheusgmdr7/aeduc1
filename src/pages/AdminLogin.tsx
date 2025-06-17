"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { LogIn, Shield } from "lucide-react"
import { supabase } from "../lib/supabase"

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Verificar se o usuário já está autenticado
    const checkAdminAccess = async () => {
      if (isAuthenticated) {
        try {
          // Verificar se o usuário é admin
          const { data: userData } = await supabase.auth.getUser()
          if (!userData || !userData.user) {
            return
          }

          const { data, error } = await supabase.from("profiles").select("role").eq("id", userData.user.id).single()

          if (!error && data && data.role === "admin") {
            // Se for admin, redirecionar para o painel administrativo
            navigate("/admin")
          }
        } catch (error) {
          console.error("Erro ao verificar permissões:", error)
        }
      }
    }

    checkAdminAccess()
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Usa o método login do AuthContext que já está conectado ao Supabase
      await login(email, password)

      // Verificar se o usuário é administrador
      const { data: userData } = await supabase.auth.getUser()
      if (!userData || !userData.user) {
        throw new Error("Falha ao obter informações do usuário")
      }

      const { data, error } = await supabase.from("profiles").select("role").eq("id", userData.user.id).single()

      if (error) {
        throw new Error("Falha ao verificar permissões de administrador")
      }

      if (!data || data.role !== "admin") {
        // Se não for admin, fazer logout e mostrar erro
        await supabase.auth.signOut()
        throw new Error("Acesso negado. Esta área é restrita a administradores.")
      }

      // Se chegou até aqui, é um administrador válido
      navigate("/admin")
    } catch (error: any) {
      console.error("Erro de login:", error)
      setError(error.message || "Falha ao fazer login. Verifique suas credenciais.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-900 p-3 rounded-full">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-blue-900 mb-2">Área Administrativa</h1>
            <p className="text-gray-600">Acesso restrito a administradores</p>
          </div>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="seu.email@exemplo.com"
                required
              />
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="mb-6">
              <button
                type="submit"
                className="w-full bg-blue-900 text-white py-3 px-4 rounded-md hover:bg-blue-800 transition-colors flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
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
                    Processando...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" /> Entrar
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-gray-600">
              <Link to="/" className="text-blue-700 hover:text-blue-900 font-medium">
                Voltar para o site
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin

