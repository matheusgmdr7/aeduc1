"use client"

import type React from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { UserPlus } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

// Definir as opções de profissão disponíveis
const professionOptions = ["Professor", "Diretor", "Reitor", "Estudante de Nível Superior"] as const

const registerSchema = z
  .object({
    name: z.string().min(3, "Nome completo é obrigatório"),
    cpf: z.string().min(11, "CPF inválido"),
    email: z.string().email("Email inválido"),
    phone: z.string().min(10, "Telefone inválido"),
    birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Data de nascimento inválida",
    }),
    profession: z.enum(professionOptions, {
      errorMap: () => ({ message: "Selecione uma profissão válida" }),
    }),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

type RegisterFormData = z.infer<typeof registerSchema>

const Register: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      profession: undefined, // Inicialmente sem seleção
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true)

    try {
      // Usa o método register do AuthContext que já está conectado ao Supabase
      await registerUser({
        email: data.email,
        password: data.password,
        name: data.name,
        cpf: data.cpf,
        phone: data.phone,
        birthDate: data.birthDate,
        profession: data.profession,
      })

      // Após registro bem-sucedido, redireciona para o onboarding
      navigate("/onboarding")
    } catch (error: any) {
      console.error("Erro no registro:", error)
      // Aqui você poderia adicionar um estado para mostrar o erro na interface
      alert(error.message || "Falha ao registrar. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-900 mb-2">Cadastro de Associado</h1>
            <p className="text-gray-600">Preencha o formulário abaixo para se tornar um associado AEDUC</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo*
                </label>
                <input
                  type="text"
                  id="name"
                  {...register("name")}
                  className={`w-full px-4 py-2 border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Seu nome completo"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">
                  CPF*
                </label>
                <input
                  type="text"
                  id="cpf"
                  {...register("cpf")}
                  className={`w-full px-4 py-2 border ${errors.cpf ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="000.000.000-00"
                />
                {errors.cpf && <p className="mt-1 text-sm text-red-600">{errors.cpf.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail*
                </label>
                <input
                  type="email"
                  id="email"
                  {...register("email")}
                  className={`w-full px-4 py-2 border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="seu.email@exemplo.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone*
                </label>
                <input
                  type="tel"
                  id="phone"
                  {...register("phone")}
                  className={`w-full px-4 py-2 border ${errors.phone ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="(00) 00000-0000"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Nascimento*
                </label>
                <input
                  type="date"
                  id="birthDate"
                  {...register("birthDate")}
                  className={`w-full px-4 py-2 border ${errors.birthDate ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.birthDate && <p className="mt-1 text-sm text-red-600">{errors.birthDate.message}</p>}
              </div>

              <div>
                <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-1">
                  Profissão*
                </label>
                <select
                  id="profession"
                  {...register("profession")}
                  className={`w-full px-4 py-2 border ${errors.profession ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white`}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Selecione sua profissão
                  </option>
                  {professionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.profession && <p className="mt-1 text-sm text-red-600">{errors.profession.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha*
                </label>
                <input
                  type="password"
                  id="password"
                  {...register("password")}
                  className={`w-full px-4 py-2 border ${errors.password ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="••••••••"
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Senha*
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  {...register("confirmPassword")}
                  className={`w-full px-4 py-2 border ${errors.confirmPassword ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center disabled:bg-green-400"
              >
                {isSubmitting ? (
                  "Processando..."
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" /> Cadastrar
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-gray-600">
              Já é associado?{" "}
              <Link to="/login" className="text-blue-700 hover:text-blue-900 font-medium">
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
