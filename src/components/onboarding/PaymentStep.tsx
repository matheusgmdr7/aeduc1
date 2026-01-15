"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CreditCard, CheckCircle, ArrowRight } from "lucide-react"
import { initiateAsaasPayment, checkPaymentStatus } from "../../lib/payment"

interface PaymentStepProps {
  onComplete: (paymentId: string) => Promise<void>
  loading: boolean
  userId: string
}

const PaymentStep: React.FC<PaymentStepProps> = ({ onComplete, loading, userId }) => {
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "pix" | "boleto">("credit")
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvc, setCardCvc] = useState("")
  const [paymentId, setPaymentId] = useState("")
  const [paymentUrl, setPaymentUrl] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "completed" | "failed">("pending")
  const [error, setError] = useState("")
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null)

  // Limpar intervalo quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval)
      }
    }
  }, [statusCheckInterval])

  const handlePaymentMethodChange = (method: "credit" | "pix" | "boleto") => {
    setPaymentMethod(method)
  }

  const formatCardNumber = (value: string) => {
    // Remover caracteres não numéricos
    const numbers = value.replace(/\D/g, "")
    // Adicionar espaço a cada 4 dígitos
    const formatted = numbers.replace(/(\d{4})(?=\d)/g, "$1 ")
    return formatted.substring(0, 19) // Limitar a 16 dígitos + 3 espaços
  }

  const formatExpiry = (value: string) => {
    // Remover caracteres não numéricos
    const numbers = value.replace(/\D/g, "")
    // Formatar como MM/YY
    if (numbers.length > 2) {
      return `${numbers.substring(0, 2)}/${numbers.substring(2, 4)}`
    }
    return numbers
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value))
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardExpiry(formatExpiry(e.target.value))
  }

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Limitar a 3 ou 4 dígitos
    const cvc = e.target.value.replace(/\D/g, "").substring(0, 4)
    setCardCvc(cvc)
  }

  const initiatePayment = async () => {
    setError("")

    try {
      const result = await initiateAsaasPayment({
        userId,
        amount: 39.9,
        paymentMethod,
        ...(paymentMethod === "credit" && {
          creditCard: {
            number: cardNumber.replace(/\s/g, ""),
            holderName: cardName,
            expiryMonth: cardExpiry.split("/")[0],
            expiryYear: `20${cardExpiry.split("/")[1]}`,
            cvc: cardCvc,
          },
        }),
      })

      if (!result.success) {
        throw new Error(result.message || "Erro ao processar pagamento")
      }

      setPaymentId(result.paymentId)

      if (paymentMethod === "pix" || paymentMethod === "boleto") {
        setPaymentUrl(result.paymentUrl || "")
        setPaymentStatus("processing")

        // Iniciar verificação periódica do status do pagamento
        const interval = setInterval(async () => {
          const status = await checkPaymentStatus(result.paymentId)
          if (status === "CONFIRMED" || status === "RECEIVED") {
            clearInterval(interval)
            setPaymentStatus("completed")
            await onComplete(result.paymentId)
          } else if (status === "FAILED" || status === "CANCELLED") {
            clearInterval(interval)
            setPaymentStatus("failed")
            setError("Pagamento falhou ou foi cancelado. Por favor, tente novamente.")
          }
        }, 10000) // Verificar a cada 10 segundos

        setStatusCheckInterval(interval)
      } else {
        // Para pagamento com cartão, assumimos que foi processado com sucesso
        setPaymentStatus("completed")
        await onComplete(result.paymentId)
      }
    } catch (err: any) {
      console.error("Erro ao processar pagamento:", err)
      setError(err.message || "Erro ao processar pagamento")
      setPaymentStatus("failed")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (paymentMethod === "credit") {
      // Validar dados do cartão
      if (!cardNumber || !cardName || !cardExpiry || !cardCvc) {
        setError("Por favor, preencha todos os dados do cartão")
        return
      }

      // Validar formato do número do cartão
      if (cardNumber.replace(/\s/g, "").length < 16) {
        setError("Número do cartão inválido")
        return
      }

      // Validar data de expiração
      const [month, year] = cardExpiry.split("/")
      if (!month || !year || month.length !== 2 || year.length !== 2) {
        setError("Data de expiração inválida")
        return
      }

      // Validar CVC
      if (cardCvc.length < 3) {
        setError("CVC inválido")
        return
      }
    }

    await initiatePayment()
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Pagamento da Taxa Associativa</h2>
      <p className="text-gray-600 mb-6">
        Para ativar sua conta, é necessário o pagamento da taxa associativa no valor de R$ 39,90.
      </p>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">{error}</div>}

      {paymentStatus === "completed" ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-6 text-center mb-6">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">Pagamento confirmado!</h3>
          <p className="text-green-700">
            Seu pagamento foi processado com sucesso. Vamos prosseguir para a próxima etapa.
          </p>
        </div>
      ) : paymentStatus === "processing" && paymentUrl ? (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            {paymentMethod === "pix" ? "Pague com PIX" : "Boleto gerado"}
          </h3>

          {paymentMethod === "pix" && (
            <div className="text-center mb-4">
              <p className="text-blue-700 mb-4">
                Escaneie o QR Code abaixo ou copie o código PIX para realizar o pagamento:
              </p>
              <div className="bg-white p-4 rounded-md inline-block mb-4">
                <img src={paymentUrl || "/placeholder.svg"} alt="QR Code PIX" className="max-w-full h-auto" />
              </div>
              <p className="text-sm text-gray-600">
                Após o pagamento, aguarde alguns instantes para a confirmação automática.
              </p>
            </div>
          )}

          {paymentMethod === "boleto" && (
            <div className="text-center">
              <p className="text-blue-700 mb-4">
                Seu boleto foi gerado com sucesso. Clique no botão abaixo para visualizar e imprimir:
              </p>
              <a
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors inline-block mb-4"
              >
                Visualizar Boleto
              </a>
              <p className="text-sm text-gray-600">Após o pagamento, pode levar até 3 dias úteis para a confirmação.</p>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Métodos de pagamento */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-4">Escolha a forma de pagamento:</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  paymentMethod === "credit" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => handlePaymentMethodChange("credit")}
              >
                <div className="flex items-center justify-center mb-2">
                  <CreditCard className="h-6 w-6 text-blue-900" />
                </div>
                <p className="text-center font-medium">Cartão de Crédito</p>
              </div>

              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  paymentMethod === "pix" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => handlePaymentMethodChange("pix")}
              >
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl">🔄</span>
                </div>
                <p className="text-center font-medium">PIX</p>
              </div>

              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  paymentMethod === "boleto" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => handlePaymentMethodChange("boleto")}
              >
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl">📄</span>
                </div>
                <p className="text-center font-medium">Boleto</p>
              </div>
            </div>
          </div>

          {/* Formulário de cartão de crédito */}
          {paymentMethod === "credit" && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-4">Dados do Cartão:</h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="card-number" className="block text-sm font-medium text-gray-700 mb-1">
                    Número do Cartão
                  </label>
                  <input
                    type="text"
                    id="card-number"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    maxLength={19}
                  />
                </div>

                <div>
                  <label htmlFor="card-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome no Cartão
                  </label>
                  <input
                    type="text"
                    id="card-name"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="NOME COMO ESTÁ NO CARTÃO"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="card-expiry" className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Expiração
                    </label>
                    <input
                      type="text"
                      id="card-expiry"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/AA"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      maxLength={5}
                    />
                  </div>

                  <div>
                    <label htmlFor="card-cvc" className="block text-sm font-medium text-gray-700 mb-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      id="card-cvc"
                      value={cardCvc}
                      onChange={handleCvcChange}
                      placeholder="123"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resumo do pagamento */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-4">Resumo do Pagamento:</h3>

            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Taxa associativa:</span>
              <span className="font-medium">R$ 39,90</span>
            </div>

            <div className="border-t border-gray-200 my-2 pt-2 flex justify-between">
              <span className="font-medium">Total:</span>
              <span className="font-bold text-blue-900">R$ 39,90</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors flex items-center"
              disabled={loading}
            >
              {loading ? "Processando..." : "Realizar Pagamento"}
              {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default PaymentStep

