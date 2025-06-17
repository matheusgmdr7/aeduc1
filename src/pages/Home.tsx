import type React from "react"
import { Link } from "react-router-dom"
import { Users, Award, Building, ArrowRight, GraduationCap, BookMarked, Lightbulb } from "lucide-react"

const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-blue-900 opacity-70"></div>
          <img
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Educação"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Associação de Reitores, Diretores e Professores, Estudantes de Nivel Superior e Funcionários de Instituições Educacionais e com qualificações e experiencias comprovadas em sua área de atuação.</h1>
            <p className="text-xl md:text-2xl mb-8">de Instituições Educacionais</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-md font-medium transition-colors text-lg"
              >
                Associe-se
              </Link>
              <Link
                to="/benefits"
                className="px-8 py-3 bg-white text-blue-900 hover:bg-blue-100 rounded-md font-medium transition-colors text-lg"
              >
                Conheça os Benefícios
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">Por que se associar?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Oferecemos benefícios exclusivos para profissionais da educação que buscam desenvolvimento e
              reconhecimento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-blue-50 p-8 rounded-xl shadow-md transform transition-transform hover:scale-105">
              <div className="bg-blue-900 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-4 text-center">Desenvolvimento Profissional</h3>
              <p className="text-gray-600 text-center">
                Acesso a cursos, workshops e eventos exclusivos para aprimorar suas habilidades e conhecimentos.
              </p>
            </div>

            <div className="bg-blue-50 p-8 rounded-xl shadow-md transform transition-transform hover:scale-105">
              <div className="bg-blue-900 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-4 text-center">Networking Estratégico</h3>
              <p className="text-gray-600 text-center">
                Conecte-se com outros profissionais da educação, compartilhe experiências e crie oportunidades de
                colaboração.
              </p>
            </div>

            <div className="bg-blue-50 p-8 rounded-xl shadow-md transform transition-transform hover:scale-105">
              <div className="bg-blue-900 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-4 text-center">Benefícios Exclusivos</h3>
              <p className="text-gray-600 text-center">
                Descontos especiais em serviços, publicações e eventos relacionados à educação em todo o Brasil.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
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
      </section>

      {/* Programs Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">Nossos Programas</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Conheça algumas das iniciativas que desenvolvemos para nossos associados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-900">
              <div className="flex items-center mb-4">
                <BookMarked className="h-6 w-6 text-blue-900 mr-2" />
                <h3 className="text-xl font-semibold text-blue-900">Publicações Acadêmicas</h3>
              </div>
              <p className="text-gray-600">
                Oportunidades para publicar artigos e pesquisas em revistas especializadas com reconhecimento nacional.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-900">
              <div className="flex items-center mb-4">
                <Lightbulb className="h-6 w-6 text-blue-900 mr-2" />
                <h3 className="text-xl font-semibold text-blue-900">Inovação Educacional</h3>
              </div>
              <p className="text-gray-600">
                Programas de incentivo à inovação pedagógica e tecnológica nas instituições de ensino.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-900">
              <div className="flex items-center mb-4">
                <Building className="h-6 w-6 text-blue-900 mr-2" />
                <h3 className="text-xl font-semibold text-blue-900">Parcerias Institucionais</h3>
              </div>
              <p className="text-gray-600">
                Convênios com instituições nacionais e internacionais para intercâmbio de conhecimento e experiências.
              </p>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link to="/benefits" className="inline-flex items-center text-blue-700 hover:text-blue-900 font-medium">
              Ver todos os programas <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">Depoimentos</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">O que nossos associados dizem sobre a associação</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-6 rounded-lg shadow-md">
              <p className="text-gray-700 italic mb-4">
                "Ser associado transformou minha carreira. Os contatos que fiz e as oportunidades de desenvolvimento
                profissional foram fundamentais para meu crescimento como educador."
              </p>
              <div>
                <p className="font-semibold text-blue-900">Mariana Costa</p>
                <p className="text-sm text-gray-600">Professora Universitária</p>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg shadow-md">
              <p className="text-gray-700 italic mb-4">
                "Os eventos e cursos promovidos são de altíssima qualidade. Como diretor escolar, pude implementar
                várias inovações em minha instituição graças ao conhecimento adquirido."
              </p>
              <div>
                <p className="font-semibold text-blue-900">Ricardo Almeida</p>
                <p className="text-sm text-gray-600">Diretor Escolar</p>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg shadow-md">
              <p className="text-gray-700 italic mb-4">
                "A rede de contatos que construí foi essencial para o crescimento da minha universidade. Além disso, os
                descontos e parcerias proporcionam economia significativa."
              </p>
              <div>
                <p className="font-semibold text-blue-900">Dra. Patrícia Santos</p>
                <p className="text-sm text-gray-600">Reitora</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Junte-se à Associação</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Faça parte da maior associação de profissionais da educação do Brasil e contribua para o futuro do ensino.
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
      </section>
    </div>
  )
}

export default Home

