"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

interface CardSilhouetteProps {
  deliveryDate: string | null
  userName: string
}

const CardSilhouette: React.FC<CardSilhouetteProps> = ({ deliveryDate, userName }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  useEffect(() => {
    if (!deliveryDate) return

    const calculateTimeLeft = () => {
      const difference = new Date(deliveryDate).getTime() - new Date().getTime()

      if (difference <= 0) {
        // Tempo esgotado
        setTimeLeft(null)
        return
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      })
    }

    // Calcular imediatamente
    calculateTimeLeft()

    // Atualizar a cada segundo
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [deliveryDate])

  return (
    <div className="relative">
      {/* Silhueta da carteirinha */}
      <div className="bg-white border-2 border-blue-300 border-dashed rounded-lg p-6 aspect-[1.6/1] opacity-40 shadow-sm">
        <div className="h-full flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-16 h-16 bg-blue-200 rounded-md"></div>
            <div className="w-24 h-8 bg-blue-200 rounded-md"></div>
          </div>

          <div className="space-y-2">
            <div className="w-3/4 h-6 bg-blue-200 rounded-md"></div>
            <div className="w-1/2 h-6 bg-blue-200 rounded-md"></div>
            <div className="w-2/3 h-6 bg-blue-200 rounded-md"></div>
          </div>
        </div>
      </div>

      {/* Overlay com informações */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Carteirinha em produção</h3>
        <p className="text-sm text-gray-700 mb-4">
          Olá {userName.split(" ")[0]}, sua carteirinha física está sendo produzida e será enviada em breve.
        </p>

        {timeLeft ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 w-full max-w-xs">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Tempo estimado de entrega:</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-white p-2 rounded-md">
                <span className="block text-xl font-bold text-blue-900">{timeLeft.days}</span>
                <span className="text-xs text-gray-600">dias</span>
              </div>
              <div className="bg-white p-2 rounded-md">
                <span className="block text-xl font-bold text-blue-900">{timeLeft.hours}</span>
                <span className="text-xs text-gray-600">horas</span>
              </div>
              <div className="bg-white p-2 rounded-md">
                <span className="block text-xl font-bold text-blue-900">{timeLeft.minutes}</span>
                <span className="text-xs text-gray-600">min</span>
              </div>
              <div className="bg-white p-2 rounded-md">
                <span className="block text-xl font-bold text-blue-900">{timeLeft.seconds}</span>
                <span className="text-xs text-gray-600">seg</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 w-full max-w-xs">
            <p className="text-green-800 font-medium">Sua carteirinha já deve ter sido entregue ou está a caminho!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CardSilhouette

