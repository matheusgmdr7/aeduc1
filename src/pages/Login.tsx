"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { LogIn } from "lucide-react"

const Login: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Se o usuário já estiver autenticado, redirecionar para o dashboard
    if (isAuthenticated) {
      navigate("/dashboard")
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      // Usa o método login do AuthContext que já está conectado ao Supabase
      await login(email, password)
      
      // Aguardar um pouco para garantir que o perfil foi carregado/criado
      await new Promise((resolve) => setTimeout(resolve, 500))
      
      navigate("/dashboard")
    } catch (error: any) {
      console.error("Erro de login:", error)
      
      // Mensagens de erro mais específicas
      let errorMessage = "Falha ao fazer login. Verifique suas credenciais."
      
      if (error.message) {
        if (error.message.includes("Configuração do Supabase incompleta")) {
          errorMessage = "Erro de configuração: As credenciais do Supabase não estão configuradas. Verifique o arquivo .env"
        } else if (error.message.includes("Invalid login credentials")) {
          errorMessage = "E-mail ou senha incorretos. Verifique suas credenciais."
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Por favor, confirme seu e-mail antes de fazer login."
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-900 mb-2">Login</h1>
            <p className="text-gray-600">Acesse sua conta de associado AEDUC</p>
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
                <Link to="/forgot-password" className="text-sm text-blue-700 hover:text-blue-900">
                  Esqueceu a senha?
                </Link>
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
              >
                <LogIn className="h-5 w-5 mr-2" /> Entrar
              </button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-gray-600">
              Ainda não é associado?{" "}
              <Link to="/register" className="text-blue-700 hover:text-blue-900 font-medium">
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

