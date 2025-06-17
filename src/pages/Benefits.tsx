import type React from "react"
import { Link } from "react-router-dom"
import { Heart, Shield, Stethoscope, Smile, CreditCard, Zap, ArrowRight } from "lucide-react"

const Benefits: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Benefícios para Associados</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Vantagens exclusivas que fazem a diferença na sua carreira e qualidade de vida
            </p>
          </div>
        </div>
      </section>

      {/* Main Benefits Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            {/* AEDUC Benefits Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-blue-900 p-5">
                <h2 className="text-2xl font-bold text-white text-center">CARTÃO DE BENEFÍCIOS AEDUC</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="flex flex-col justify-center order-2 md:order-1">
                    <div className="space-y-3 sm:space-y-4">
                      <p className="text-gray-700 text-sm sm:text-base">
                        O Cartão de Benefícios AEDUC é exclusivo para nossos associados e oferece benefícios em todo o
                        Brasil.
                      </p>
                      <p className="text-gray-700 text-sm sm:text-base">
                        Além disso, o cartão serve como sua identificação oficial como membro da Associação de Reitores,
                        Diretores e Professores de Instituições Educacionais, facilitando seu acesso a eventos e
                        serviços exclusivos.
                      </p>
                      <div className="pt-4 sm:pt-6">
                        <Link
                          to="/register"
                          className="w-full sm:w-auto inline-flex items-center justify-center px-5 sm:px-6 py-2 sm:py-3 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors font-medium text-sm sm:text-base"
                        >
                          Quero meu cartão de Benefícios
                          <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center order-1 md:order-2 mb-4 md:mb-0">
                    <img
                      src="https://i.ibb.co/jvqHSrQQ/CARTA-O-DE-BENEFI-CIOS.png"
                      alt="Cartão de Benefícios AEDUC"
                      className="max-w-full h-auto rounded-lg shadow-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Health and Wellness Benefits */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-blue-900 mb-8 text-center">Alguns dos Benefícios</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Health Plan */}
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <Stethoscope className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Plano de Saúde</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Condições especiais em planos de saúde nacionais com ampla rede credenciada e cobertura completa.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Descontos de até 30% nas mensalidades</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Extensivo a dependentes diretos</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Carências reduzidas para associados ativos</span>
                  </li>
                </ul>
              </div>

              {/* Dental Plan */}
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <Smile className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Plano Odontológico</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Cobertura odontológica completa com rede nacional de profissionais qualificados.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">✓</span>
                    <span>Tratamentos preventivos e estéticos</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">✓</span>
                    <span>Ortodontia com valores reduzidos</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">✓</span>
                    <span>Atendimento de urgência 24h</span>
                  </li>
                </ul>
              </div>

              {/* Insurance */}
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 p-3 rounded-full mr-4">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Seguro de Vida</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Proteção financeira para você e sua família com coberturas abrangentes.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">✓</span>
                    <span>Cobertura por morte e invalidez (10.000,00)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">✓</span>
                    <span>Assistência funeral familiar (7.000,00)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">✓</span>
                    <span>Acidentes Pessoais (10.000,00)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Additional Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Vantagens */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center mb-6">
                <CreditCard className="h-8 w-8 text-blue-900 mr-3" />
                <h3 className="text-xl font-semibold text-blue-900">Vantagens</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">Assistência Jurídica</h4>
                  <p className="text-sm text-gray-600">
                    Suporte jurídico especializado para questões profissionais e pessoais.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">Telemedicina</h4>
                  <p className="text-sm text-gray-600">
                    Consultas médicas online com profissionais qualificados a qualquer momento.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">Desconto em lojas parceiras</h4>
                  <p className="text-sm text-gray-600">
                    Benefícios exclusivos em estabelecimentos comerciais em todo o Brasil.
                  </p>
                </div>
              </div>
            </div>

            {/* Wellness */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center mb-6">
                <Heart className="h-8 w-8 text-blue-900 mr-3" />
                <h3 className="text-xl font-semibold text-blue-900">Bem-estar Completo</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-full mr-3 mt-1">
                    <Zap className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Programa de Apoio Psicológico</h4>
                    <p className="text-sm text-gray-600">
                      Sessões de terapia online e presencial com valores reduzidos.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-full mr-3 mt-1">
                    <Zap className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Academias e Centros Esportivos</h4>
                    <p className="text-sm text-gray-600">
                      Descontos em mensalidades e planos anuais em redes parceiras.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-full mr-3 mt-1">
                    <Zap className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Workshops de Equilíbrio</h4>
                    <p className="text-sm text-gray-600">
                      Encontros mensais sobre equilíbrio vida-trabalho e gestão do estresse.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-blue-900 mb-8 text-center">O que dizem nossos associados</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-xl shadow-md">
                <p className="text-gray-700 italic mb-4">
                  "O plano de saúde da AEDUC me proporcionou um atendimento de qualidade quando mais precisei, com uma
                  economia significativa."
                </p>
                <div>
                  <p className="font-semibold text-blue-900">Mariana Costa</p>
                  <p className="text-sm text-gray-600">Professora Universitária</p>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-xl shadow-md">
                <p className="text-gray-700 italic mb-4">
                  "Os descontos em cursos de pós-graduação me permitiram continuar meus estudos sem comprometer meu
                  orçamento familiar."
                </p>
                <div>
                  <p className="font-semibold text-blue-900">Ricardo Almeida</p>
                  <p className="text-sm text-gray-600">Diretor Escolar</p>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-xl shadow-md">
                <p className="text-gray-700 italic mb-4">
                  "O seguro de vida oferecido pela AEDUC me dá tranquilidade, sabendo que minha família estará protegida
                  em qualquer situação."
                </p>
                <div>
                  <p className="font-semibold text-blue-900">Dra. Patrícia Santos</p>
                  <p className="text-sm text-gray-600">Reitora</p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Torne-se um Associado</h2>
            <p className="text-lg mb-6 max-w-3xl mx-auto">
              Junte-se a milhares de profissionais da educação e aproveite todos esses benefícios exclusivos.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-md font-medium text-lg inline-block transition-colors"
              >
                Associe-se Agora
              </Link>
              <Link
                to="/contact"
                className="px-8 py-3 bg-white text-blue-900 hover:bg-blue-100 rounded-md font-medium text-lg inline-block transition-colors"
              >
                Fale Conosco
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Benefits

