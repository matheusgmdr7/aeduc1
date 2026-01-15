import type React from "react"
import { Users, Award, BookOpen, Target, Clock } from "lucide-react"

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">Sobre a Associação</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conheça nossa história, missão e os valores que guiam nossa associação.
          </p>
        </div>

        {/* History Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
            <Clock className="h-6 w-6 mr-2" /> Nossa História
          </h2>
          <p className="text-gray-700 mb-4">
            A Associação de Reitores, Diretores e Professores de Instituições Educacionais foi fundada em 2009 por um
            grupo de educadores visionários que perceberam a necessidade de uma organização que unisse os profissionais
            da educação em todos os níveis.
          </p>
          <p className="text-gray-700 mb-4">
            Desde então, temos crescido constantemente, ampliando nossa rede de associados e nossa influência no cenário
            educacional brasileiro. Ao longo desses anos, a associação tem sido uma voz ativa na defesa da qualidade do
            ensino e na valorização dos profissionais da educação.
          </p>
          <p className="text-gray-700">
            Hoje, contamos com milhares de associados em todo o Brasil, representando instituições de ensino de todos os
            portes e modalidades, desde a educação básica até o ensino superior.
          </p>
        </div>

        {/* Mission, Vision, Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
              <Target className="h-6 w-6 mr-2" /> Missão
            </h2>
            <p className="text-gray-700">
              Fortalecer a comunidade educacional brasileira através da união, representatividade e desenvolvimento
              profissional dos gestores e educadores, contribuindo para a melhoria contínua da qualidade do ensino no
              país.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
              <BookOpen className="h-6 w-6 mr-2" /> Visão
            </h2>
            <p className="text-gray-700">
              Ser reconhecida como a principal referência para profissionais da educação no Brasil, promovendo a
              excelência acadêmica e a inovação pedagógica em todas as instituições de ensino.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
              <Award className="h-6 w-6 mr-2" /> Valores
            </h2>
            <ul className="text-gray-700 space-y-2">
              <li>• Excelência acadêmica</li>
              <li>• Ética e transparência</li>
              <li>• Inovação e criatividade</li>
              <li>• Colaboração e trabalho em equipe</li>
              <li>• Respeito à diversidade</li>
              <li>• Compromisso com a educação</li>
            </ul>
          </div>
        </div>

        {/* Leadership */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
            <Users className="h-6 w-6 mr-2" /> Nossa Liderança
          </h2>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue-900">Antonio dos Santos</h3>
            <p className="text-gray-600">Presidente</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-blue-900 text-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-8 text-center">Nossa Associação em Números</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-4xl font-bold mb-2">10.000+</p>
              <p className="text-lg">Associados</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">200+</p>
              <p className="text-lg">Instituições</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">5+</p>
              <p className="text-lg">Estados</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">15</p>
              <p className="text-lg">Anos de História</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default About

