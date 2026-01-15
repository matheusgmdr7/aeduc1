import type React from "react"
import type { User } from "../types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface MemberCardProps {
  user: User
}

const MemberCard: React.FC<MemberCardProps> = ({ user }) => {
  const formattedDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    } catch (e) {
      return dateString
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-blue-200 max-w-sm mx-auto">
      <div className="bg-blue-900 text-white p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center">
          <img
            // Usando uma imagem de placeholder temporária
            src="https://i.ibb.co/wFphQghp/AEDUC-CANECA-01071-AZUL-BOLETIM-45110-CURVAS.png"
            alt="Logo AEDUC"
            className="h-6 w-auto sm:h-7 mr-2"
          />
          <h3 className="text-lg sm:text-xl font-bold">Associação</h3>
        </div>
        <div className="text-xs sm:text-sm">
          <p>ID: AE-{user.id}</p>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="mb-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-900">{user.name}</h2>
          <p className="text-gray-600">{user.profession}</p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">CPF:</span>
            <span>{user.cpf}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Data de Nascimento:</span>
            <span>{formattedDate(user.birthDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Data de Registro:</span>
            <span>{formattedDate(user.registrationDate)}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-100 p-3 sm:p-4 text-center">
        <p className="text-blue-900 font-medium">
          {user.paymentComplete ? "Associado Ativo" : "Pendente de Pagamento"}
        </p>
      </div>
    </div>
  )
}

export default MemberCard

