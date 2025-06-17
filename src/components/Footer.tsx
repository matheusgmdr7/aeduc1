import type React from "react"
import { Link } from "react-router-dom"

const Footer: React.FC = () => {
  return (
    <footer className="bg-blue-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-center mb-6">
          <img
            // Usando uma imagem de placeholder temporária
            src="https://i.ibb.co/wFphQghp/AEDUC-CANECA-01071-AZUL-BOLETIM-45110-CURVAS.png"
            alt="Logo AEDUC"
            className="h-8 w-auto sm:h-12 mix-blend-screen"
          />
        </div>
        <p className="text-blue-200 mb-4 text-xs sm:text-sm text-center"></p>

        <div className="border-t border-blue-800 mt-6 pt-6 text-center text-blue-300 text-xs sm:text-sm">
          <p>
            &copy; {new Date().getFullYear()} Associação de Reitores, Diretores e Professores. Todos os direitos
            reservados.
          </p>
          <p className="mt-2">
            <Link to="/admin-login" className="text-blue-300 hover:text-blue-200 transition-colors">
              Área Administrativa
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

